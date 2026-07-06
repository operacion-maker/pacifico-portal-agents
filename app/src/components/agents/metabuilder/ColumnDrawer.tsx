"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Info, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDraft } from "@/hooks/useMetaBuilderStream";

interface ColumnDrawerProps {
  column: ColumnDraft | null;
  currentComment: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (columnName: string, comment: string) => void;
}

export function ColumnDrawer({
  column,
  currentComment,
  isOpen,
  onClose,
  onSave,
}: ColumnDrawerProps) {
  const [draft, setDraft] = useState(currentComment);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft when column changes
  useEffect(() => {
    setDraft(currentComment);
  }, [currentComment, column?.name]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const isDirty = draft !== currentComment;

  function handleSave() {
    if (column) {
      onSave(column.name, draft);
      onClose();
    }
  }

  function handleReset() {
    setDraft(column?.comment ?? "");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — semi-transparent, keeps table visible */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[360px] flex flex-col bg-white border-l border-slate-200 shadow-2xl"
          >
            {/* Header — Portal brand */}
            <div className="flex items-start justify-between px-5 py-4 bg-gradient-to-r from-[#002A54] to-cyan-800 text-white flex-shrink-0">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest opacity-60 font-semibold mb-0.5">
                  Edición Avanzada · Columna
                </p>
                <h3
                  className="text-sm font-bold font-mono truncate"
                  title={column?.name}
                >
                  {column?.name ?? "—"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 ml-3 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta info chips */}
            {column && (
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                  <Info className="w-2.5 h-2.5" />
                  string
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-white border border-slate-100 rounded-full px-2 py-0.5">
                  <Tag className="w-2.5 h-2.5" />
                  Sin tags
                </span>
              </div>
            )}

            {/* Description editor */}
            <div className="flex-1 flex flex-col px-5 py-5 overflow-y-auto">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Descripción
              </label>

              {/* Original (reference) */}
              {column?.comment && column.comment !== draft && (
                <div className="mb-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Original IA
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">{column.comment}</p>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={8}
                placeholder="Describe la semántica de negocio de esta columna…"
                className={cn(
                  "w-full text-sm text-slate-700 resize-none rounded-xl border bg-white px-3 py-2.5 leading-relaxed",
                  "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all",
                  "placeholder:text-slate-300",
                  isDirty ? "border-cyan-300 bg-cyan-50/20" : "border-slate-200"
                )}
              />

              {isDirty && (
                <p className="text-[10px] text-cyan-600 font-medium mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Cambios sin guardar
                </p>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
              {isDirty && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  isDirty
                    ? "bg-gradient-to-r from-[#002A54] to-cyan-700 hover:from-[#003366] hover:to-cyan-800 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                <Save className="w-3.5 h-3.5" />
                Guardar
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
