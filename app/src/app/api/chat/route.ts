import { routeToAgent } from "@/lib/agent/agent-router";
import { getDatabricksAuth } from "@/lib/auth";

// Allow up to 5 minutes for agent responses (LLM + tool calls)
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { messages, threadId } = (await req.json()) as {
      messages: Array<{ role: string; content: string }>;
      threadId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Missing messages", { status: 400 });
    }

    const auth = await getDatabricksAuth();
    const stream = await routeToAgent("modelatorx", messages, auth, threadId);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (error) {
    console.error("[API /chat] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
