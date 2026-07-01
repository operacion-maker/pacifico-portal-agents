import { type DatabricksAuthInfo } from "@/types";

/**
 * Adapter to call the MetaBuilder Databricks Model Serving endpoint.
 * This handles the streaming Server-Sent Events (SSE) that the MLflow 
 * PythonModel Generator yields.
 */
export async function callMetaBuilderAgent(
  messages: Array<{ role: string; content: string }>,
  auth: DatabricksAuthInfo,
  threadId?: string
): Promise<ReadableStream<Uint8Array>> {
  const host = process.env.DATABRICKS_HOST;
  const endpointName = process.env.METABUILDER_SERVING_ENDPOINT;

  if (!host || !endpointName) {
    throw new Error("Missing DATABRICKS_HOST or METABUILDER_SERVING_ENDPOINT");
  }

  const url = host.match(/^https?:\/\//)
    ? `${host.replace(/\/$/, "")}/serving-endpoints/${endpointName}/invocations`
    : `https://${host}/serving-endpoints/${endpointName}/invocations`;

  const token = auth.accessToken || process.env.DATABRICKS_TOKEN;
  if (!token && !process.env.DATABRICKS_TOKEN?.startsWith("local-")) {
    throw new Error("No authentication token available");
  }

  // Parse if it's a resume action (the HITL component sends a special string message)
  // Or we can parse the last message to see if it's a JSON command.
  let customInputs: Record<string, string> = {};
  let finalMessages = [...messages];
  const lastMsg = messages[messages.length - 1];

  if (lastMsg && lastMsg.role === "user") {
    try {
      const parsed = JSON.parse(lastMsg.content);
      if (parsed.decision) {
        customInputs = {
          thread_id: threadId ?? "",
          decision: parsed.decision,
          feedback: parsed.feedback || "",
        };
        // We don't send the resume JSON as a regular message to the model
        finalMessages = messages.slice(0, -1); 
      }
    } catch {
      // Not a JSON command, regular flow
      if (threadId) {
        customInputs = { thread_id: threadId };
      }
    }
  }

  const body = {
    messages: finalMessages,
    custom_inputs: customInputs,
  };

  console.log(`[MetaBuilder] POST ${url} with threadId: ${threadId ?? "none"}`);

  const controller = new AbortController();
  // We use a longer timeout because LangGraph might take minutes to evaluate quality/governance
  const timeout = setTimeout(() => controller.abort(), 300_000); 

  try {
    const headers: Record<string, string> = { 
      "Content-Type": "application/json",
      // Important for requesting SSE from Databricks if supported
      "Accept": "text/event-stream" 
    };
    if (token && token !== "local-dev") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MetaBuilder] API Error:", response.status, errorText);
      throw new Error(`Databricks API Error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body from Databricks endpoint");
    }

    // Convert Databricks stream format to Vercel AI SDK Data Stream format
    // Databricks might yield raw strings or SSE chunks. We'll wrap them in `0:"..."` for Vercel.
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
            
            // If the chunk is just raw text emitted by our MLflow Generator, 
            // wrap it in AI SDK text format.
            const data = `0:${JSON.stringify(chunk)}\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // Send finish indicators
          const finishData = `e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0},"isContinued":false}\n`;
          controller.enqueue(encoder.encode(finishData));
          const doneData = `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`;
          controller.enqueue(encoder.encode(doneData));
          
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
