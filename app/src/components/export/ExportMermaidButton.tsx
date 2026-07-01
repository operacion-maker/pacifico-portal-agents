"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Download, Image, FileCode, FileText } from "lucide-react";

interface ExportMermaidButtonProps {
  svgContainerId: string;
  mermaidCode?: string;
}

export function ExportMermaidButton({ svgContainerId, mermaidCode }: ExportMermaidButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const getSvgElement = useCallback(() => {
    const container = document.getElementById(svgContainerId);
    return container?.querySelector("svg");
  }, [svgContainerId]);

  const exportSvg = useCallback(() => {
    const svg = getSvgElement();
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }, [getSvgElement]);

  const exportPng = useCallback(() => {
    const svg = getSvgElement();
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "diagram.png";
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");

      URL.revokeObjectURL(url);
    };
    img.src = url;
    setShowMenu(false);
  }, [getSvgElement]);

  const exportMermaidCode = useCallback(() => {
    if (!mermaidCode) return;

    const blob = new Blob([mermaidCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.mmd";
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }, [mermaidCode]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded text-muted hover:text-foreground transition-colors"
        title="Exportar diagrama"
      >
        <Download className="w-4 h-4" />
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-10 min-w-[160px]">
          <button
            onClick={exportSvg}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-slate-50 rounded-t-lg"
          >
            <FileCode className="w-4 h-4 text-cyan-600" />
            Exportar SVG
          </button>
          <button
            onClick={exportPng}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-slate-50"
          >
            <Image className="w-4 h-4 text-purple-600" />
            Exportar PNG
          </button>
          {mermaidCode && (
            <button
              onClick={exportMermaidCode}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-slate-50 rounded-b-lg border-t border-border"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              Descargar .mmd
            </button>
          )}
        </div>
      )}
    </div>
  );
}
