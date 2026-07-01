import { type DatabricksAuthInfo } from "@/types";

interface DatabricksConfig {
  host: string;
  endpointName: string;
  token: string;
}

async function getOAuthToken(host: string): Promise<string | null> {
  const clientId = process.env.DATABRICKS_CLIENT_ID;
  const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const cleanHost = host.replace(/^https?:\/\//, "");
  const response = await fetch(`https://${cleanHost}/oidc/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "all-apis",
    }),
  });

  if (!response.ok) {
    console.error("[Auth] OAuth token request failed:", response.status);
    return null;
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function resolveToken(auth: DatabricksAuthInfo, host: string): Promise<string | null> {
  // Priority: OBO token → PAT → OAuth
  if (auth.accessToken) {
    console.log("[Auth] Using OBO token from X-Forwarded-Access-Token");
    return Promise.resolve(auth.accessToken);
  }

  const pat = process.env.DATABRICKS_TOKEN;
  if (pat) {
    console.log("[Auth] Using configured DATABRICKS_TOKEN (PAT)");
    return Promise.resolve(pat);
  }

  console.log("[Auth] Attempting OAuth client_credentials");
  return getOAuthToken(host);
}

// Max messages sent to the agent per request (20 turns = 40 messages)
// Used as fallback when no threadId is provided (no server-side memory)
const MAX_CONTEXT_MESSAGES = 40;

function trimMessages(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages;
  const trimmed = messages.slice(-MAX_CONTEXT_MESSAGES);
  if (trimmed[0]?.role === "assistant") {
    return trimmed.slice(1);
  }
  return trimmed;
}

export async function callDatabricksAgent(
  messages: Array<{ role: string; content: string }>,
  auth: DatabricksAuthInfo,
  threadId?: string,
  endpointOverride?: string
): Promise<string> {
  const host = process.env.DATABRICKS_HOST;
  const endpointName = endpointOverride ?? process.env.DATABRICKS_SERVING_ENDPOINT;

  if (!host || !endpointName) {
    throw new Error("Missing DATABRICKS_HOST or DATABRICKS_SERVING_ENDPOINT");
  }

  const token = await resolveToken(auth, host);
  if (!token && !process.env.DATABRICKS_TOKEN?.startsWith("local-")) {
    throw new Error("No authentication token available");
  }

  const url = host.match(/^https?:\/\//)
    ? `${host.replace(/\/$/, "")}/serving-endpoints/${endpointName}/invocations`
    : `https://${host}/serving-endpoints/${endpointName}/invocations`;

  // When threadId is present, Redis holds the conversation history —
  // send only the last user message to avoid duplication.
  // Without threadId, fall back to sending trimmed history.
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  const outMessages = threadId && lastUserMessage
    ? [{ role: lastUserMessage.role, content: lastUserMessage.content }]
    : trimMessages(messages).map(({ role, content }) => ({ role, content }));

  console.log(`[Databricks] POST ${url} with ${outMessages.length} messages (threadId: ${threadId ?? "none"}, total: ${messages.length})`);

  // 4-minute timeout — agent may call multiple tools (KA + Genie + LLM)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240_000);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token && token !== "local-dev") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const body: Record<string, unknown> = { messages: outMessages };
    if (threadId) {
      body.custom_inputs = { thread_id: threadId };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Databricks] API Error:", response.status, errorText);
      throw new Error(`Databricks API Error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    console.log("[Databricks] Raw response keys:", Object.keys(data));
    console.log("[Databricks] Raw response:", JSON.stringify(data).slice(0, 500));
    return parseMlflowResponse(data);
  } finally {
    clearTimeout(timeout);
  }
}

function parseMlflowResponse(data: Record<string, unknown>): string {
  // ChatAgent format: {messages: [{role: "assistant", content: "text", id: "..."}]}
  if (Array.isArray(data.messages) && data.messages.length > 0) {
    const last = data.messages[data.messages.length - 1] as Record<string, unknown>;
    if (typeof last.content === "string") return last.content;
  }

  // Format: {content: "text"}
  if (typeof data.content === "string") {
    return data.content;
  }

  // Format: {predictions: ["text"]} or {predictions: [{content: "text"}]}
  if (Array.isArray(data.predictions) && data.predictions.length > 0) {
    const first = data.predictions[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first !== null && "content" in first) {
      return String((first as { content: string }).content);
    }
  }

  // Format: {output: "text"} or {output: [{content: "text"}]}
  if (data.output !== undefined) {
    if (typeof data.output === "string") return data.output;
    if (Array.isArray(data.output) && data.output.length > 0) {
      const last = data.output[data.output.length - 1] as Record<string, unknown>;
      if (typeof last.content === "string") return last.content;
      if (Array.isArray(last.content)) {
        const textPart = (last.content as Array<{ type: string; text?: string }>).find(
          (p) => p.type === "output_text" || p.type === "text"
        );
        if (textPart?.text) return textPart.text;
      }
    }
  }

  return JSON.stringify(data);
}

export function createDatabricksStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunkSize = 50;

  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        const data = `0:${JSON.stringify(chunk)}\n`;
        controller.enqueue(encoder.encode(data));
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const finishData = `e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0},"isContinued":false}\n`;
      controller.enqueue(encoder.encode(finishData));

      const doneData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
      controller.enqueue(encoder.encode(doneData));

      controller.close();
    },
  });
}

