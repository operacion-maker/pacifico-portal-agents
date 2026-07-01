"use client";

import { useChat } from "@ai-sdk/react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatContainerProps {
  chatId: string;
  initialMessages?: Array<{ id: string; role: "user" | "assistant"; content: string }>;
}

export function ChatContainer({ chatId, initialMessages = [] }: ChatContainerProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } =
    useChat({
      api: "/api/chat",
      id: chatId,
      initialMessages: initialMessages.map((m) => ({
        ...m,
        createdAt: new Date(),
      })),
    });

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={() => handleSubmit()}
        isLoading={isLoading}
      />
    </div>
  );
}
