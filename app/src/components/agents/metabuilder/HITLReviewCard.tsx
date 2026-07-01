"use client";

import { useState } from "react";
import { Check, RotateCcw, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HITLReviewCardProps {
  onAction: (action: "approve" | "rework" | "reject", feedback?: string) => void;
  isSubmitting?: boolean;
}

export function HITLReviewCard({ onAction, isSubmitting = false }: HITLReviewCardProps) {
  const [feedback, setFeedback] = useState("");
  const [selectedAction, setSelectedAction] = useState<"approve" | "rework" | "reject" | null>(null);

  const handleActionClick = (action: "approve" | "rework" | "reject") => {
    setSelectedAction(action);
    if (action === "approve") {
      onAction("approve", feedback);
    }
  };

  const handleSubmit = () => {
    if (selectedAction) {
      onAction(selectedAction, feedback);
    }
  };

  const isRequiresFeedback = selectedAction === "rework" || selectedAction === "reject";

  return (
    <div className="w-full bg-white rounded-xl border border-border p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">Revisión del Data Steward</h3>
        <p className="text-sm text-muted mt-1">Por favor, revisa el draft generado y los resultados de evaluación.</p>
      </div>

      {!selectedAction || selectedAction === "approve" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleActionClick("approve")}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <Check className="w-6 h-6 mb-2" />
            <span className="text-sm font-semibold">Aprobar y Publicar</span>
          </button>
          <button
            onClick={() => handleActionClick("rework")}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-6 h-6 mb-2" />
            <span className="text-sm font-semibold">Solicitar Corrección</span>
          </button>
          <button
            onClick={() => handleActionClick("reject")}
            disabled={isSubmitting}
            className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-red-100 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 mb-2" />
            <span className="text-sm font-semibold">Rechazar</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className={cn(
            "p-3 rounded-lg flex items-center gap-3",
            selectedAction === "rework" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"
          )}>
            {selectedAction === "rework" ? <RotateCcw className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <div>
              <p className="text-sm font-semibold">
                {selectedAction === "rework" ? "Has solicitado correcciones" : "Has rechazado el draft"}
              </p>
              <p className="text-xs opacity-80">Por favor, proporciona el motivo para ajustar el modelo.</p>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={selectedAction === "rework" ? "Ej: Falta especificar la granularidad de la tabla..." : "Ej: Esta tabla está deprecada, no debe documentarse..."}
              className="w-full text-sm border border-input-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setSelectedAction(null)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
