"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { Edit3, Pin, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnDraft } from "@/hooks/useMetaBuilderStream";

interface ColumnRow {
  name: string;
  originalComment: string;
  aiComment: string;
  editedComment: string;
  isEdited: boolean;
  isAnchored: boolean;
}

interface ColumnDataGridProps {
  columns: ColumnDraft[];
  disabled?: boolean;
  onChange: (name: string, value: string) => void;
  editedComments: Record<string, string>;
}

const colHelper = createColumnHelper<ColumnRow>();

export function ColumnDataGrid({
  columns,
  disabled = false,
  onChange,
  editedComments,
}: ColumnDataGridProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Build row data merging draft + edits
  const data = useMemo<ColumnRow[]>(
    () =>
      columns.map((col) => {
        const edited = editedComments[col.name];
        const isEdited = edited !== undefined && edited !== col.comment;
        return {
          name: col.name,
          originalComment: col.comment,
          aiComment: col.comment,
          editedComment: edited ?? col.comment,
          isEdited,
          isAnchored: isEdited,
        };
      }),
    [columns, editedComments]
  );

  const tableCols = useMemo<ColumnDef<ColumnRow, unknown>[]>(
    () => [
      colHelper.accessor("name", {
        header: "Columna",
        size: 180,
        cell: (info) => (
          <div className="flex items-center gap-1.5 pr-2">
            <code className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded whitespace-nowrap">
              {info.getValue() as string}
            </code>
            {info.row.original.isAnchored && (
              <Pin className="w-3 h-3 text-cyan-500 shrink-0" aria-label="Anclado" />
            )}
          </div>
        ),
      }) as ColumnDef<ColumnRow, unknown>,
      colHelper.accessor("editedComment", {
        header: "Descripción (editable)",
        size: 400,
        cell: (info) => {
          const row = info.row.original;
          return (
            <textarea
              value={info.getValue() as string}
              onChange={(e) => onChange(row.name, e.target.value)}
              disabled={disabled}
              rows={2}
              className={cn(
                "w-full text-xs text-slate-700 resize-none rounded border bg-white px-2 py-1.5 leading-relaxed",
                "focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-transparent transition-all",
                row.isEdited
                  ? "border-cyan-300 bg-cyan-50/40"
                  : "border-slate-200"
              )}
            />
          );
        },
      }) as ColumnDef<ColumnRow, unknown>,
    ],
    [disabled, onChange]
  );

  const table = useReactTable({
    data,
    columns: tableCols,
    getCoreRowModel: getCoreRowModel(),
  });

  // Virtualizer — only render visible rows
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const editedCount = data.filter((r) => r.isEdited).length;

  return (
    <div
      className={cn(
        "flex flex-col border border-slate-200 rounded-xl overflow-hidden transition-all duration-300",
        isFullscreen &&
          "fixed inset-4 z-50 shadow-2xl bg-white border-slate-300"
      )}
    >
      {/* Grid toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Columnas ({columns.length})
          </span>
          {editedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-700 border border-cyan-200">
              ✏️ {editedCount} editada{editedCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsFullscreen((p) => !p)}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Table header — sticky */}
      <div className="bg-slate-100 border-b border-slate-200">
        {table.getHeaderGroups().map((hg) => (
          <div key={hg.id} className="flex">
            {hg.headers.map((header) => (
              <div
                key={header.id}
                className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                style={{ width: header.getSize() }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Virtualized rows */}
      <div
        ref={tableContainerRef}
        className={cn(
          "overflow-y-auto",
          isFullscreen ? "flex-1" : "max-h-72"
        )}
      >
        <div style={{ height: totalSize, position: "relative" }}>
          {virtualRows.map((vRow) => {
            const row = rows[vRow.index];
            return (
              <div
                key={row.id}
                style={{
                  position: "absolute",
                  top: vRow.start,
                  left: 0,
                  right: 0,
                  height: vRow.size,
                }}
                className={cn(
                  "flex border-b border-slate-100 transition-colors",
                  row.original.isEdited ? "bg-cyan-50/30" : "bg-white hover:bg-slate-50/50"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="flex items-start px-3 py-2"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 -z-10 bg-black/40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}
