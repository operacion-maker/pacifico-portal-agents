"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  X,
  Lock,
  RotateCcw,
  Clock,
  FileSearch,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { ChatSession, GovernanceStatus } from "@/types";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeChatId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
}

const STATUS_CONFIG: Record<
  GovernanceStatus,
  { label: string; icon: React.ElementType; dot: string; labelCls: string }
> = {
  borrador_ia: {
    label: "Borrador IA",
    icon: FileSearch,
    dot: "bg-blue-400",
    labelCls: "text-blue-700",
  },
  en_revision: {
    label: "En Revisión",
    icon: Clock,
    dot: "bg-amber-400 animate-pulse",
    labelCls: "text-amber-700",
  },
  rework_pendiente: {
    label: "Rework Pendiente",
    icon: RotateCcw,
    dot: "bg-orange-400 animate-pulse",
    labelCls: "text-orange-700",
  },
  aprobado: {
    label: "Aprobado",
    icon: Lock,
    dot: "bg-emerald-500",
    labelCls: "text-emerald-700",
  },
};

const STATUS_ORDER: GovernanceStatus[] = [
  "rework_pendiente",
  "en_revision",
  "borrador_ia",
  "aprobado",
];

function StatusIcon({
  status,
  className,
}: {
  status?: GovernanceStatus;
  className?: string;
}) {
  const cfg = status ? STATUS_CONFIG[status] : null;
  if (!cfg) return <FileSearch className={cn("w-3.5 h-3.5 text-slate-400", className)} />;
  const Icon = cfg.icon;
  return <Icon className={cn("w-3.5 h-3.5", cfg.labelCls, className)} />;
}

function SessionGroup({
  status,
  sessions,
  activeChatId,
  onSelectChat,
  onDeleteChat,
}: {
  status: GovernanceStatus;
  sessions: ChatSession[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(status === "aprobado");
  const cfg = STATUS_CONFIG[status];

  if (sessions.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 rounded-lg transition-colors"
      >
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex-1">
          {cfg.label}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">{sessions.length}</span>
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-slate-400" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-0.5 mt-0.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                session.id === activeChatId
                  ? "bg-[#002A54]/10 text-[#002A54]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              onClick={() => onSelectChat(session.id)}
            >
              <StatusIcon status={session.governanceStatus} className="flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{session.title}</p>
                {session.fqn && (
                  <p className="text-[10px] text-slate-400 font-mono truncate">{session.fqn}</p>
                )}
                {session.governanceStatus === "aprobado" && session.steward && (
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> {session.steward}
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.id);
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatSidebar({
  sessions,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onClose,
  agentName,
}: ChatSidebarProps) {
  // Group sessions by governance status
  const grouped = useMemo(() => {
    const map: Partial<Record<GovernanceStatus, ChatSession[]>> = {};
    for (const s of sessions) {
      const key = s.governanceStatus ?? "borrador_ia";
      if (!map[key]) map[key] = [];
      map[key]!.push(s);
    }
    return map;
  }, [sessions]);

  const noSessions = sessions.length === 0;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-[#F9FAFB] border-r border-slate-200 flex flex-col transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div>
            <h2 className="text-xs font-bold text-[#002A54] uppercase tracking-wider">
              Sesiones de Gobernanza
            </h2>
            {agentName && (
              <p className="text-[10px] text-slate-400">{agentName}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="p-1.5 rounded-lg text-slate-500 hover:text-[#002A54] hover:bg-slate-100 transition-colors"
              title="Nueva sesión"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kanban groups */}
        <div className="flex-1 overflow-y-auto p-2">
          {noSessions ? (
            <div className="text-center py-8 px-4">
              <FileSearch className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No hay sesiones activas</p>
              <p className="text-[10px] text-slate-300 mt-1">
                Selecciona un activo para comenzar
              </p>
            </div>
          ) : (
            STATUS_ORDER.map((status) => (
              <SessionGroup
                key={status}
                status={status}
                sessions={grouped[status] ?? []}
                activeChatId={activeChatId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 text-xs hover:text-[#002A54] hover:bg-slate-100 transition-colors font-medium"
          >
            ← Portal de Agentes
          </a>
        </div>
      </aside>
    </>
  );
}
