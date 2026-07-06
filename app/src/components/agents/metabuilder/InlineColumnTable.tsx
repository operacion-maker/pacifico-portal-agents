"use client";

import { useState, useRef, useCallback } from "react";
import { Pencil, PanelRight, Pin, Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDraft } from "@/hooks/useMetaBuilderStream";
import { ColumnDrawer } from "./ColumnDrawer";

interface InlineColumnTableProps {
  columns: ColumnDraft[];
  disabled?: boolean;
  editedComments: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

// Characters before we show truncation in read mode
const TRUNCATE_AT = 80;

/**
 * Databricks-style inline column table.
 * - Read mode: comments are plain text, truncated at ~80 chars with ellipsis.
 *   Hover reveals full text via title attribute.
 * - Edit mode (on click): single-line <input> for quick edits.
 * - Advanced (PanelRight button): opens ColumnDrawer for long descriptions.
 * - AI indicator (✨): shown on columns with non-empty original AI comment.
 */
export function InlineColumnTable({
  columns,
  disabled = false,
  editedComments,
  onChange,
}: InlineColumnTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [drawerColumn, setDrawerColumn] = useState<ColumnDraft | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Inline edit handlers ─────────────────────────────────────────
  function startEdit(col: ColumnDraft) {
    if (disabled) return;
    setEditingCell(col.name);
    setInlineValue(editedComments[col.name] ?? col.comment ?? "");
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function commitEdit(colName: string) {
    onChange(colName, inlineValue);
    setEditingCell(null);
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  function handleKeyDown(e: React.KeyboardEvent, colName: string) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(colName); }
    if (e.key === "Escape") cancelEdit();
  }

  // ── Drawer handlers ──────────────────────────────────────────────
  const openDrawer = useCallback((col: ColumnDraft) => {
    setDrawerColumn(col);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const saveDrawer = useCallback((colName: string, value: string) => {
    onChange(colName, value);
  }, [onChange]);

  const editedCount = columns.filter((c) => {
    const v = editedComments[c.name];
    return v !== undefined && v !== c.comment;
  }).length;

  return (
    <>
      <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden">

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Columnas
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              ({columns.length})
            </span>
            {editedCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-100 text-cyan-700 border border-cyan-200">
                <Pin className="w-2.5 h-2.5" />
                {editedCount} editada{editedCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-[9px] text-slate-400 italic hidden sm:block">
            Clic para editar · <span className="text-cyan-500 not-italic">⊞</span> edición avanzada
          </p>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-[10px] text-slate-500 uppercase tracking-wider w-8 select-none">#</th>
                <th className="px-3 py-2 text-left font-bold text-[10px] text-slate-500 uppercase tracking-wider min-w-[140px]">Columna</th>
                <th className="px-4 py-2 text-left font-bold text-[10px] text-slate-500 uppercase tracking-wider w-full">
                  <span className="flex items-center gap-1.5">
                    Descripción
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-normal text-cyan-500 normal-case">
                      <Sparkles className="w-2.5 h-2.5" /> IA
                    </span>
                  </span>
                </th>
                <th className="px-3 py-2 text-center font-bold text-[10px] text-slate-500 uppercase tracking-wider w-10">⊞</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => {
                const current = editedComments[col.name] ?? col.comment ?? "";
                const isEdited =
                  editedComments[col.name] !== undefined &&
                  editedComments[col.name] !== col.comment;
                const isEditing = editingCell === col.name;
                const isAiGenerated = !!col.comment && col.comment.trim().length > 0;
                const isTruncated = current.length > TRUNCATE_AT;
                const displayText = isTruncated ? current.slice(0, TRUNCATE_AT) + "…" : current;

                return (
                  <tr
                    key={col.name}
                    className={cn(
                      "border-b border-slate-100 transition-colors group",
                      isEdited
                        ? "bg-cyan-50/50 hover:bg-cyan-50/70"
                        : idx % 2 === 0
                        ? "bg-white hover:bg-slate-50/60"
                        : "bg-slate-50/20 hover:bg-slate-50/60"
                    )}
                  >
                    {/* # */}
                    <td className="px-3 py-2.5 text-slate-400 text-[10px] font-mono select-none align-top pt-3">
                      {idx + 1}
                    </td>

                    {/* Column name */}
                    <td className="px-3 py-2.5 align-top pt-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <code className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded whitespace-nowrap font-mono">
                          {col.name}
                        </code>
                        {isEdited ? (
                          <Pin className="w-2.5 h-2.5 text-cyan-500 flex-shrink-0" />
                        ) : isAiGenerated ? (
                          <Sparkles className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0 opacity-60" aria-label="Generado por IA" />
                        ) : null}
                      </div>
                    </td>

                    {/* Description — inline editable */}
                    <td className="px-4 py-2.5 align-middle w-full">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            ref={inputRef}
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, col.name)}
                            onBlur={() => commitEdit(col.name)}
                            className="flex-1 text-xs text-slate-700 bg-white border border-cyan-400 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
                            placeholder="Describe esta columna…"
                          />
                          <button
                            onMouseDown={(e) => { e.preventDefault(); commitEdit(col.name); }}
                            className="p-1 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors flex-shrink-0"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "group/cell flex items-center gap-2 cursor-text rounded-lg px-2 py-1 -mx-2 -my-1",
                            "hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                          )}
                          onClick={() => startEdit(col)}
                          title={isTruncated ? current : undefined}
                        >
                          <span
                            className={cn(
                              "flex-1 text-xs leading-relaxed",
                              isEdited
                                ? "text-slate-800 font-medium"
                                : "text-slate-500",
                              !current && "italic text-slate-300"
                            )}
                          >
                            {current ? displayText : "Sin descripción"}
                          </span>
                          {/* Hover pencil */}
                          {!disabled && (
                            <Pencil className="w-3 h-3 text-slate-300 group-hover/cell:text-cyan-500 flex-shrink-0 opacity-0 group-hover/cell:opacity-100 transition-all" />
                          )}
                        </div>
                      )}
                    </td>

                    {/* Advanced edit button */}
                    <td className="px-3 py-2.5 text-center align-middle">
                      <button
                        onClick={() => openDrawer(col)}
                        disabled={disabled}
                        className={cn(
                          "inline-flex items-center justify-center p-1.5 rounded-lg transition-all",
                          "text-slate-300 hover:text-[#002A54] hover:bg-slate-100 group-hover:text-slate-400",
                          "disabled:opacity-40 disabled:cursor-not-allowed"
                        )}
                        title="Edición avanzada"
                      >
                        <PanelRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Column Drawer ────────────────────────────────────────────── */}
      <ColumnDrawer
        column={drawerColumn}
        currentComment={
          drawerColumn
            ? (editedComments[drawerColumn.name] ?? drawerColumn.comment ?? "")
            : ""
        }
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onSave={saveDrawer}
      />
    </>
  );
}
