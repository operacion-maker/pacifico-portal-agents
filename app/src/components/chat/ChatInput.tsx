"use client";

import { useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSubmit, isLoading, placeholder }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !isLoading) {
          onSubmit();
        }
      }
    },
    [value, isLoading, onSubmit]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Escribe tu pregunta..."}
          rows={1}
          className={cn(
            "w-full resize-none rounded-xl border border-input-border bg-input-bg px-4 py-3 pr-12",
            "text-foreground placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-input-focus focus:border-transparent",
            "transition-all duration-200"
          )}
          disabled={isLoading}
        />
        <button
          onClick={() => {
            if (value.trim() && !isLoading) onSubmit();
          }}
          disabled={!value.trim() || isLoading}
          className={cn(
            "absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors",
            value.trim() && !isLoading
              ? "text-primary hover:bg-primary/10"
              : "text-muted/40 cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
