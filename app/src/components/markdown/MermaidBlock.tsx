"use client";

import { useEffect, useRef, useId, useState } from "react";
import { ExportMermaidButton } from "@/components/export/ExportMermaidButton";
import { Loader2 } from "lucide-react";

interface MermaidBlockProps {
  code: string;
}

function sanitizeMermaidCode(raw: string): string {
  // Strip %% comment lines (erDiagram parser doesn't support them reliably)
  let code = raw.replace(/^\s*%%.*$/gm, "");

  // The [], {}, () and subgraph sanitizations are for flowchart/graph diagrams.
  // They must NOT run on erDiagram — the {} regex matches multi-line entity
  // blocks and corrupts them when fields contain non-ASCII chars (e.g. "año").
  const isErDiagram = /^\s*erDiagram/m.test(code);
  if (!isErDiagram) {
    code = code
      .replace(/\[([^\]"(/\\]+)\]/g, (match, inner: string) => {
        if (/[^\x00-\x7F]/.test(inner)) return `["${inner}"]`;
        return match;
      })
      .replace(/\{([^}"]+)\}/g, (match, inner: string) => {
        if (/[^\x00-\x7F]/.test(inner)) return `{"${inner}"}`;
        return match;
      })
      .replace(/(?<!\[)\(([^)"]+)\)(?!\])/g, (match, inner: string) => {
        if (/[^\x00-\x7F]/.test(inner)) return `("${inner}")`;
        return match;
      })
      .replace(/(subgraph\s+\w+\[")([^"]*)"]/g, (_match, prefix: string, label: string) => {
        const clean = label.replace(/[\u{1F000}-\u{1FFFF}]/gu, "").trim();
        return `${prefix}${clean}"]`;
      });
  }

  return code.replace(/<br\s*\/?>/g, " ");
}

const DEBOUNCE_MS = 600;
const RENDER_TIMEOUT_MS = 10000;

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, "-");
  const containerId = `mermaid-${uniqueId}`;
  const [state, setState] = useState<"loading" | "rendered" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const renderIdRef = useRef(0);

  useEffect(() => {
    renderIdRef.current += 1;
    const myRenderId = renderIdRef.current;

    setState("loading");
    setErrorMsg("");

    const sanitized = sanitizeMermaidCode(code);

    const debounceTimer = setTimeout(() => {
      // Timeout guard
      const timeoutTimer = setTimeout(() => {
        if (myRenderId === renderIdRef.current) {
          setErrorMsg("Timeout renderizando diagrama");
          setState("error");
        }
      }, RENDER_TIMEOUT_MS);

      (async () => {
        try {
          const mermaid = (await import("mermaid")).default;
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
            themeVariables: {
              darkMode: false,
              background: "#ffffff",
              primaryColor: "#0891b2",
              primaryTextColor: "#1e293b",
              primaryBorderColor: "#cbd5e1",
              lineColor: "#94a3b8",
              secondaryColor: "#f1f5f9",
              tertiaryColor: "#e0f2fe",
            },
          });

          const svgId = `mermaid-svg-${uniqueId}-${myRenderId}`;
          document.getElementById(svgId)?.remove();

          const { svg } = await mermaid.render(svgId, sanitized);

          if (myRenderId === renderIdRef.current && containerRef.current) {
            containerRef.current.innerHTML = svg;
            setState("rendered");
          }
        } catch (err) {
          if (myRenderId === renderIdRef.current) {
            console.warn("Mermaid render failed:", err);
            setErrorMsg(err instanceof Error ? err.message : String(err));
            setState("error");
          }
        } finally {
          clearTimeout(timeoutTimer);
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [code, uniqueId]);

  // Always render the container div so containerRef is never null
  return (
    <div className="relative my-3 rounded-lg border border-border bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-slate-50">
        <span className="text-xs text-muted font-mono">mermaid</span>
        {state === "rendered" && (
          <ExportMermaidButton svgContainerId={containerId} mermaidCode={code} />
        )}
      </div>

      {/* Loading spinner — shown while rendering */}
      {state === "loading" && (
        <div className="flex items-center justify-center gap-2 p-8 text-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Renderizando diagrama...
        </div>
      )}

      {/* Error message */}
      {state === "error" && (
        <div className="p-4">
          <p className="text-red-400 text-sm">Error: {errorMsg}</p>
          <pre className="text-xs text-muted mt-2 overflow-x-auto whitespace-pre-wrap">{code}</pre>
        </div>
      )}

      {/* SVG container — always in DOM so ref is always attached */}
      <div
        id={containerId}
        ref={containerRef}
        className={`flex justify-center p-4 overflow-x-auto ${state !== "rendered" ? "hidden" : ""}`}
      />
    </div>
  );
}
