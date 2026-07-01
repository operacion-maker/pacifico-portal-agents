"use client";

import type { Message } from "ai";
import Image from "next/image";
import { MessageBubble } from "./MessageBubble";
import { StreamingIndicator } from "./StreamingIndicator";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import type { AgentConfig } from "@/lib/agents/agent-registry";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick?: (text: string) => void;
  agentConfig?: AgentConfig;
}

export function MessageList({ messages, isLoading, onSuggestionClick, agentConfig }: MessageListProps) {
  const { containerRef } = useScrollToBottom<HTMLDivElement>([messages, isLoading]);

  // Use agent config for dynamic suggestions and greeting, or fallback
  const suggestions = agentConfig?.chatConfig.suggestions ?? [];
  const greeting = agentConfig?.chatConfig.greeting;

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Avatar + greeting */}
          <div className="space-y-4">
            <Image
              src={greeting?.avatar ?? "/torito.png"}
              alt={agentConfig?.name ?? "Agent"}
              width={80}
              height={80}
              className="mx-auto h-20 w-auto object-contain drop-shadow-md"
            />
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                {greeting?.title ?? "¡Hola! Soy"}{" "}
                <span className="text-primary">{greeting?.highlightName ?? agentConfig?.name ?? "Agent"}</span>{" "}
                😊
              </h3>
              <p className="text-muted text-sm mt-2 leading-relaxed max-w-lg mx-auto">
                {greeting?.subtitle ?? ""}
              </p>
              {greeting?.bullets && greeting.bullets.length > 0 && (
                <ul className="text-muted text-sm mt-3 text-left max-w-lg mx-auto space-y-1">
                  {greeting.bullets.map((bullet, i) => (
                    <li key={i}>• {bullet}</li>
                  ))}
                </ul>
              )}
              {greeting?.footer && (
                <p className="text-muted text-sm mt-3 max-w-lg mx-auto">
                  {greeting.footer}
                </p>
              )}
            </div>
          </div>

          {/* Suggestion buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => onSuggestionClick?.(s.text)}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${s.color}`}
              >
                <s.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold block">{s.label}</span>
                  <span className="text-xs opacity-75 leading-snug block mt-0.5">
                    {s.text}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted/60">
            Puedes escribir cualquier pregunta o elegir una sugerencia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4">
      <div className="max-w-3xl mx-auto py-6 space-y-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role as "user" | "assistant"}
            content={message.content}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <StreamingIndicator />
        )}
      </div>
    </div>
  );
}
