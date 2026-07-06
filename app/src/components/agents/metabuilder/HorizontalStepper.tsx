"use client";

import { cn } from "@/lib/utils";
import type { PipelineStep } from "@/hooks/useMetaBuilderStream";

const STEPS: { key: PipelineStep; short: string; icon: string }[] = [
  { key: "collect_context", short: "Extracción",  icon: "⬡" },
  { key: "generate_draft",  short: "Generación",  icon: "⬡" },
  { key: "human_review",    short: "Revisión",    icon: "⬡" },
  { key: "publish_uc",      short: "Publicado",   icon: "⬡" },
];

const STEP_ORDER: PipelineStep[] = [
  "collect_context",
  "generate_draft",
  "human_review",
  "publish_uc",
  "completed",
];

function getStatus(
  key: PipelineStep,
  current: PipelineStep
): "done" | "active" | "pending" {
  const ci = STEP_ORDER.indexOf(current === "completed" ? "publish_uc" : current);
  const si = STEP_ORDER.indexOf(key);
  if (current === "completed" || ci > si) return "done";
  if (current === key) return "active";
  return "pending";
}

interface HorizontalStepperProps {
  currentStep: PipelineStep;
  className?: string;
}

export function HorizontalStepper({ currentStep, className }: HorizontalStepperProps) {
  if (currentStep === "idle") return null;

  const isCompleted = currentStep === "completed";
  const isFailed    = currentStep === "failed";

  return (
    <div
      className={cn(
        "flex items-center gap-0 px-5 py-2 border-b border-slate-100 bg-slate-50/80",
        className
      )}
    >
      {/* Steps */}
      <div className="flex items-center gap-0 flex-1 min-w-0">
        {STEPS.map((step, i) => {
          const status = isFailed ? "pending" : getStatus(step.key, currentStep);
          return (
            <div key={step.key} className="flex items-center min-w-0">
              {/* Step pill */}
              <div className="flex items-center gap-1.5 px-2 py-1">
                {/* Dot */}
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-500",
                    status === "done"    && "bg-cyan-500",
                    status === "active"  && "bg-cyan-500 animate-pulse ring-2 ring-cyan-200",
                    status === "pending" && "bg-slate-300"
                  )}
                />
                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap",
                    status === "done"    && "text-cyan-600",
                    status === "active"  && "text-[#002A54]",
                    status === "pending" && "text-slate-400"
                  )}
                >
                  {step.short}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-6 flex-shrink-0 transition-colors duration-500",
                    status === "done" ? "bg-cyan-300" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Right badge: status */}
      <div className="flex-shrink-0 ml-4">
        {isFailed ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
            Error
          </span>
        ) : isCompleted ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            ✓ Publicado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 rounded-full px-2 py-0.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
            En proceso
          </span>
        )}
      </div>
    </div>
  );
}
