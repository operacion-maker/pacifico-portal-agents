/**
 * useWorkspacePreferences
 * ────────────────────────────────────────────────────────────────
 * Syncs governance store preferences with the Redis API:
 *   • On mount  → GET /api/users/preferences/workspace  (hydrate store)
 *   • On change → PUT /api/users/preferences/workspace  (debounced 500ms)
 *   • On unload → navigator.sendBeacon (best-effort, no await)
 */
"use client";

import { useEffect, useRef } from "react";
import { useGovernanceStore } from "@/lib/store/governance";

const PREF_URL = "/api/users/preferences/workspace";
const DEBOUNCE_MS = 500;

export function useWorkspacePreferences() {
  const { auditModeEnabled, sidebarCollapsed, setSidebarCollapsed, toggleAuditMode } =
    useGovernanceStore();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);

  // ── 1. Hydrate from Redis on first mount ─────────────────────────────
  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch(PREF_URL, { method: "GET" });
        if (!res.ok) return;
        const prefs = (await res.json()) as {
          sidebarCollapsed?: boolean;
          auditModeEnabled?: boolean;
          lastFqn?: string;
        };

        // Reconcile only if remote value differs from current local value
        // (local localStorage takes precedence if more recent, but we respect Redis
        //  as source of truth on fresh sessions)
        const state = useGovernanceStore.getState();
        if (prefs.sidebarCollapsed !== undefined && prefs.sidebarCollapsed !== state.sidebarCollapsed) {
          setSidebarCollapsed(prefs.sidebarCollapsed);
        }
        // auditMode: only sync if remote is explicitly true and local is false
        if (prefs.auditModeEnabled && !state.auditModeEnabled) {
          toggleAuditMode();
        }
      } catch {
        // Redis unavailable — silently degrade to localStorage only
      } finally {
        isMounted.current = true;
      }
    }
    loadPrefs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Debounced PUT on preference change ────────────────────────────
  useEffect(() => {
    // Skip the initial hydration tick
    if (!isMounted.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetch(PREF_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sidebarCollapsed, auditModeEnabled }),
      }).catch(() => {
        // Redis unavailable — silently ignore
      });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [auditModeEnabled, sidebarCollapsed]);

  // ── 3. Auto-save on tab close / navigation (beforeunload) ────────────
  useEffect(() => {
    function handleUnload() {
      const state = useGovernanceStore.getState();
      const payload = JSON.stringify({
        sidebarCollapsed: state.sidebarCollapsed,
        auditModeEnabled: state.auditModeEnabled,
      });

      // sendBeacon is fire-and-forget — guaranteed to complete even after unload
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(PREF_URL, blob);
      }
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);
}
