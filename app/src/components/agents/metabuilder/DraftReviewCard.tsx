"use client";

import { useState } from "react";
import { Sparkles, Edit2, Check, X, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDraft {
  name: string;
  type: string;
  comment: string;
}

export interface DraftReviewCardProps {
  tableName: string;
  tableComment: string;
  columns: ColumnDraft[];
  onAccept?: () => void;
  onEdit?: (editedTableComment: string, editedColumns: ColumnDraft[]) => void;
  readOnly?: boolean;
}

export function DraftReviewCard({ 
  tableName, 
  tableComment, 
  columns, 
  onAccept, 
  onEdit,
  readOnly = false 
}: DraftReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTableComment, setCurrentTableComment] = useState(tableComment);
  const [currentColumns, setCurrentColumns] = useState<ColumnDraft[]>(columns);

  const handleSave = () => {
    setIsEditing(false);
    onEdit?.(currentTableComment, currentColumns);
  };

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("string") || t.includes("varchar")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (t.includes("int") || t.includes("decimal") || t.includes("numeric") || t.includes("float")) return "bg-green-50 text-green-700 border-green-200";
    if (t.includes("timestamp") || t.includes("date")) return "bg-orange-50 text-orange-700 border-orange-200";
    if (t.includes("boolean")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="w-full bg-white rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-primary/5 px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">AI Suggested Description</span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-muted hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSave}
                  className="p-1.5 text-primary hover:text-primary-hover rounded-md hover:bg-primary/10 transition-colors"
                  title="Guardar cambios"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-muted hover:text-primary rounded-md hover:bg-primary/10 transition-colors"
                title="Editar descripción"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Table Comment Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Table2 className="w-4 h-4 text-muted" />
            <h4 className="text-sm font-bold text-foreground">{tableName}</h4>
          </div>
          {isEditing ? (
            <textarea
              className="w-full text-sm border border-input-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
              value={currentTableComment}
              onChange={(e) => setCurrentTableComment(e.target.value)}
            />
          ) : (
            <p className="text-sm text-muted bg-slate-50 p-3 rounded-lg border border-slate-100">
              {currentTableComment || <span className="italic text-slate-400">Sin descripción...</span>}
            </p>
          )}
        </div>

        {/* Columns Section */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">Columnas</h4>
          <div className="space-y-3">
            {currentColumns.map((col, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 group">
                <div className="w-full sm:w-1/3 flex items-center justify-between sm:justify-start gap-2 pt-1">
                  <span className="text-sm font-medium text-foreground truncate" title={col.name}>{col.name}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-mono", getTypeColor(col.type))}>
                    {col.type}
                  </span>
                </div>
                <div className="w-full sm:w-2/3 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full text-sm border border-input-border rounded-md p-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={col.comment}
                      onChange={(e) => {
                        const newCols = [...currentColumns];
                        newCols[idx] = { ...col, comment: e.target.value };
                        setCurrentColumns(newCols);
                      }}
                    />
                  ) : (
                    <div className="text-sm text-muted">
                      {col.comment || <span className="italic text-slate-400">Sin descripción...</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
