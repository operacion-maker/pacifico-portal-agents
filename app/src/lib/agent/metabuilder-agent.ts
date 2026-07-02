import { type DatabricksAuthInfo } from "@/types";

export interface HumanFeedback {
  general_observations?: string;
  edited_table_comment?: string;
  edited_columns?: Record<string, string>;
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
 * Converts the Databricks model serving response (which returns chunks as
 * JSON arrays of strings) into a Vercel AI SDK Data Stream.
 *
 * Databricks streaming format per line:
 *   ["chunk1", "chunk2"]
 * or just a plain string.
 */
function databricksResponseToVercelStream(response: Response): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split("\n");
          // Keep incomplete last line in buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            let text = "";
            try {
              // Databricks format: JSON array of strings ["chunk1", "chunk2"]
              const parsed = JSON.parse(trimmed) as unknown;
              if (Array.isArray(parsed)) {
                text = parsed.map((s) => String(s)).join("");
              } else if (typeof parsed === "string") {
                text = parsed;
              } else {
                text = trimmed;
              }
            } catch {
              // Plain text chunk
              text = trimmed;
            }

            if (text) {
              const data = `0:${JSON.stringify(text)}\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
        }

        // Flush any remaining buffer
        if (buffer.trim()) {
          const data = `0:${JSON.stringify(buffer)}\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Vercel AI SDK stream termination
        controller.enqueue(
          encoder.encode(`e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0},"isContinued":false}\n`)
        );
        controller.enqueue(
          encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`)
        );
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
  const timeout = setTimeout(() => controller.abort(), 90_000);

  console.log(`[MetaBuilder] POST ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        // NOTE: No "Accept: text/event-stream" — endpoint uses chunked JSON format
      },
      body: JSON.stringify(payload),
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
    custom_inputs: { thread_id: threadId ?? `anon-${Date.now()}` },
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
      thread_id: threadId,
      human_feedback: humanFeedback,
    },
  };

  const response = await fetchMetaBuilder(payload, auth);
  return databricksResponseToVercelStream(response);
}
