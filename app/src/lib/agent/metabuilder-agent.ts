import { type DatabricksAuthInfo } from "@/types";
import crypto from "crypto";

export interface HumanFeedback {
  general_observations?: string;
  edited_table_comment?: string;
  edited_columns?: Record<string, string>;
}

/**
 * Converts any string into a valid UUID format.
 * Databricks LangGraph state savers strictly require a valid UUID for thread_id.
 */
function toDeterministicUUID(str: string): string {
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Builds the full invocation URL from env vars.
 */
function buildInvokeUrl(endpointName: string): string {
  const host = process.env.DATABRICKS_HOST ?? "";
  const cleanHost = host.match(/^https?:\/\//) ? host.replace(/\/$/, "") : `https://${host}`;
  return `${cleanHost}/serving-endpoints/${endpointName}/invocations`;
}

/**
 * Resolves the auth token. Priority: OBO token → PAT env var.
 */
function resolveToken(auth: DatabricksAuthInfo): string | null {
  return auth.accessToken ?? process.env.DATABRICKS_TOKEN ?? null;
}

/**
 * Converts the MLflow generator response (a streaming JSON array of strings)
 * into a Vercel AI SDK Data Stream (`0:"text"\n`).
 */
function databricksResponseToVercelStream(response: Response): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      let isInsideString = false;
      let isEscaping = false;
      let currentString = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });
          
          for (let i = 0; i < textChunk.length; i++) {
            const char = textChunk[i];
            
            if (!isInsideString) {
              if (char === '"') {
                isInsideString = true;
              }
              continue;
            }
            
            if (isEscaping) {
              currentString += char;
              isEscaping = false;
            } else if (char === '\\') {
              currentString += char;
              isEscaping = true;
            } else if (char === '"') {
              isInsideString = false;
              // Decode the completed JSON string
              try {
                const decoded = JSON.parse('"' + currentString + '"');
                if (decoded) {
                  controller.enqueue(encoder.encode(`0:${JSON.stringify(decoded)}\n`));
                }
              } catch (e) {
                console.error("[MetaBuilder] Failed to parse internal MLflow string:", currentString);
              }
              currentString = "";
            } else {
              currentString += char;
            }
          }
        }

        // Vercel AI SDK termination
        controller.enqueue(encoder.encode(`e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0},"isContinued":false}\n`));
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
      } catch (err) {
        console.error("[MetaBuilder] Stream read error:", err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Core fetch to the MetaBuilder endpoint.
 * NOTE: Do NOT send Accept: text/event-stream — the Databricks endpoint
 * uses its own chunked JSON format, not standard SSE.
 */
async function fetchMetaBuilder(
  payload: Record<string, unknown>,
  auth: DatabricksAuthInfo
): Promise<Response> {
  const endpointName = process.env.METABUILDER_SERVING_ENDPOINT;
  if (!endpointName) throw new Error("Missing METABUILDER_SERVING_ENDPOINT");

  const url = buildInvokeUrl(endpointName);
  const token = resolveToken(auth);
  if (!token) throw new Error("No authentication token available for Databricks");

  const controller = new AbortController();
  // Aumentar a 5 minutos (300,000 ms) porque el agente de Databricks puede tardar hasta 2 minutos
  const timeout = setTimeout(() => controller.abort(), 300_000);

  const payloadString = JSON.stringify(payload);
  console.log(`[MetaBuilder] POST ${url}`);
  console.log(`[MetaBuilder] Payload:`, payloadString);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream",
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MetaBuilder] API Error ${response.status}:`, errorText);
      throw new Error(`Databricks API Error: ${response.status} - ${errorText}`);
    }

    return response;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Contrato A — Initialize a new MetaBuilder session with a FQN.
 */
export async function callMetaBuilderAgent(
  messages: Array<{ role: string; content: string }>,
  auth: DatabricksAuthInfo,
  threadId?: string
): Promise<ReadableStream<Uint8Array>> {
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  const fqn = lastUserMessage?.content ?? "";

  const payload = {
    messages: [{ role: "user", content: fqn }],
    custom_inputs: { thread_id: toDeterministicUUID(threadId ?? `anon-${Date.now()}`) },
  };

  const response = await fetchMetaBuilder(payload, auth);
  return databricksResponseToVercelStream(response);
}

/**
 * Contrato B — Resume a paused MetaBuilder session with HITL feedback.
 */
export async function callMetaBuilderAgentResume(
  threadId: string,
  humanFeedback: HumanFeedback,
  auth: DatabricksAuthInfo
): Promise<ReadableStream<Uint8Array>> {
  const payload = {
    messages: [{ role: "user", content: "Procesar feedback del Data Steward." }],
    custom_inputs: {
      thread_id: toDeterministicUUID(threadId),
      human_feedback: humanFeedback,
    },
  };

  const response = await fetchMetaBuilder(payload, auth);
  return databricksResponseToVercelStream(response);
}
