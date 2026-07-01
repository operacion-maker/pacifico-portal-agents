"use client";

import { useState } from "react";
import { Database, Folder, Table2, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableInputCardProps {
  onSubmit: (fqn: string) => void;
  disabled?: boolean;
}

export function TableInputCard({ onSubmit, disabled = false }: TableInputCardProps) {
  const [catalog, setCatalog] = useState("udv_desa");
  const [schema, setSchema] = useState("sch_udv_tbl");
  const [table, setTable] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (catalog && schema && table) {
      onSubmit(`${catalog}.${schema}.${table}`);
    }
  };

  const isValid = catalog.length > 0 && schema.length > 0 && table.length > 0;

  return (
    <div className={cn(
      "w-full max-w-lg mx-auto bg-white rounded-xl border p-4 shadow-sm transition-all duration-300",
      isFocused ? "border-primary shadow-md ring-1 ring-primary/20" : "border-border"
    )}>
      <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Documentar Nueva Tabla</h3>
          <p className="text-xs text-muted mt-0.5">Ingresa el Fully Qualified Name (FQN)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Catalog */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> Catálogo
            </label>
            <input
              type="text"
              value={catalog}
              onChange={(e) => setCatalog(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full text-sm border border-input-border rounded-lg p-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="ej. hive_metastore"
              disabled={disabled}
            />
          </div>
          
          {/* Schema */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5" /> Esquema
            </label>
            <input
              type="text"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full text-sm border border-input-border rounded-lg p-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="ej. default"
              disabled={disabled}
            />
          </div>

          {/* Table */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Table2 className="w-3.5 h-3.5 text-primary" /> Tabla *
            </label>
            <input
              type="text"
              value={table}
              onChange={(e) => setTable(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full text-sm border border-input-border rounded-lg p-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Nombre de tabla"
              disabled={disabled}
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted font-mono">
            {catalog && schema && table ? (
              <span className="text-primary font-medium">{catalog}.{schema}.{table}</span>
            ) : (
              <span>catalog.schema.table</span>
            )}
          </div>
          <button
            type="submit"
            disabled={!isValid || disabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analizar <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
