"use client";

import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type GovernanceStatus = "pass" | "fail" | "needs_review";

export interface GovernanceStatusCardProps {
  status: GovernanceStatus;
  findings: string[];
}

export function GovernanceStatusCard({ status, findings }: GovernanceStatusCardProps) {
  const getStatusConfig = (s: GovernanceStatus) => {
    switch (s) {
      case "pass":
        return {
          icon: ShieldCheck,
          title: "Cumple con Gobernanza",
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          border: "border-emerald-200",
        };
      case "fail":
        return {
          icon: ShieldAlert,
          title: "Incumplimiento Crítico",
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
        };
      case "needs_review":
        return {
          icon: ShieldAlert,
          title: "Requiere Revisión",
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={cn("w-full rounded-xl border p-5 shadow-sm space-y-4", config.bg, config.border)}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white shadow-sm", config.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className={cn("text-sm font-bold", config.color)}>{config.title}</h3>
          <p className="text-xs text-muted mt-0.5">Evaluación contra los 7 Principios de Gobernanza</p>
        </div>
      </div>

      {findings.length > 0 ? (
        <div className="bg-white/60 rounded-lg p-4 border border-white/40">
          <ul className="space-y-2">
            {findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0", config.color.replace('text-', 'bg-'))} />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white/60 rounded-lg p-3 border border-white/40">
          <p className="text-sm text-muted italic">No se detectaron observaciones de gobernanza.</p>
        </div>
      )}
    </div>
  );
}
