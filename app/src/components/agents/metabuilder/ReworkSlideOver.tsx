"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDraft } from "@/hooks/useMetaBuilderStream";

interface ReworkSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  /** Columns that are flagged for rework (pre-filled from grid selection) */
  flaggedColumns?: string[];
  allColumns: ColumnDraft[];
  onConfirm: (payload: {
    general_observations: string;
    column_instructions: Record<string, string>;
  }) => void;
  isLoading?: boolean;
}

export function ReworkSlideOver({
  isOpen,
  onClose,
  flaggedColumns = [],
  allColumns,
  onConfirm,
  isLoading = false,
}: ReworkSlideOverProps) {
  const [generalObs, setGeneralObs] = useState("");
  const [colInstructions, setColInstructions] = useState<Record<string, string>>(
    () => Object.fromEntries(flaggedColumns.map((c) => [c, ""]))
  );
  const [expandedCol, setExpandedCol] = useState<string | null>(flaggedColumns[0] ?? null);

  const handleColInstruction = useCallback((colName: string, val: string) => {
    setColInstructions((prev) => ({ ...prev, [colName]: val }));
  }, []);

  const handleAddColumn = useCallback(
    (colName: string) => {
      if (colName && !(colName in colInstructions)) {
        setColInstructions((prev) => ({ ...prev, [colName]: "" }));
        setExpandedCol(colName);
      }
    },
    [colInstructions]
  );

  const handleRemoveCol = useCallback((colName: string) => {
    setColInstructions((prev) => {
      const next = { ...prev };
      delete next[colName];
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm({
      general_observations: generalObs,
      column_instructions: colInstructions,
    });
    setGeneralObs("");
    setColInstructions({});
  }, [generalObs, colInstructions, onConfirm]);

  const availableCols = allColumns
    .map((c) => c.name)
    .filter((n) => !(n in colInstructions));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-500 to-orange-500">
              <div className="flex items-center gap-2 text-white">
                <RotateCcw className="w-4 h-4" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-75 font-semibold">
                    Panel de Corrección
                  </p>
                  <h2 className="text-sm font-bold">Solicitar Rework al Agente</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info banner */}
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Las instrucciones que escribas se enviarán directamente al agente de IA como contexto
                prioritario (<strong>Prompt Anchoring</strong>). Los campos sin instrucción se re-generarán libremente.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* General observations */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Instrucciones Generales
                </label>
                <textarea
                  value={generalObs}
                  onChange={(e) => setGeneralObs(e.target.value)}
                  rows={3}
                  placeholder="Ej: Enfocar la tabla hacia el impacto financiero del coaseguro, mencionar que es una vista Silver Layer..."
                  className="w-full text-xs text-slate-700 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Per-column instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Instrucciones por Columna ({Object.keys(colInstructions).length})
                  </label>

                  {/* Add column dropdown */}
                  {availableCols.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAddColumn(e.target.value);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="text-[10px] border border-dashed border-slate-300 rounded px-2 py-1 text-slate-500 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="" disabled>+ Agregar columna</option>
                      {availableCols.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  {Object.keys(colInstructions).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                      Selecciona columnas del menú o desde la grilla principal
                    </p>
                  )}
                  {Object.entries(colInstructions).map(([colName, instruction]) => (
                    <div
                      key={colName}
                      className="rounded-lg border border-amber-200 bg-amber-50/30 overflow-hidden"
                    >
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 text-left"
                        onClick={() =>
                          setExpandedCol(expandedCol === colName ? null : colName)
                        }
                      >
                        <code className="text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                          {colName}
                        </code>
                        <div className="flex items-center gap-2">
                          {instruction && (
                            <span className="text-[10px] text-amber-600 font-medium">✏️</span>
                          )}
                          <ChevronDown
                            className={cn(
                              "w-3 h-3 text-amber-500 transition-transform",
                              expandedCol === colName && "rotate-180"
                            )}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCol(colName);
                            }}
                            className="p-0.5 rounded hover:bg-red-100 hover:text-red-500 text-slate-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedCol === colName && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3">
                              <textarea
                                value={instruction}
                                onChange={(e) =>
                                  handleColInstruction(colName, e.target.value)
                                }
                                rows={2}
                                placeholder={`Instrucción para '${colName}'...`}
                                className="w-full text-xs text-slate-700 resize-none rounded border border-amber-200 bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading || (!generalObs && Object.keys(colInstructions).length === 0)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all",
                  "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Confirmar Rework
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
