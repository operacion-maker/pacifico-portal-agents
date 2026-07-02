"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GovernanceIndicator } from "@/hooks/useMetaBuilderStream";

interface GovernanceStatusCardProps {
  indicator: GovernanceIndicator;
}

export function GovernanceStatusCard({ indicator }: GovernanceStatusCardProps) {
  const isPass = indicator.status === "pass";

  return (
    <div className={cn(
      "rounded-lg border px-3 py-2 text-xs flex flex-col gap-1",
      isPass
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700"
    )}>
      <div className="flex items-center gap-1.5 font-semibold">
        {isPass ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5" />
        )}
        <span>Gobierno: {isPass ? "Cumple" : "Advertencias"}</span>
      </div>
      {indicator.compliance_notes && indicator.compliance_notes.length > 0 && (
        <ul className="pl-5 space-y-0.5 list-disc text-[11px] opacity-80">
          {indicator.compliance_notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
