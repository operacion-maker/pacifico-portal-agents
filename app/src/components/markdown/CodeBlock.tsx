"use client";

import { CopyCodeButton } from "@/components/export/CopyCodeButton";

interface CodeBlockProps {
  language?: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  return (
    <div className="relative group rounded-lg border border-border overflow-hidden my-3">
      <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 border-b border-border">
        <span className="text-xs text-muted font-mono">
          {language || "text"}
        </span>
        <CopyCodeButton code={code} />
      </div>
      <pre className="overflow-x-auto p-4 bg-slate-900 text-sm">
        <code className="font-mono text-slate-100 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}
