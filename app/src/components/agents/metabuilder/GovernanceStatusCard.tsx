"use client";

import { Shield, ShieldAlert, ShieldCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { GovernanceIndicator } from "@/hooks/useMetaBuilderStream";

// ── Inline badge (for use in header) ───────────────────────────────────
interface HealthBadgeProps {
  indicator: GovernanceIndicator;
  className?: string;
}

export function HealthBadge({ indicator, className }: HealthBadgeProps) {
  const isPass = indicator.status === "pass";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
        isPass
          ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-700"
          : "bg-amber-50/80 border-amber-200/80 text-amber-700",
        className
      )}
    >
      {isPass ? (
        <ShieldCheck className="w-3.5 h-3.5" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5" />
      )}
      {isPass ? "Cumple Estándares UDV" : "Advertencias de Gobierno"}
    </span>
  );
}

// ── Compliance notes callout (for use below table description) ──────────
interface ComplianceCalloutProps {
  indicator: GovernanceIndicator;
  className?: string;
}

export function ComplianceCallout({ indicator, className }: ComplianceCalloutProps) {
  const [expanded, setExpanded] = useState(true);
  const isPass = indicator.status === "pass";
  const hasNotes = indicator.compliance_notes && indicator.compliance_notes.length > 0;

  if (!hasNotes) return null;

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        isPass
          ? "border-emerald-200/60 bg-emerald-50/40"
          : "border-amber-200/60 bg-amber-50/30",
        className
      )}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors",
          isPass
            ? "hover:bg-emerald-50/60"
            : "hover:bg-amber-50/50"
        )}
      >
        {isPass ? (
          <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        )}
        <span
          className={cn(
            "flex-1 text-[10px] font-bold uppercase tracking-wider",
            isPass ? "text-emerald-700" : "text-amber-700"
          )}
        >
          Auditoría de Gobierno
          {!isPass && ` · ${indicator.compliance_notes.length} nota${indicator.compliance_notes.length > 1 ? "s" : ""}`}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            isPass ? "text-emerald-500" : "text-amber-500",
            !expanded && "-rotate-90"
          )}
        />
      </button>

      {/* Notes list */}
      {expanded && (
        <ul
          className={cn(
            "px-4 pb-3 space-y-1.5 border-t",
            isPass ? "border-emerald-200/40" : "border-amber-200/40"
          )}
        >
          {indicator.compliance_notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 pt-1.5">
              <span
                className={cn(
                  "text-[11px] mt-0.5 flex-shrink-0",
                  isPass ? "text-emerald-500" : "text-amber-500"
                )}
              >
                {isPass ? "✔" : "⚠"}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-relaxed",
                  isPass ? "text-emerald-800" : "text-amber-800"
                )}
              >
                {note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Legacy export — keeps backward compat if anything else imports it ───
export function GovernanceStatusCard({ indicator }: { indicator: GovernanceIndicator }) {
  return <HealthBadge indicator={indicator} />;
}
