import { type DatabricksAuthInfo } from "@/types";

export interface HumanFeedback {
  general_observations?: string;
  edited_table_comment?: string;
  edited_columns?: Record<string, string>;
}

/**
 * Adapter to call the MetaBuilder Databricks Model Serving endpoint.
 * Handles the streaming Server-Sent Events (SSE) that the MLflow PythonModel Generator yields.
 *
 * Supports:
 * - Contrato A: FQN string → initializes LangGraph run
 * - Contrato B: human_feedback + thread_id → resumes HITL node
 */
async function buildMetaBuilderRequest(
  payload: Record<string, unknown>,
  auth: DatabricksAuthInfo
): Promise<Response> {
  const host = process.env.DATABRICKS_HOST;
  const endpointName = process.env.METABUILDER_SERVING_ENDPOINT;

  if (!host || !endpointName) {
    throw new Error("Missing DATABRICKS_HOST or METABUILDER_SERVING_ENDPOINT");
  }

  const url = host.match(/^https?:\/\//)
    ? `${host.replace(/\/$/, "")}/serving-endpoints/${endpointName}/invocations`
    : `https://${host}/serving-endpoints/${endpointName}/invocations`;

  const token = auth.accessToken || process.env.DATABRICKS_TOKEN;
  if (!token) {
    throw new Error("No authentication token available");
  }

  const controller = new AbortController();
  // 90s timeout — optimized flow should complete in < 60s
  const timeout = setTimeout(() => controller.abort(), 90_000);

  console.log(`[MetaBuilder] POST ${url} — payload keys: ${Object.keys(payload).join(", ")}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MetaBuilder] API Error:", response.status, errorText);
      throw new Error(`Databricks API Error: ${response.status} - ${errorText}`);
    }

    return response;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function wrapResponseAsVercelStream(response: Response): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Wrap raw text/SSE chunks in Vercel AI SDK data stream format
          const data = `0:${JSON.stringify(chunk)}\n`;
          controller.enqueue(encoder.encode(data));
        }

        const finishData = `e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0},"isContinued":false}\n`;
        controller.enqueue(encoder.encode(finishData));
        const doneData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
        controller.enqueue(encoder.encode(doneData));
      } catch (err) {
        console.error("[MetaBuilder] Stream reading error:", err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
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
    custom_inputs: threadId ? { thread_id: threadId } : {},
  };

  const response = await buildMetaBuilderRequest(payload, auth);
  return wrapResponseAsVercelStream(response);
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
    messages: [{ role: "user", content: "Ajustar borrador según correcciones de la UI." }],
    custom_inputs: {
      thread_id: threadId,
      human_feedback: humanFeedback,
    },
  };

  const response = await buildMetaBuilderRequest(payload, auth);
  return wrapResponseAsVercelStream(response);
}
