"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, RotateCcw, XCircle, Edit3, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { GovernanceStatusCard } from "./GovernanceStatusCard";
import type { DraftData } from "@/hooks/useMetaBuilderStream";

interface DraftReviewCardProps {
  draft: DraftData;
  threadId: string;
  agentId: string;
  onResolved: (content: string) => void;
  isSubmitting?: boolean;
}

export function DraftReviewCard({ draft, threadId, agentId, onResolved, isSubmitting }: DraftReviewCardProps) {
  const [tableComment, setTableComment] = useState(draft.tableComment);
  const [columnComments, setColumnComments] = useState<Record<string, string>>(
    Object.fromEntries(draft.columns.map((c) => [c.name, c.comment]))
  );
  const [generalObservations, setGeneralObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [showObservations, setShowObservations] = useState(false);

  const computeEditedColumns = useCallback((): Record<string, string> => {
    const edited: Record<string, string> = {};
    for (const col of draft.columns) {
      if (columnComments[col.name] !== col.comment) {
        edited[col.name] = columnComments[col.name];
      }
    }
    return edited;
  }, [draft.columns, columnComments]);

  const computeEditedTableComment = useCallback((): string | undefined => {
    return tableComment !== draft.tableComment ? tableComment : undefined;
  }, [tableComment, draft.tableComment]);

  async function submitFeedback(decision: "approve" | "reject") {
    setLoading(true);
    try {
      const editedColumns = computeEditedColumns();
      const editedTableComment = computeEditedTableComment();
      const hasEdits = Object.keys(editedColumns).length > 0 || !!editedTableComment;

      const humanFeedback = {
        general_observations: generalObservations || undefined,
        edited_table_comment: editedTableComment,
        edited_columns: Object.keys(editedColumns).length > 0 ? editedColumns : undefined,
      };

      // If approving with no edits → send an empty feedback (triggers approve in agent)
      const feedbackPayload = decision === "approve" && !hasEdits && !generalObservations
        ? {}
        : humanFeedback;

      const res = await fetch(`/api/agents/${agentId}/chat/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          human_feedback: decision === "reject" ? { general_observations: "Rechazado por el Data Steward." } : feedbackPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Resume failed: ${res.statusText}`);
      }

      const decoder = new TextDecoder();
      const reader = res.body!.getReader();
      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Now that the backend sends plain text (Option B), just append the chunk
        fullContent += chunk;
      }

      onResolved(fullContent || (decision === "approve" ? "✅ Metadatos aprobados y publicados exitosamente en Unity Catalog." : "❌ Propuesta rechazada."));
    } catch (err) {
      console.error("[DraftReviewCard] Submit error:", err);
      onResolved("⚠️ Error al procesar la respuesta. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const hasChanges = Object.keys(computeEditedColumns()).length > 0 || !!computeEditedTableComment();
  const isDisabled = loading || isSubmitting;

  return (
    <div className="mx-auto max-w-3xl px-4 py-3 w-full">
      <div className="rounded-2xl border border-cyan-100 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-500 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Database className="w-5 h-5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest opacity-70 font-semibold">Borrador de Metadatos</p>
                <h2 className="text-sm font-bold truncate" title={draft.tableName}>{draft.tableName}</h2>
              </div>
            </div>
            <div className="flex-shrink-0">
              <GovernanceStatusCard indicator={draft.governance_indicator} />
            </div>
          </div>
        </div>

        {/* Table comment */}
        <div className="px-5 py-4 border-b border-slate-100">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            <Edit3 className="w-3 h-3" />
            Descripción de la Tabla
          </label>
          <textarea
            value={tableComment}
            onChange={(e) => setTableComment(e.target.value)}
            rows={3}
            disabled={isDisabled}
            className={cn(
              "w-full text-sm text-slate-700 resize-none rounded-lg border bg-slate-50/50 px-3 py-2",
              "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all",
              tableComment !== draft.tableComment
                ? "border-cyan-300 bg-cyan-50/30"
                : "border-slate-200"
            )}
          />
          {tableComment !== draft.tableComment && (
            <p className="text-[10px] text-cyan-600 mt-1 font-medium">✏️ Editado — se anclará al re-generar</p>
          )}
        </div>

        {/* Columns grid */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
            Columnas ({draft.columns.length})
          </p>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {draft.columns.map((col) => {
              const isEdited = columnComments[col.name] !== col.comment;
              return (
                <div key={col.name} className={cn(
                  "rounded-lg border p-3 transition-colors",
                  isEdited ? "border-cyan-200 bg-cyan-50/30" : "border-slate-100 bg-slate-50/50"
                )}>
                  <div className="flex items-center justify-between mb-1.5">
                    <code className="text-xs font-bold text-cyan-700 bg-cyan-100 px-1.5 py-0.5 rounded">
                      {col.name}
                    </code>
                    {isEdited && (
                      <span className="text-[10px] text-cyan-600 font-medium">✏️ Anclado</span>
                    )}
                  </div>
                  <textarea
                    value={columnComments[col.name] ?? ""}
                    onChange={(e) =>
                      setColumnComments((prev) => ({ ...prev, [col.name]: e.target.value }))
                    }
                    rows={2}
                    disabled={isDisabled}
                    className={cn(
                      "w-full text-xs text-slate-600 resize-none rounded border bg-white px-2 py-1.5",
                      "focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-transparent transition-all",
                      isEdited ? "border-cyan-300" : "border-slate-200"
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Observations (collapsible) */}
        <div className="px-5 py-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setShowObservations(!showObservations)}
            className="text-xs text-slate-500 hover:text-cyan-600 transition-colors font-medium"
          >
            {showObservations ? "▾" : "▸"} Observaciones generales para el rework
          </button>
          {showObservations && (
            <textarea
              value={generalObservations}
              onChange={(e) => setGeneralObservations(e.target.value)}
              rows={2}
              disabled={isDisabled}
              placeholder="Ej: Enfocar la tabla hacia el impacto financiero del coaseguro..."
              className="mt-2 w-full text-xs text-slate-600 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-transparent transition-all"
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 bg-slate-50/50 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={() => submitFeedback("reject")}
            disabled={isDisabled}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>

          <button
            onClick={() => submitFeedback("approve")}
            disabled={isDisabled}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              hasChanges
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            )}
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : hasChanges ? (
              <RotateCcw className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {hasChanges ? "Enviar Rework" : "Aprobar y Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
