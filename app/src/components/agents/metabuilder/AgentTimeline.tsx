"use client";

import { useState } from "react";
import { ChevronDown, Terminal, Loader2, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/hooks/useMetaBuilderStream";

// ── Step metadata ──────────────────────────────────────────────────────
const STEP_META: Record<
  PipelineStep,
  { icon: string; label: string; detail: string }
> = {
  idle: { icon: "○", label: "En espera", detail: "" },
  collect_context: {
    icon: "⚙️",
    label: "Extrayendo contexto",
    detail: "Recuperando esquema, tags de DAC/EDC y linaje desde Unity Catalog…",
  },
  generate_draft: {
    icon: "🧠",
    label: "Generando borrador",
    detail: "Consolidando contexto y generando documentación inteligente con criterios de gobierno…",
  },
  human_review: {
    icon: "✏️",
    label: "Modo Edición Habilitado",
    detail: "El borrador está listo. Revisa y aprueba los metadatos antes de publicar.",
  },
  publish_uc: {
    icon: "📤",
    label: "Publicando en Unity Catalog",
    detail: "Aplicando comentarios aprobados en el catálogo de datos…",
  },
  completed: {
    icon: "✅",
    label: "Publicado exitosamente",
    detail: "Los metadatos han sido aplicados en Unity Catalog.",
  },
  failed: {
    icon: "❌",
    label: "Error en el pipeline",
    detail: "El agente encontró un error. Revisa los logs o inténtalo de nuevo.",
  },
};

const ORDERED_STEPS: PipelineStep[] = [
  "collect_context",
  "generate_draft",
  "human_review",
  "publish_uc",
];

function getStepState(
  step: PipelineStep,
  current: PipelineStep
): "done" | "active" | "pending" | "error" {
  if (current === "failed") return "error";
  if (current === "completed") return "done";
  const ci = ORDERED_STEPS.indexOf(current);
  const si = ORDERED_STEPS.indexOf(step);
  if (ci > si) return "done";
  if (ci === si) return "active";
  return "pending";
}

interface AgentTimelineProps {
  currentStep: PipelineStep;
  progressMessages: string[];
  className?: string;
}

export function AgentTimeline({
  currentStep,
  progressMessages,
  className,
}: AgentTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  if (currentStep === "idle") return null;

  const meta = STEP_META[currentStep];
  const isActive = currentStep !== "completed" && currentStep !== "failed";
  const isEditMode = currentStep === "human_review";
  const isDone = currentStep === "completed";
  const isFailed = currentStep === "failed";

  return (
    <div className={cn("border-b border-slate-200", className)}>
      {/* ── Collapsed bar ────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className={cn(
          "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors",
          isEditMode
            ? "bg-cyan-50/60 hover:bg-cyan-50"
            : isDone
            ? "bg-emerald-50/60 hover:bg-emerald-50/80"
            : isFailed
            ? "bg-red-50/60 hover:bg-red-50/80"
            : "bg-[#002A54]/[0.03] hover:bg-[#002A54]/[0.06]"
        )}
      >
        {/* Left: status icon */}
        <div className="flex-shrink-0">
          {isActive && !isEditMode ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
          ) : isEditMode ? (
            <Pencil className="w-3.5 h-3.5 text-cyan-700" />
          ) : isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : isFailed ? (
            <XCircle className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>

        {/* Center: current step label + detail */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className={cn(
                "text-[11px] font-bold tracking-wide",
                isEditMode
                  ? "text-cyan-800"
                  : isDone
                  ? "text-emerald-700"
                  : isFailed
                  ? "text-red-700"
                  : "text-[#002A54]"
              )}
            >
              {meta.icon} {meta.label}
            </span>
            {meta.detail && (
              <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                {meta.detail}
              </span>
            )}
          </div>
        </div>

        {/* Right: pulse indicator + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isActive && !isEditMode && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* ── Expanded timeline panel ───────────────────────────────── */}
      {expanded && (
        <div className="bg-white border-t border-slate-100 px-5 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Step-by-step timeline */}
          <div className="flex flex-col gap-0 mb-4">
            {ORDERED_STEPS.map((step, i) => {
              const state = getStepState(step, currentStep);
              const sm = STEP_META[step];
              const isLast = i === ORDERED_STEPS.length - 1;

              return (
                <div key={step} className="flex gap-3">
                  {/* Timeline track */}
                  <div className="flex flex-col items-center w-5 flex-shrink-0">
                    {/* Node */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-500",
                        state === "done" &&
                          "bg-emerald-500 border-emerald-500 text-white",
                        state === "active" &&
                          "bg-cyan-500 border-cyan-400 text-white ring-4 ring-cyan-100",
                        state === "pending" &&
                          "bg-white border-slate-200 text-slate-300",
                        state === "error" &&
                          "bg-red-500 border-red-400 text-white"
                      )}
                    >
                      {state === "done" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : state === "active" ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : state === "error" ? (
                        <XCircle className="w-3 h-3" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                    {/* Connector */}
                    {!isLast && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 mt-0.5 mb-0.5 min-h-[20px] transition-colors duration-500",
                          state === "done" ? "bg-emerald-200" : "bg-slate-100"
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn("pb-4 pt-0.5 flex-1 min-w-0", isLast && "pb-0")}>
                    <p
                      className={cn(
                        "text-[11px] font-semibold leading-tight",
                        state === "done" && "text-emerald-700",
                        state === "active" && "text-[#002A54]",
                        state === "pending" && "text-slate-400",
                        state === "error" && "text-red-600"
                      )}
                    >
                      {sm.icon} {sm.label}
                    </p>
                    {state === "active" && (
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        {sm.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live log messages */}
          {progressMessages.length > 0 && (
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Actividad en vivo
                </span>
              </div>
              <div className="px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
                {progressMessages.map((msg, i) => (
                  <p key={i} className="text-[10px] text-slate-600 font-mono leading-relaxed">
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
