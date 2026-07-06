"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  CheckCircle2,
  RotateCcw,
  Database,
  MessageSquarePlus,
  X,
  ChevronDown,
  Tag,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthBadge, ComplianceCallout } from "./GovernanceStatusCard";
import { InlineColumnTable } from "./InlineColumnTable";
import { ReworkSlideOver } from "./ReworkSlideOver";
import type { DraftData } from "@/hooks/useMetaBuilderStream";

// ── Read-More description block ─────────────────────────────────────────
function ReadMoreBlock({
  text,
  onChange,
  disabled,
  isDirty,
}: {
  text: string;
  onChange: (v: string) => void;
  disabled: boolean;
  isDirty: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const LINE_HEIGHT = 20; // px per line (approx. text-sm leading)
  const MAX_LINES = 3;
  const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;

  // auto-resize textarea
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draft, editing]);

  // Detect overflow (> MAX_LINES worth of text)
  const CHARS_PER_LINE = 90;
  const estimatedLines = Math.ceil(text.length / CHARS_PER_LINE);
  const overflows = estimatedLines > MAX_LINES;

  function handleSave() {
    onChange(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(text);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          disabled={disabled}
          rows={3}
          className={cn(
            "w-full text-sm text-slate-700 resize-none rounded-xl border bg-white px-3 py-2.5 leading-relaxed overflow-hidden",
            "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all",
            "placeholder:text-slate-300",
            isDirty ? "border-cyan-300 bg-cyan-50/20" : "border-slate-200"
          )}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#002A54] to-cyan-700 text-white hover:opacity-90 transition-all"
          >
            <CheckCircle2 className="w-3 h-3" />
            Guardar
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative cursor-text rounded-xl border px-3 py-2.5 transition-all",
        "hover:border-slate-300 hover:bg-slate-50/60 border-transparent",
        isDirty && "border-cyan-200 bg-cyan-50/20"
      )}
      onClick={() => !disabled && setEditing(true)}
      title="Haz clic para editar"
    >
      {/* Text with gradient fade for overflow */}
      <div
        className="relative overflow-hidden"
        style={{ maxHeight: expanded || !overflows ? "none" : MAX_HEIGHT }}
      >
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>
        {/* Gradient mask */}
        {!expanded && overflows && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {/* Read more / show less toggle */}
      {overflows && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((p) => !p);
          }}
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px] font-semibold transition-colors",
            "text-cyan-600 hover:text-cyan-700"
          )}
        >
          <ChevronDown
            className={cn(
              "w-3 h-3 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      )}

      {/* Edit hint on hover */}
      {!disabled && (
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-slate-400 font-medium flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
          Editar
        </span>
      )}

      {isDirty && (
        <p className="text-[10px] text-cyan-600 font-medium mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Editado — se anclará al re-generar
        </p>
      )}
    </div>
  );
}

// ── Pill Tag ─────────────────────────────────────────────────────────────
function PillTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <Tag className="w-2.5 h-2.5 text-slate-400" />
      {label}
    </span>
  );
}

// Derive tags from table name (heuristic — replace with real tags when backend sends them)
function inferTags(tableName: string): string[] {
  const tags: string[] = [];
  const name = tableName.toLowerCase();
  if (name.includes("poliza")) tags.push("pólizas");
  if (name.includes("siniestro")) tags.push("siniestros");
  if (name.includes("reaseg")) tags.push("reaseguro");
  if (name.includes("gen_core")) tags.push("core");
  if (name.includes("vig")) tags.push("vigencia");
  if (name.includes("dac")) tags.push("DAC");
  if (name.includes("ha_")) tags.push("histórico");
  if (name.includes("ud_")) tags.push("analítica");
  if (name.includes("hd_")) tags.push("hecho·diario");
  return tags.slice(0, 5);
}

// ── Main Component ───────────────────────────────────────────────────────
interface DraftReviewCardProps {
  draft: DraftData;
  threadId: string;
  agentId: string;
  onResolved: (content: string) => void;
  steward?: string;
  isSubmitting?: boolean;
}

export function DraftReviewCard({
  draft,
  threadId,
  agentId,
  onResolved,
  steward,
  isSubmitting,
}: DraftReviewCardProps) {
  const [tableComment, setTableComment] = useState(draft.tableComment);
  const [columnComments, setColumnComments] = useState<Record<string, string>>(
    Object.fromEntries(draft.columns.map((c) => [c.name, c.comment ?? ""]))
  );
  const [loading, setLoading] = useState(false);
  const [showRework, setShowRework] = useState(false);
  const [showObsPopover, setShowObsPopover] = useState(false);
  const [obsText, setObsText] = useState("");
  const obsRef = useRef<HTMLDivElement>(null);

  // Close obs popover on outside click
  useEffect(() => {
    if (!showObsPopover) return;
    function handler(e: MouseEvent) {
      if (obsRef.current && !obsRef.current.contains(e.target as Node)) {
        setShowObsPopover(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showObsPopover]);

  // Track edits
  const editedCount = draft.columns.filter(
    (col) =>
      columnComments[col.name] !== undefined &&
      columnComments[col.name] !== col.comment
  ).length;
  const tableEdited = tableComment !== draft.tableComment;
  const totalEdited = editedCount + (tableEdited ? 1 : 0);

  // Delta array format
  const computeEditedColumnsDelta = useCallback(
    (): { column_name: string; comment: string }[] =>
      draft.columns
        .filter((col) => {
          const v = columnComments[col.name];
          return v !== undefined && v !== col.comment;
        })
        .map((col) => ({ column_name: col.name, comment: columnComments[col.name] })),
    [draft.columns, columnComments]
  );

  // ── API call ─────────────────────────────────────────────────────────
  async function callResume(humanFeedback: Record<string, unknown>): Promise<string> {
    const res = await fetch(`/api/agents/${agentId}/chat/resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, human_feedback: humanFeedback }),
    });
    if (!res.ok) throw new Error(`Resume failed: ${res.statusText}`);
    const decoder = new TextDecoder();
    const reader = res.body!.getReader();
    let fullContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (line.startsWith("0:")) {
          try { fullContent += JSON.parse(line.slice(2)) as string; } catch { /* skip */ }
        }
      }
    }
    return fullContent;
  }

  // ── Approve ──────────────────────────────────────────────────────────
  async function handleApprove(observations?: string) {
    setLoading(true);
    setShowObsPopover(false);
    try {
      const delta = computeEditedColumnsDelta();
      const humanFeedback: Record<string, unknown> = {
        ...(tableEdited && { edited_table_comment: tableComment }),
        ...(delta.length > 0 && { edited_columns: delta }),
        ...(observations?.trim() && { general_observations: observations.trim() }),
      };
      const content = await callResume(humanFeedback);
      onResolved(content || "✅ Metadatos aprobados y publicados exitosamente en Unity Catalog.");
    } catch (err) {
      console.error("[DraftReviewCard] Approve error:", err);
      onResolved("⚠️ Error al procesar la aprobación. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Rework confirm ───────────────────────────────────────────────────
  async function handleReworkConfirm(payload: {
    general_observations: string;
    column_instructions: Record<string, string>;
  }) {
    setLoading(true);
    setShowRework(false);
    try {
      const delta = computeEditedColumnsDelta();
      const humanFeedback: Record<string, unknown> = {
        ...(payload.general_observations && {
          general_observations: payload.general_observations,
        }),
        ...(Object.keys(payload.column_instructions).length > 0 && {
          column_instructions: payload.column_instructions,
        }),
        ...(delta.length > 0 && { edited_columns: delta }),
      };
      const content = await callResume(humanFeedback);
      onResolved(content || "🔄 Rework solicitado. El agente está re-generando el borrador.");
    } catch (err) {
      console.error("[DraftReviewCard] Rework error:", err);
      onResolved("⚠️ Error al enviar las instrucciones de rework.");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = loading || !!isSubmitting;
  const tags = inferTags(draft.tableName);

  return (
    <>
      <div className="w-full">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-[#002A54] to-cyan-800 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Database className="w-4 h-4 flex-shrink-0 opacity-70" />
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-widest opacity-60 font-semibold mb-0.5">
                    Borrador — Revisión Humana
                  </p>
                  <h2
                    className="text-sm font-bold font-mono truncate leading-snug"
                    title={draft.tableName}
                  >
                    {draft.tableName}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                {totalEdited > 0 && (
                  <span className="text-[9px] font-bold bg-white/20 border border-white/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                    ✏️ {totalEdited} campo{totalEdited > 1 ? "s" : ""} editado{totalEdited > 1 ? "s" : ""}
                  </span>
                )}
                {/* Health Badge */}
                <HealthBadge indicator={draft.governance_indicator} />
              </div>
            </div>

            {/* Pill tags row */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 border border-white/20 text-white/80"
                  >
                    <Tag className="w-2 h-2" />
                    {tag}
                  </span>
                ))}
                {/* AI generated indicator */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-400/20 border border-cyan-300/30 text-cyan-100">
                  <Sparkles className="w-2.5 h-2.5" />
                  Generado por IA
                </span>
              </div>
            )}
          </div>

          {/* ── Action toolbar ──────────────────────────────────────── */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={() => setShowRework(true)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                "border border-amber-200 text-amber-700 hover:bg-amber-50",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Solicitar Rework
            </button>

            {/* Aprobar con Obs. */}
            <div className="relative" ref={obsRef}>
              <button
                onClick={() => setShowObsPopover((p) => !p)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  "border border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400",
                  showObsPopover && "bg-slate-100 border-slate-400",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Aprobar con Obs.
              </button>

              {showObsPopover && (
                <div className="absolute right-0 bottom-full mb-2 w-72 z-30 bg-white rounded-xl border border-slate-200 shadow-xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Observaciones de aprobación
                    </p>
                    <button
                      onClick={() => setShowObsPopover(false)}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    rows={3}
                    placeholder="Ej: Se ajustó la descripción para alinearse con el glosario de negocio…"
                    className="w-full text-xs text-slate-700 resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => handleApprove(obsText)}
                    disabled={!obsText.trim() || isDisabled}
                    className={cn(
                      "mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm",
                      "bg-gradient-to-r from-[#002A54] to-cyan-700 hover:from-[#003366] hover:to-cyan-800 text-white",
                      "disabled:opacity-40 disabled:cursor-not-allowed"
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar Aprobación
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleApprove()}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm",
                totalEdited > 0
                  ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                  : "bg-gradient-to-r from-[#002A54] to-cyan-700 hover:from-[#003366] hover:to-cyan-800 text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {totalEdited > 0 ? "Aprobar con Ediciones" : "Aprobar y Publicar"}
            </button>
          </div>

          {/* ── Table description (Read-More) ────────────────────────── */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Definición de Negocio
              </label>
              {!tableEdited && (
                <span className="inline-flex items-center gap-1 text-[9px] text-cyan-600 font-semibold bg-cyan-50 border border-cyan-100 rounded-full px-1.5 py-0.5">
                  <Sparkles className="w-2 h-2" />
                  IA
                </span>
              )}
            </div>
            <ReadMoreBlock
              text={tableComment}
              onChange={(v) => setTableComment(v)}
              disabled={isDisabled}
              isDirty={tableEdited}
            />
          </div>

          {/* ── Compliance Notes (Governance Callout) ────────────────── */}
          <div className="px-5 pb-4 border-b border-slate-100">
            <ComplianceCallout indicator={draft.governance_indicator} />
          </div>

          {/* ── Inline Column Table ──────────────────────────────────── */}
          <div className="px-5 py-4">
            <InlineColumnTable
              columns={draft.columns}
              disabled={isDisabled}
              editedComments={columnComments}
              onChange={(name, value) =>
                setColumnComments((prev) => ({ ...prev, [name]: value }))
              }
            />
          </div>
        </div>
      </div>

      {/* ── Rework Slide-over ─────────────────────────────────────── */}
      <ReworkSlideOver
        isOpen={showRework}
        onClose={() => setShowRework(false)}
        flaggedColumns={draft.columns
          .filter((col) => {
            const v = columnComments[col.name];
            return v !== undefined && v !== col.comment;
          })
          .map((col) => col.name)}
        allColumns={draft.columns}
        onConfirm={handleReworkConfirm}
        isLoading={loading}
      />
    </>
  );
}
