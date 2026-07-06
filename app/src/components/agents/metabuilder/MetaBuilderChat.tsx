"use client";

import { useState, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Database,
  ChevronDown,
  AlertCircle,
  Eye,
  EyeOff,
  Settings2,
} from "lucide-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { StreamingIndicator } from "@/components/chat/StreamingIndicator";
import { AgentTimeline } from "@/components/agents/metabuilder/AgentTimeline";
import { DraftReviewCard } from "@/components/agents/metabuilder/DraftReviewCard";
import { useMetaBuilderStream } from "@/hooks/useMetaBuilderStream";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { useGovernanceStore } from "@/lib/store/governance";
import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/hooks/useMetaBuilderStream";

// ── Catalog config ────────────────────────────────────────────────────────
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
      "hd_dac_poliza_corto_plazo_cert_gen_core",
    ],
  },
};

// ── FQN Selector ──────────────────────────────────────────────────────────
interface FQNSelectorProps {
  onSelect: (fqn: string) => void;
  disabled: boolean;
}

function FQNSelector({ onSelect, disabled }: FQNSelectorProps) {
  const catalogs = Object.keys(CATALOG_DATA);
  const [catalog, setCatalog] = useState(catalogs[0]);
  const [schema, setSchema] = useState(Object.keys(CATALOG_DATA[catalogs[0]])[0]);
  const [table, setTable] = useState(
    CATALOG_DATA[catalogs[0]][Object.keys(CATALOG_DATA[catalogs[0]])[0]][0]
  );

  const schemas = Object.keys(CATALOG_DATA[catalog] ?? {});
  const tables = CATALOG_DATA[catalog]?.[schema] ?? [];
  const fqn = `${catalog}.${schema}.${table}`;

  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <Database className="w-3 h-3 text-cyan-600" />
        Selecciona el activo a documentar
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* Catalog */}
        <div className="relative">
          <select
            value={catalog}
            onChange={(e) => {
              setCatalog(e.target.value);
              const ns = Object.keys(CATALOG_DATA[e.target.value] ?? {});
              const n = ns[0] ?? "";
              setSchema(n);
              setTable(CATALOG_DATA[e.target.value]?.[n]?.[0] ?? "");
            }}
            disabled={disabled}
            className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-white border border-cyan-200 rounded-lg text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
          >
            {catalogs.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-cyan-600" />
        </div>
        <span className="text-slate-300 font-bold">·</span>
        {/* Schema */}
        <div className="relative">
          <select
            value={schema}
            onChange={(e) => { setSchema(e.target.value); setTable(CATALOG_DATA[catalog]?.[e.target.value]?.[0] ?? ""); }}
            disabled={disabled}
            className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-white border border-cyan-200 rounded-lg text-teal-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
          >
            {schemas.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-teal-600" />
        </div>
        <span className="text-slate-300 font-bold">·</span>
        {/* Table */}
        <div className="relative">
          <select
            value={table}
            onChange={(e) => setTable(e.target.value)}
            disabled={disabled}
            className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-white border border-cyan-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
          >
            {tables.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
        </div>
        <button
          onClick={() => onSelect(fqn)}
          disabled={disabled || !table}
          className="px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-[#002A54] to-cyan-700 hover:from-[#003366] hover:to-cyan-800 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Documentar tabla →
        </button>
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 font-mono">{fqn}</p>
    </div>
  );
}

// ── Rich Skeleton Loader ──────────────────────────────────────────────────
function RichSkeleton({ step }: { step: PipelineStep }) {
  if (step === "idle") return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-pulse">
      {step === "collect_context" && (
        <div className="space-y-5">
          {/* Header placeholder */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-slate-200 to-slate-100" />
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-end gap-2">
              <div className="h-7 w-24 bg-slate-200 rounded-lg" />
              <div className="h-7 w-32 bg-slate-200 rounded-lg" />
              <div className="h-7 w-28 bg-slate-200 rounded-lg" />
            </div>
            {/* Chips — simulating UC metadata being fetched */}
            <div className="px-5 py-4 flex flex-wrap gap-2">
              {["Esquema", "Linaje", "Tags DAC", "Profiling", "Columnas"].map((lbl) => (
                <div
                  key={lbl}
                  className="h-6 bg-cyan-100 rounded-full"
                  style={{ width: `${lbl.length * 9 + 24}px` }}
                />
              ))}
            </div>
            <div className="px-5 pb-4 text-[10px] text-slate-400 italic font-mono">
              ⚙️ Conectando con Unity Catalog…
            </div>
          </div>
        </div>
      )}

      {step === "generate_draft" && (
        <div className="space-y-0 rounded-2xl border border-slate-200 overflow-hidden">
          {/* Card header */}
          <div className="h-16 bg-gradient-to-r from-slate-300 to-slate-200" />
          {/* Toolbar */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex justify-end gap-2">
            <div className="h-7 w-28 bg-slate-200 rounded-lg" />
            <div className="h-7 w-32 bg-slate-200 rounded-lg" />
            <div className="h-7 w-36 bg-slate-200 rounded-lg" />
          </div>
          {/* Description */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-2">
            <div className="h-2 bg-slate-200 rounded w-28" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-5/6" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
          </div>
          {/* Compliance callout */}
          <div className="mx-5 my-3 h-12 bg-emerald-50 border border-emerald-200 rounded-xl" />
          {/* Column rows */}
          <div className="mx-5 mb-4 border border-slate-200 rounded-xl overflow-hidden">
            <div className="h-8 bg-slate-100 border-b border-slate-200" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
                <div className="h-2 bg-slate-200 rounded w-4 flex-shrink-0" />
                <div
                  className="h-5 bg-cyan-100 rounded-full flex-shrink-0"
                  style={{ width: `${80 + (i % 3) * 30}px` }}
                />
                <div
                  className="h-2.5 bg-slate-200 rounded flex-1"
                  style={{ width: `${50 + i * 7}%` }}
                />
                <div className="h-6 w-6 bg-slate-100 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
      {/* Synapse / neural decorative ring — Portal brand */}
      <div className="relative w-24 h-24 mb-5">
        <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
        <div className="absolute inset-3 rounded-full border border-cyan-100/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Database className="w-9 h-9 text-slate-300" />
        </div>
        {/* Orbit nodes */}
        {[0, 90, 180, 270].map((deg, i) => (
          <span
            key={deg}
            className={cn(
              "absolute rounded-full border-2 border-white",
              i % 2 === 0 ? "w-2.5 h-2.5 bg-cyan-200" : "w-2 h-2 bg-slate-200"
            )}
            style={{
              top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 44}px - ${i % 2 === 0 ? 5 : 4}px)`,
              left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 44}px - ${i % 2 === 0 ? 5 : 4}px)`,
            }}
          />
        ))}
        {/* Connector lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-100/50 to-transparent" />
        </div>
      </div>
      <h3 className="text-slate-600 font-semibold mb-2 text-sm">
        Workspace de Gobierno de Datos
      </h3>
      <p className="max-w-sm text-xs leading-relaxed text-slate-400">
        Selecciona un activo con la barra superior{" "}
        <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-500">
          catálogo.esquema.tabla
        </code>{" "}
        y el agente MetaBuilder generará su documentación automáticamente.
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
interface MetaBuilderChatProps {
  agentId: string;
  threadId: string;
  username?: string;
}

export function MetaBuilderChat({ agentId, threadId, username }: MetaBuilderChatProps) {
  const { containerRef } = useScrollToBottom<HTMLDivElement>([]);
  const [resolvedAssistant, setResolvedAssistant] = useState<
    Array<{ id: string; role: "assistant"; content: string }>
  >([]);
  const idCounter = useRef(0);

  const { auditModeEnabled, toggleAuditMode } = useGovernanceStore();

  const { messages, isLoading, append, error } = useChat({
    api: `/api/agents/${agentId}/chat`,
    id: threadId,
    body: { threadId },
    headers: username ? { "x-user-id": username } : undefined,
  });

  const lastAssistant = messages.filter((m) => m.role === "assistant").at(-1);
  const streamState = useMetaBuilderStream(lastAssistant?.content ?? "");

  const handleFQNSelect = useCallback(
    (fqn: string) => { append({ role: "user", content: fqn }); },
    [append]
  );

  const handleDraftResolved = useCallback((content: string) => {
    const rid = `resolved-${++idCounter.current}`;
    setResolvedAssistant((prev) => [...prev, { id: rid, role: "assistant", content }]);
  }, []);

  const chatMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }));

  const allMessages = [...chatMessages, ...resolvedAssistant];

  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-white text-sm">

      {/* ══ TOP TOOLBAR ═══════════════════════════════════════════════════ */}
      <div className="px-5 py-3 border-b border-slate-100 bg-white shadow-sm z-10 flex items-start justify-between gap-4">
        <FQNSelector
          onSelect={handleFQNSelect}
          disabled={isLoading || streamState.isAwaitingInput}
        />
        {/* Audit toggle */}
        <button
          onClick={toggleAuditMode}
          title={auditModeEnabled ? "Ocultar logs" : "Ver logs del agente"}
          className={cn(
            "mt-6 flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors border",
            auditModeEnabled
              ? "bg-slate-800 text-white border-slate-700"
              : "text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50"
          )}
        >
          {auditModeEnabled ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <Settings2 className="w-3 h-3" />
        </button>
      </div>

      {/* ══ AGENT TIMELINE ════════════════════════════════════════════════ */}
      <AgentTimeline
        currentStep={streamState.currentStep}
        progressMessages={streamState.progressMessages}
      />

      {/* ══ WORKSPACE BODY ════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto bg-white">

        {streamState.draftData ? (
          /* Draft — fade-in slide-up */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
            <DraftReviewCard
              draft={streamState.draftData}
              threadId={threadId}
              agentId={agentId}
              onResolved={handleDraftResolved}
              steward={username}
            />
          </div>
        ) : isLoading && streamState.currentStep !== "idle" ? (
          /* Rich skeleton while pipeline runs */
          <div className="p-6">
            <RichSkeleton step={streamState.currentStep} />
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Error banner */}
        {error && (
          <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-white p-3 text-xs text-red-800 flex items-start gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-0.5">Error al comunicarse con el Agente</p>
              <p className="break-all opacity-80">
                {error.message || "Ocurrió un error inesperado al conectar con el servidor."}
              </p>
            </div>
          </div>
        )}

        {/* Audit log panel */}
        {auditModeEnabled && (
          <div ref={containerRef} className="mx-6 mb-4 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex-1">
                Logs del Agente
              </p>
              {isLoading && <StreamingIndicator />}
            </div>
            <div className="bg-slate-900 px-4 py-3 space-y-2 max-h-64 overflow-y-auto">
              {allMessages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {allMessages.length === 0 && (
                <p className="text-[10px] text-slate-500 italic">
                  Sin logs aún — inicia el pipeline para ver la actividad del agente.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
