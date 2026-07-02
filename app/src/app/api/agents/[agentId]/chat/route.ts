import { routeToAgent } from "@/lib/agent/agent-router";
import { getDatabricksAuth } from "@/lib/auth";
import { getAgentConfig } from "@/lib/agents/agent-registry";

// Allow up to 5 minutes for agent responses (LLM + tool calls)
export const maxDuration = 300;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    // Validate agent exists
    const agentConfig = getAgentConfig(agentId);
    if (!agentConfig) {
      return new Response(JSON.stringify({ error: `Agent '${agentId}' not found` }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, threadId } = (await req.json()) as {
      messages: Array<{ role: string; content: string }>;
      threadId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("Missing messages", { status: 400 });
    }

    const auth = await getDatabricksAuth();
    const stream = await routeToAgent(agentId, messages, auth, threadId);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (error) {
    console.error("[API /agents/chat] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
