"use client";

// Pre-generate both agent routes at build time to avoid 25s on-demand compilation
export const dynamic = "force-dynamic";


import { useState, useEffect, useCallback, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Menu, LogOut, MessageSquareHeart } from "lucide-react";
import Image from "next/image";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { UsernameModal } from "@/components/chat/UsernameModal";
import { MetaBuilderChat } from "@/components/agents/metabuilder/MetaBuilderChat";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useUsername } from "@/hooks/useUsername";
import { useAgent } from "@/components/chat/AgentContext";

export default function AgentChatPage() {
  const agent = useAgent();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverUsername, setServerUsername] = useState<string | null | undefined>(undefined);
  const { username: localUsername, loaded: localLoaded, setUsername: setLocalUsername, clearUsername } = useUsername();

  // Fetch server-resolved username on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sessions/me");
        if (res.ok) {
          const data = await res.json();
          setServerUsername(data.username ?? null);
        } else {
          setServerUsername(null);
        }
      } catch {
        setServerUsername(null);
      }
    })();
  }, []);

  const username = serverUsername ?? localUsername;
  const loaded = serverUsername !== undefined && localLoaded;

  const { sessions, activeChatId, createNewChat, selectChat, getMessages, saveMessages, deleteChat } =
    useChatHistory(username);

  const threadId = username
    ? `${username}:${agent.id}:${activeChatId}`
    : `${agent.id}:${activeChatId}`;

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } =
    useChat({
      api: agent.chatConfig.endpoint,
      id: activeChatId,
      body: { threadId },
      headers: username ? { "x-user-id": username } : undefined,
    });

  const loadingMessagesRef = useRef(false);

  useEffect(() => {
    loadingMessagesRef.current = true;
    (async () => {
      const stored = await getMessages(activeChatId);
      if (stored.length > 0) {
        setMessages(stored.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: new Date(m.createdAt) })));
      } else {
        setMessages([]);
      }
      loadingMessagesRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  useEffect(() => {
    if (loadingMessagesRef.current || messages.length === 0) return;
    const chatMessages = messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt?.getTime() ?? Date.now(),
    }));
    const firstUserMsg = messages.find((m) => m.role === "user");
    saveMessages(activeChatId, chatMessages, firstUserMsg?.content.slice(0, 60));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading]);

  const handleNewChat = useCallback(() => {
    createNewChat();
    setMessages([]);
    setSidebarOpen(false);
  }, [createNewChat, setMessages]);

  const handleSelectChat = useCallback((id: string) => {
    selectChat(id);
    setSidebarOpen(false);
  }, [selectChat]);

  const handleSuggestionClick = useCallback((text: string) => {
    append({ role: "user", content: text });
  }, [append]);

  if (!loaded) return null;
  if (!serverUsername && !localUsername) return <UsernameModal onSubmit={setLocalUsername} />;

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        sessions={sessions}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        agentName={agent.name}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card-hover lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Image src="/dalogo.png" alt="Data & Analytics" width={100} height={40} className="h-7 w-auto object-contain" />
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h1 className="text-sm font-semibold text-foreground">{agent.name}</h1>
              {agent.status === "beta" && <span className="status-badge status-beta">Beta</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{username}</span>
            <a
              href="https://forms.office.com/Pages/ResponsePage.aspx?id=dx_cZg0uE025YXwuY6o3a2aNtVBwxUVLgzeB8J66zyJUN0pHWkZURlZTV0RSSFdYSTlDSTNaRzY2TC4u"
              target="_blank"
              rel="noopener noreferrer"
              title="Danos tu feedback"
              className="p-1.5 rounded-lg text-muted hover:text-amber-500 hover:bg-card-hover transition-colors"
            >
              <MessageSquareHeart className="w-4 h-4" />
            </a>
            {!serverUsername && (
              <button onClick={clearUsername} title="Cerrar sesión" className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card-hover">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Chat area — MetaBuilder has its specialized interactive UI */}
        {agent.id === "metabuilder" ? (
          <MetaBuilderChat
            agentId={agent.id}
            threadId={threadId}
            username={username ?? undefined}
          />
        ) : (
          <>
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onSuggestionClick={handleSuggestionClick}
              agentConfig={agent}
            />
            <ChatInput
              value={input}
              onChange={handleInputChange}
              onSubmit={() => handleSubmit()}
              isLoading={isLoading}
              placeholder={agent.chatConfig.placeholder}
            />
          </>
        )}
      </div>
    </div>
  );
}
