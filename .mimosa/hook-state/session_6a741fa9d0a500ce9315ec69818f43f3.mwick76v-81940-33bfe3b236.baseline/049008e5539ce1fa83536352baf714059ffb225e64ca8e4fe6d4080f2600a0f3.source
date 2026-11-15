/**
 * file: types.ts
 * description: AI 类型定义文件 · 包含所有 AI 相关的 TypeScript 接口和类型
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-26
 * updated: 2026-03-26
 * status: active
 * tags: [ai],[types],[typescript]
 *
 * copyright: YanYuCloudCube Team
 * license: MIT
 *
 * brief: AI 相关的类型定义
 *
 * details:
 * - AIProvider: AI 提供商枚举（支持多个主流提供商）
 * - AIConfig: AI 配置接口（包含所有必要参数）
 * - AIMessage: AI 消息接口（支持 user/assistant/system 角色）
 * - AIStreamCallback: 流式回调类型
 *
 * dependencies: 无
 * exports: AIProvider, AIConfig, AIMessage, AIStreamCallback
 * notes: 所有类型均支持扩展，便于添加新的提供商
 */

/**
 * AI 提供商 / AI Provider
 */
export type AIProvider =
  | 'openai' // OpenAI
  | 'anthropic' // Anthropic (Claude)
  | 'ollama' // Ollama (Local LLM)
  | 'zhipu' // Zhipu AI (GLM)
  | 'qwen' // Alibaba Qwen
  | 'deepseek' // DeepSeek
  | 'custom'; // Custom Provider

/**
 * AI 配置 / AI Configuration
 */
export interface AIConfig {
  /** 提供商 / Provider */
  provider: AIProvider;
  /** API 密钥 / API Key */
  apiKey: string;
  /** 基础 URL / Base URL */
  baseUrl: string;
  /** 模型名称 / Model name */
  model: string;
  /** 温度参数 / Temperature (0-2) */
  temperature?: number;
  /** 最大 tokens / Max tokens */
  maxTokens?: number;
  /** 配置版本 / Config version */
  version?: number;
}

/**
 * AI 消息 / AI Message
 */
export interface AIMessage {
  /** 角色 / Role */
  role: 'user' | 'assistant' | 'system';
  /** 内容 / Content */
  content: string;
}

/**
 * AI 流式回调 / AI Stream Callback
 */
export type AIStreamCallback = (chunk: string) => void;
