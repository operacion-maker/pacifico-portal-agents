"use client";

import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/hooks/useMetaBuilderStream";

const STEPS: { key: PipelineStep; label: string; description: string }[] = [
  { key: "collect_context", label: "Recolectar Contexto", description: "Extrayendo metadatos técnicos y linaje" },
  { key: "generate_draft", label: "Generar Borrador", description: "Generando draft con IA" },
  { key: "human_review", label: "Revisión Humana", description: "Esperando aprobación del Data Steward" },
  { key: "publish_uc", label: "Publicar", description: "Aplicando cambios en Unity Catalog" },
];

interface PipelineProgressTrackerProps {
  currentStep: PipelineStep;
}

function getStepStatus(stepKey: PipelineStep, currentStep: PipelineStep) {
  const stepOrder: PipelineStep[] = ["collect_context", "generate_draft", "human_review", "publish_uc", "completed"];
  const stepIdx = stepOrder.indexOf(stepKey);
  const currentIdx = stepOrder.indexOf(currentStep === "completed" ? "completed" : currentStep);

  if (currentStep === "completed" || currentIdx > stepIdx) return "done";
  if (currentStep === stepKey) return "active";
  return "pending";
}

export function PipelineProgressTracker({ currentStep }: PipelineProgressTrackerProps) {
  if (currentStep === "idle") return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-3">
      <div className="rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50/80 to-teal-50/60 p-4">
        <p className="text-xs font-semibold text-cyan-700 mb-3 uppercase tracking-wide">
          🤖 Pipeline de Gobernanza — En ejecución
        </p>
        <div className="flex items-start gap-2">
          {STEPS.map((step, i) => {
            const status = getStepStatus(step.key, currentStep);
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-1 relative">
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "absolute top-3.5 left-1/2 w-full h-0.5 z-0 transition-colors duration-500",
                    status === "done" ? "bg-cyan-400" : "bg-slate-200"
                  )} />
                )}
                <div className={cn(
                  "relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500",
                  status === "done" && "bg-cyan-500 text-white",
                  status === "active" && "bg-cyan-500 text-white pipeline-active",
                  status === "pending" && "bg-slate-200 text-slate-400"
                )}>
                  {status === "done" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : status === "active" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-[10px] font-semibold leading-tight",
                    status === "active" && "text-cyan-700",
                    status === "done" && "text-cyan-600",
                    status === "pending" && "text-slate-400"
                  )}>
                    {step.label}
                  </p>
                  {status === "active" && (
                    <p className="text-[9px] text-cyan-500 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {currentStep === "completed" && (
          <div className="mt-3 flex items-center gap-2 text-emerald-600 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            ¡Metadatos publicados exitosamente en Unity Catalog!
          </div>
        )}
      </div>
    </div>
  );
}
