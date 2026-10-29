/**
 * file: useAI.ts
 * description: AI React Hook · 提供 AI 对话功能，支持流式响应和多提供商
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-26
 * updated: 2026-03-26
 * status: active
 * tags: [hook],[ai],[react]
 *
 * copyright: YanYuCloudCube Team
 * license: MIT
 *
 * brief: 核心 AI Hook，管理对话、配置和流式响应
 *
 * details:
 * - AI 对话功能（支持流式响应）
 * - 多提供商支持（OpenAI, Anthropic, Ollama 等）
 * - 配置管理（localStorage 持久化，支持版本迁移）
 * - 自动降级（网络失败时使用模拟响应）
 * - 超时控制（默认 2 秒超时）
 * - 完整的 TypeScript 类型支持
 *
 * dependencies: React (useState, useEffect, useCallback), Fetch API, localStorage
 * exports: useAI, UseAIReturn
 * notes: Hook 会自动从 localStorage 加载配置，并在修改时保存
 */

import { useCallback, useEffect, useState } from 'react';
import type { AIConfig, AIMessage, AIStreamCallback } from './ai-types';
import { loadProviderKey, saveProviderKey } from '../utils/key-storage';

/**
 * useAI Hook 返回类型 / useAI Hook return type
 */
export interface UseAIReturn {
  /** 聊天 / Chat */
  chat: (messages: AIMessage[], onChunk: AIStreamCallback) => Promise<void>;
  /** 是否正在流式输出 / Is streaming */
  isStreaming: boolean;
  /** AI 配置 / AI config */
  config: AIConfig;
  /** 保存配置 / Save config */
  saveConfig: (newConfig: AIConfig) => void;
  /** 加载完成 / Loading complete */
  loading: boolean;
}

/**
 * 默认配置 / Default config
 */
const DEFAULT_CONFIG: AIConfig = {
  provider: 'ollama',
  apiKey: 'ollama',
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3',
  temperature: 0.7,
  version: 1,
};

/**
 * 本地存储键 / Local storage key
 */
const STORAGE_KEY = 'yyc3_ai_config';
/** apiKey 在 key-storage 门面中的槽位（不复用 provider 表，避免与 ModelSettings 串键） */
const KEY_STORAGE_ID = 'legacy:useai';

/**
 * 当前配置版本 / Current config version
 */
const CURRENT_VERSION = 1;

/**
 * AI Hook
 *
 * 提供AI对话功能，支持流式响应、多提供商和配置管理
 * AI chat functionality with streaming response, multi-provider support, and config management
 *
 * @returns {UseAIReturn} Hook 返回值 / Hook return value
 *
 * @example
 * ```tsx
 * const { chat, isStreaming, config } = useAI();
 *
 * const handleSend = async (message: string) => {
 *   const messages = [
 *     { role: 'user' as const, content: message }
 *   ];
 *
 *   await chat(messages, (chunk) => {
 *     console.log('Streaming:', chunk);
 *   });
 * };
 * ```
 */
export function useAI(): UseAIReturn {
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  // 加载配置 / Load config（apiKey 经 key-storage 门面：保险库优先，明文降级）
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 兼容历史明文：迁移窗口内立即改道门面并从配置体剥离
        const legacyKey = typeof parsed.apiKey === 'string' && parsed.apiKey && parsed.apiKey !== 'ollama' ? parsed.apiKey : '';
        loadProviderKey(KEY_STORAGE_ID).then((vaultKey) => {
          const apiKey = legacyKey || vaultKey;
          if (legacyKey) saveProviderKey(KEY_STORAGE_ID, legacyKey).catch(() => { /* 门面内部降级 */ });
          const merged = { ...DEFAULT_CONFIG, ...parsed, apiKey, version: CURRENT_VERSION };
          const { apiKey: _stripped, ...persistSafe } = merged;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(persistSafe));
          setConfig(merged);
        }).catch(() => setConfig({ ...DEFAULT_CONFIG, ...parsed }));
      }
    } catch {
      // 加载失败使用默认配置 / Use default config on load failure
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存配置 / Save config helper（apiKey 不落配置体，走门面）
  const saveConfig = useCallback((newConfig: AIConfig) => {
    try {
      const { apiKey, ...persistSafe } = newConfig;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistSafe));
      if (apiKey && apiKey !== 'ollama') {
        saveProviderKey(KEY_STORAGE_ID, apiKey).catch(() => { /* 门面内部降级 */ });
      }
      setConfig(newConfig);
    } catch {
      // 保存失败静默处理 / Silent on save failure
    }
  }, []);

  // 聊天函数 / Chat function
  const chat = useCallback(
    async (messages: AIMessage[], onChunk: AIStreamCallback) => {
      setIsStreaming(true);

      const currentConfig = config;

      try {
        // 创建超时控制器 / Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时检查

        try {
          const response = await fetch(
            `${currentConfig.baseUrl}/chat/completions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${currentConfig.apiKey}`,
              },
              body: JSON.stringify({
                model: currentConfig.model,
                messages: messages,
                temperature: currentConfig.temperature,
                stream: true,
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`AI API Error: ${response.statusText}`);
          }
          if (!response.body) {
            throw new Error('No response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = (buffer + chunk).split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') {
                  continue;
                }

                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content || '';
                  if (content) {
                    onChunk(content);
                  }
                } catch {
                  // 流式块解析异常忽略 / Ignore stream chunk parse error
                }
              }
            }
          }
        } catch (networkErr) {
          // 网络失败：诚实报错（拒绝伪造 AI 回复）
          const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
          onChunk(`\n[ERROR] 请求失败：${msg}\n请检查 Ollama 服务是否运行（OLLAMA_ORIGINS=${window.location.origin} ollama serve）或在模型设置中切换可用模型。`);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        onChunk(`\n[SYSTEM_ERROR]: ${errorMessage}\n`);
      } finally {
        setIsStreaming(false);
      }
    },
    [config]
  );

  return { chat, isStreaming, config, saveConfig, loading };
}
