import { callMetaBuilderAgentResume, type HumanFeedback } from "@/lib/agent/metabuilder-agent";
import { getDatabricksAuth } from "@/lib/auth";

export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    if (agentId !== "metabuilder") {
      return new Response(JSON.stringify({ error: "HITL resume only supported for metabuilder" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      thread_id: string;
      human_feedback: HumanFeedback;
    };

    const { thread_id, human_feedback } = body;

    if (!thread_id) {
      return new Response(JSON.stringify({ error: "Missing thread_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const auth = await getDatabricksAuth();
    const stream = await callMetaBuilderAgentResume(thread_id, human_feedback ?? {}, auth);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    });
  } catch (error) {
    console.error("[API /resume] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
