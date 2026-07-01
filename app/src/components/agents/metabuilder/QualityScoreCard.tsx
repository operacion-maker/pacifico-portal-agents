"use client";

import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QualityScoreCardProps {
  score: number; // 0.0 to 1.0
  pillars: {
    clarity: number;
    purpose: number;
    detail: number;
    context: number;
  };
  findings: string[];
}

export function QualityScoreCard({ score, pillars, findings }: QualityScoreCardProps) {
  const getScoreColor = (val: number) => {
    if (val >= 0.8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (val >= 0.5) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreBarColor = (val: number) => {
    if (val >= 0.8) return "bg-emerald-500";
    if (val >= 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreIcon = (val: number) => {
    if (val >= 0.8) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (val >= 0.5) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const formatScore = (val: number) => `${Math.round(val * 100)}%`;

  return (
    <div className="w-full bg-white rounded-xl border border-border p-5 shadow-sm space-y-6">
      {/* Overall Score */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Quality Score
            <div className="group relative">
              <Info className="w-4 h-4 text-muted cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                Basado en evaluación de modelo LLM-as-a-judge
              </div>
            </div>
          </h3>
          <p className="text-xs text-muted mt-1">Evaluación automática del draft propuesto</p>
        </div>
        <div className="flex items-center gap-3">
          {getScoreIcon(score)}
          <span className={cn("text-xl font-bold px-3 py-1 rounded-lg border", getScoreColor(score))}>
            {formatScore(score)}
          </span>
        </div>
      </div>

      {/* Pillars */}
      <div>
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Pilares Evaluados</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Claridad", value: pillars.clarity },
            { label: "Propósito", value: pillars.purpose },
            { label: "Detalle", value: pillars.detail },
            { label: "Contexto", value: pillars.context },
          ].map((pillar) => (
            <div key={pillar.label} className="flex flex-col items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={getScoreBarColor(pillar.value).replace('bg-', 'text-')}
                    strokeWidth="3"
                    strokeDasharray={`${pillar.value * 100}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-foreground">
                  {formatScore(pillar.value)}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-600">{pillar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Observaciones</h4>
          <ul className="space-y-2">
            {findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
