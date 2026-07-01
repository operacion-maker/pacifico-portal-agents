export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface StoredConversation {
  session: ChatSession;
  messages: ChatMessage[];
}

export interface AgentResponse {
  content: string;
}

export interface DatabricksAuthInfo {
  userId?: string;
  email?: string;
  accessToken?: string;
}
