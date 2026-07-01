"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "modelator-username";

export function useUsername() {
  const [username, setUsernameState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setUsernameState(stored);
    setLoaded(true);
  }, []);

  const setUsername = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase().replace(/\s+/g, ".");
    localStorage.setItem(STORAGE_KEY, trimmed);
    setUsernameState(trimmed);
  }, []);

  const clearUsername = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUsernameState(null);
  }, []);

  return { username, loaded, setUsername, clearUsername };
}
