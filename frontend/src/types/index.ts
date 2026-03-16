export interface User {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  authenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface GmailMessage {
  id: string;
  threadId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

export type ModuleId = "ai-assistant" | "gmail" | "drive" | "dashboard" | "registrar" | "pii-clipboard" | "pii-redactor";

export interface ModuleConfig {
  id: ModuleId;
  title: string;
  icon: string;
  description: string;
}
