// src/types/chat.ts
export interface MessageContent {
  text?: string;
  html?: string;
  files?: File[];
  role: 'user' | 'assistant';
  [key: string]: any;
}

export interface ChatTheme {
  primary: string;
  secondary: string;
  text: string;
  background: string;
}

export interface ChatConfig {
  title?: string;
  botName?: string;
  avatarSrc?: string | null;
  supportTopics?: string | null;
  placeholder?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: number;
  height?: number;
  theme?: ChatTheme;
  modelId?: string;
}

export interface ChatWidgetProps {
  config?: Partial<ChatConfig>;
}