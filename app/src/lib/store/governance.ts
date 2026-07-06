/**
 * Governance Store (Zustand)
 * Manages per-session governance state independently —
 * updates to one session do NOT re-render sibling sessions.
 */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GovernanceStatus } from "@/types";
import type { DraftData } from "@/hooks/useMetaBuilderStream";

export interface GovernanceSession {
  id: string;
  fqn: string;
  status: GovernanceStatus;
  steward?: string;
  draftData?: DraftData;
  updatedAt: number;
  /** IDs of columns the steward has flagged for rework */
  reworkColumns?: string[];
}

interface GovernanceStore {
  sessions: Record<string, GovernanceSession>;

  /** Update or create a governance session */
  upsertSession: (id: string, patch: Partial<GovernanceSession>) => void;

  /** Mark a session as approved with the steward's name */
  approveSession: (id: string, steward: string) => void;

  /** Flag a session for rework */
  requestRework: (id: string, columns?: string[]) => void;

  /** Remove a governance session */
  removeSession: (id: string) => void;

  /** Workspace UI preferences */
  auditModeEnabled: boolean;
  toggleAuditMode: () => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useGovernanceStore = create<GovernanceStore>()(
  persist(
    (set) => ({
      sessions: {},

      upsertSession: (id, patch) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: {
              ...(state.sessions[id] ?? {
                id,
                fqn: "",
                status: "borrador_ia" as GovernanceStatus,
                updatedAt: Date.now(),
              }),
              ...patch,
              updatedAt: Date.now(),
            },
          },
        })),

      approveSession: (id, steward) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: {
              ...(state.sessions[id] ?? { id, fqn: "", updatedAt: Date.now() }),
              status: "aprobado" as GovernanceStatus,
              steward,
              updatedAt: Date.now(),
            },
          },
        })),

      requestRework: (id, columns) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [id]: {
              ...(state.sessions[id] ?? { id, fqn: "", updatedAt: Date.now() }),
              status: "rework_pendiente" as GovernanceStatus,
              reworkColumns: columns,
              updatedAt: Date.now(),
            },
          },
        })),

      removeSession: (id) =>
        set((state) => {
          const next = { ...state.sessions };
          delete next[id];
          return { sessions: next };
        }),

      auditModeEnabled: false,
      toggleAuditMode: () =>
        set((state) => ({ auditModeEnabled: !state.auditModeEnabled })),

      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    {
      name: "governance-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        auditModeEnabled: state.auditModeEnabled,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
