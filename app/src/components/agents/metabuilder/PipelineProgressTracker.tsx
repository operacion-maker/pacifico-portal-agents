"use client";

import { CheckCircle2, Circle, Search, FileText, BarChart, Shield, UserCheck, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStep = 
  | "collect_context" 
  | "generate_draft" 
  | "evaluate_quality" 
  | "reflect_governance" 
  | "human_review" 
  | "publish_uc"
  | "completed";

interface PipelineProgressTrackerProps {
  currentStep: PipelineStep;
}

const steps = [
  { id: "collect_context", label: "Collect", icon: Search },
  { id: "generate_draft", label: "Draft", icon: FileText },
  { id: "evaluate_quality", label: "Evaluate", icon: BarChart },
  { id: "reflect_governance", label: "Reflect", icon: Shield },
  { id: "human_review", label: "Review", icon: UserCheck },
  { id: "publish_uc", label: "Publish", icon: UploadCloud },
];

export function PipelineProgressTracker({ currentStep }: PipelineProgressTrackerProps) {
  const currentIndex = currentStep === "completed" 
    ? steps.length 
    : steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full bg-white rounded-xl border border-border p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative group">
              {/* Connecting line */}
              {index !== steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute top-4 left-1/2 w-full h-[2px] -z-10 transition-colors duration-300",
                    isCompleted ? "bg-primary" : "bg-slate-100"
                  )} 
                />
              )}
              
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 transition-all duration-300 z-10",
                  isCompleted && "border-primary bg-primary text-white",
                  isCurrent && "border-primary text-primary pipeline-active",
                  isPending && "border-slate-200 text-slate-300"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium mt-2 transition-colors duration-300",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
