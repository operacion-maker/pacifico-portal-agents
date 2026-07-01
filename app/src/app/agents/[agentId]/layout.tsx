"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getAgentConfig } from "@/lib/agents/agent-registry";
import { AgentProvider } from "@/components/chat/AgentContext";

export default function AgentChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);
  const agent = getAgentConfig(agentId);

  if (!agent) {
    notFound();
  }

  return (
    <AgentProvider agent={agent}>
      <div data-agent={agentId} className="flex h-screen bg-background">
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
    </AgentProvider>
  );
}
