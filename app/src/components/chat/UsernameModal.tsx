"use client";

import { useState } from "react";
import Image from "next/image";

interface UsernameModalProps {
  onSubmit: (username: string) => void;
}

export function UsernameModal({ onSubmit }: UsernameModalProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col items-center gap-5"
      >
        <Image
          src="/dalogo.png"
          alt="Data & Analytics"
          width={120}
          height={48}
          className="h-8 w-auto object-contain"
        />
        <h2 className="text-lg font-semibold text-foreground">
          Bienvenido a ModelatorX
        </h2>
        <p className="text-sm text-muted text-center">
          Ingresa tu nombre de usuario para comenzar.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ej: juan.perez"
          autoFocus
          className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          Comenzar
        </button>
      </form>
    </div>
  );
}
