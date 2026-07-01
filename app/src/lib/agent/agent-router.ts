import { getMockResponse, createMockStream } from "./mock-agent";
import { getMetaBuilderMockResponse } from "./metabuilder-mock";
import { callDatabricksAgent, createDatabricksStream } from "./databricks-agent";
import type { DatabricksAuthInfo } from "@/types";

type AgentMode = "mock" | "databricks";

function getAgentMode(): AgentMode {
  const mode = process.env.AGENT_MODE || "mock";
  if (mode === "databricks") return "databricks";
  return "mock";
}

import { callMetaBuilderAgent } from "./metabuilder-agent";

/**
 * Get the Databricks Model Serving endpoint name for a given agent.
 */
function getEndpointForAgent(agentId: string): string | undefined {
  const endpointMap: Record<string, string | undefined> = {
    modelatorx: process.env.DATABRICKS_SERVING_ENDPOINT,
    metabuilder: process.env.METABUILDER_SERVING_ENDPOINT,
  };
  return endpointMap[agentId] ?? process.env.DATABRICKS_SERVING_ENDPOINT;
}

/**
 * Route a chat request to the appropriate agent backend.
 *
 * @param agentId - The agent identifier (e.g., "modelatorx", "metabuilder")
 * @param messages - Chat message history
 * @param auth - Databricks authentication info
 * @param threadId - Optional thread ID for session continuity
 */
export async function routeToAgent(
  agentId: string,
  messages: Array<{ role: string; content: string }>,
  auth: DatabricksAuthInfo,
  threadId?: string
): Promise<ReadableStream<Uint8Array>> {
  const mode = getAgentMode();
  console.log(`[Router] Agent: ${agentId}, mode: ${mode}, threadId: ${threadId ?? "none"}`);

  if (mode === "mock") {
    if (agentId === "metabuilder") {
      const response = getMetaBuilderMockResponse();
      return createMockStream(response);
    }
    
    // Default mock response for modelatorx and others
    const response = getMockResponse();
    return createMockStream(response);
  }

  // Databricks mode
  if (agentId === "metabuilder") {
    return await callMetaBuilderAgent(messages, auth, threadId);
  }

  // Default behavior for ModelatorX and others: keeps querying the old endpoint handler
  const endpointOverride = getEndpointForAgent(agentId);
  const responseText = await callDatabricksAgent(messages, auth, threadId, endpointOverride);
  return createDatabricksStream(responseText);
}


