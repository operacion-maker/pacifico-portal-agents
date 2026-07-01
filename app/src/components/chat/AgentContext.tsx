"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AgentConfig } from "@/lib/agents/agent-registry";

const AgentContext = createContext<AgentConfig | null>(null);

export function AgentProvider({
  agent,
  children,
}: {
  agent: AgentConfig;
  children: ReactNode;
}) {
  return (
    <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>
  );
}

export function useAgent(): AgentConfig {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return ctx;
}
