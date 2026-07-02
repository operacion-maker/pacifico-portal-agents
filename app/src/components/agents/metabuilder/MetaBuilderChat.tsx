"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Database, ChevronDown } from "lucide-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { StreamingIndicator } from "@/components/chat/StreamingIndicator";
import { PipelineProgressTracker } from "@/components/agents/metabuilder/PipelineProgressTracker";
import { DraftReviewCard } from "@/components/agents/metabuilder/DraftReviewCard";
import { useMetaBuilderStream } from "@/hooks/useMetaBuilderStream";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";

// ── Static catalog/schema/table config ─────────────────────────────────
const CATALOG_DATA: Record<string, Record<string, string[]>> = {
  "udv_desa": {
    "sch_udv_tb": [
      "ha_poliza_vig_gen_core",
      "ha_siniestro_gen_core",
      "ud_poliza_cert_cobro_reaseg_gen_core",
      "hd_dac_poliza_vig_cliente_rol_renta_core",
    ],
    "sch_udv_vw": [
      "ud_poliza_cert_cobro_reaseg_gen_core",
      "vw_poliza_cobro_gen",
      "vw_reaseguro_participacion_gen",
    ],
  },
};

interface FQNSelectorProps {
  onSelect: (fqn: string) => void;
  disabled: boolean;
}

function FQNSelector({ onSelect, disabled }: FQNSelectorProps) {
  const catalogs = Object.keys(CATALOG_DATA);
  const [catalog, setCatalog] = useState(catalogs[0]);
  const [schema, setSchema] = useState(Object.keys(CATALOG_DATA[catalogs[0]])[0]);
  const [table, setTable] = useState(CATALOG_DATA[catalogs[0]][Object.keys(CATALOG_DATA[catalogs[0]])[0]][0]);

  const schemas = Object.keys(CATALOG_DATA[catalog] ?? {});
  const tables = CATALOG_DATA[catalog]?.[schema] ?? [];

  useEffect(() => {
    const newSchemas = Object.keys(CATALOG_DATA[catalog] ?? {});
    const newSchema = newSchemas[0] ?? "";
    const newTables = CATALOG_DATA[catalog]?.[newSchema] ?? [];
    setSchema(newSchema);
    setTable(newTables[0] ?? "");
  }, [catalog]);

  useEffect(() => {
    const newTables = CATALOG_DATA[catalog]?.[schema] ?? [];
    setTable(newTables[0] ?? "");
  }, [catalog, schema]);

  const fqn = `${catalog}.${schema}.${table}`;

  return (
    <div className="border-t border-border bg-gradient-to-r from-slate-50 to-cyan-50/30 p-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-cyan-600" />
          Selecciona el activo a documentar
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* Catalog */}
          <div className="relative">
            <select
              value={catalog}
              onChange={(e) => setCatalog(e.target.value)}
              disabled={disabled}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-white border border-cyan-200 rounded-lg text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              {catalogs.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-600" />
          </div>

          <span className="text-slate-400 font-bold">·</span>

          {/* Schema */}
          <div className="relative">
            <select
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              disabled={disabled}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-white border border-cyan-200 rounded-lg text-teal-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              {schemas.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-teal-600" />
          </div>

          <span className="text-slate-400 font-bold">·</span>

          {/* Table */}
          <div className="relative">
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              disabled={disabled}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-white border border-cyan-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            >
              {tables.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          </div>

          <button
            onClick={() => onSelect(fqn)}
            disabled={disabled || !table}
            className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Documentar tabla →
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 font-mono">{fqn}</p>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

interface MetaBuilderChatProps {
  agentId: string;
  threadId: string;
  username?: string;
}

export function MetaBuilderChat({ agentId, threadId, username }: MetaBuilderChatProps) {
  const { containerRef } = useScrollToBottom<HTMLDivElement>([]);
  // resolvedAssistant: stores only agent replies that came back after HITL (resume flow)
  const [resolvedAssistant, setResolvedAssistant] = useState<Array<{ id: string; role: "assistant"; content: string }>>([]);
  const idCounter = useRef(0);

  const { messages, isLoading, append } = useChat({
    api: `/api/agents/${agentId}/chat`,
    id: threadId,
    body: { threadId },
    headers: username ? { "x-user-id": username } : undefined,
  });

  // Find the last streaming assistant message (currently being streamed)
  const lastAssistant = messages.filter((m) => m.role === "assistant").at(-1);
  const streamState = useMetaBuilderStream(lastAssistant?.content ?? "");

  const handleFQNSelect = useCallback(
    (fqn: string) => {
      // Only append — useChat tracks user message automatically, no manual duplication
      append({ role: "user", content: fqn });
    },
    [append]
  );

  const handleDraftResolved = useCallback((content: string) => {
    const rid = `resolved-${++idCounter.current}`;
    setResolvedAssistant((prev) => [...prev, { id: rid, role: "assistant", content }]);
  }, []);

  // All visible messages: useChat messages (user + streaming assistant) + resolved HITL replies
  const chatMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }));

  const allMessages = [...chatMessages, ...resolvedAssistant];

  return (
    <div className="flex flex-col h-full">
      {/* Pipeline progress (sticky at top when running) */}
      {streamState.currentStep !== "idle" && (
        <div className="border-b border-slate-100">
          <PipelineProgressTracker currentStep={streamState.currentStep} />
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4">
        <div className="max-w-3xl mx-auto py-6 space-y-2">
          {allMessages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {/* Streaming indicator while agent is processing */}
          {isLoading && !streamState.isAwaitingInput && (
            <StreamingIndicator />
          )}

          {/* HITL: DraftReviewCard appears when the graph pauses */}
          {streamState.isAwaitingInput && streamState.draftData && (
            <DraftReviewCard
              draft={streamState.draftData}
              threadId={threadId}
              agentId={agentId}
              onResolved={handleDraftResolved}
            />
          )}
        </div>
      </div>

      {/* FQN Selector (replaces regular chat input for MetaBuilder) */}
      <FQNSelector onSelect={handleFQNSelect} disabled={isLoading || streamState.isAwaitingInput} />
    </div>
  );
}
