/**
 * @file chat.ts
 * @description 聊天消息 & 会话类型定义 — 闭环整合折叠/锚定/引用/重新生成/多会话/持久化
 */

import type { MessageStatus, FeedbackType, TokenUsage } from '../app/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  folded: boolean;
  timestamp: number;
  /** 扩展字段 — 与现有 app/types.ts ChatMessage 兼容 */
  modelId?: string;
  latencyMs?: number;
  status?: MessageStatus;
  feedback?: FeedbackType;
  tokenUsage?: TokenUsage;
}

/** 会话结构体 */
export interface ChatSession {
  sid: string;
  title: string;
  createAt: number;
  updateAt: number;
  list: ChatMessage[];
}

/** 主题模式 */
export type ThemeMode = 'system' | 'light' | 'dark';