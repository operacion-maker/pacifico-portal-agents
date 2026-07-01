"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatSession, ChatMessage } from "@/types";

function generateId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sessionHeaders(username: string): HeadersInit {
  return { "Content-Type": "application/json", "x-user-id": username };
}

export function useChatHistory(username: string | null) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(() => generateId());

  // Track which chatIds have been created in Redis to avoid duplicate POSTs
  const createdIdsRef = useRef<Set<string>>(new Set());
  // Debounce save: store pending save and flush with a timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{ id: string; messages: ChatMessage[]; title?: string } | null>(null);

  // Load sessions from Redis when username is available
  useEffect(() => {
    if (!username) return;
    createdIdsRef.current.clear();

    (async () => {
      try {
        const res = await fetch("/api/sessions", {
          headers: { "x-user-id": username },
        });
        if (res.ok) {
          const data: ChatSession[] = await res.json();
          setSessions(data);
          // Mark all existing sessions as created
          data.forEach((s) => createdIdsRef.current.add(s.id));
        }
      } catch {
        // API unavailable — start with empty sessions
      }
    })();
  }, [username]);

  const refreshSessions = useCallback(async () => {
    if (!username) return;
    try {
      const res = await fetch("/api/sessions", {
        headers: { "x-user-id": username },
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch {
      // ignore
    }
  }, [username]);

  const createNewChat = useCallback(() => {
    const newId = generateId();
    setActiveChatId(newId);
    return newId;
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const getMessages = useCallback(
    async (id: string): Promise<ChatMessage[]> => {
      if (!username) return [];
      try {
        const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
          headers: { "x-user-id": username },
        });
        if (res.ok) {
          const data = await res.json();
          return data.messages ?? [];
        }
      } catch {
        // ignore
      }
      return [];
    },
    [username]
  );

  // Flush a pending save to the API
  const flushSave = useCallback(
    async (id: string, messages: ChatMessage[], title?: string) => {
      if (!username) return;
      try {
        // Create session if not yet created
        if (!createdIdsRef.current.has(id)) {
          await fetch("/api/sessions", {
            method: "POST",
            headers: sessionHeaders(username),
            body: JSON.stringify({
              chatId: id,
              title: title || messages[0]?.content.slice(0, 60) || "Nueva conversación",
            }),
          });
          createdIdsRef.current.add(id);
        }

        // Update session with messages and optional title
        await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: sessionHeaders(username),
          body: JSON.stringify({
            messages,
            ...(title ? { title } : {}),
          }),
        });

        await refreshSessions();
      } catch {
        // ignore
      }
    },
    [username, refreshSessions]
  );

  const saveMessages = useCallback(
    (id: string, messages: ChatMessage[], title?: string) => {
      // Debounce: buffer the latest save and flush after 500ms of inactivity
      pendingSaveRef.current = { id, messages, title };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const pending = pendingSaveRef.current;
        if (pending) {
          pendingSaveRef.current = null;
          flushSave(pending.id, pending.messages, pending.title);
        }
      }, 500);
    },
    [flushSave]
  );

  const deleteChat = useCallback(
    async (id: string) => {
      if (!username) return;
      try {
        await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { "x-user-id": username },
        });
        createdIdsRef.current.delete(id);
        await refreshSessions();
      } catch {
        // ignore
      }
      if (id === activeChatId) {
        createNewChat();
      }
    },
    [username, activeChatId, refreshSessions, createNewChat]
  );

  return {
    sessions,
    activeChatId,
    createNewChat,
    selectChat,
    getMessages,
    saveMessages,
    deleteChat,
  };
}
