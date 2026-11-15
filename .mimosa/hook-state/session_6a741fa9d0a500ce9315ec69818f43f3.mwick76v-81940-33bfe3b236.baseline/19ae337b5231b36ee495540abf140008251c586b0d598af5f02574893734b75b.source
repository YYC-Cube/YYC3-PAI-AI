/**
 * @file settings-model.ts
 * @description ModelSettings 共享数据层 —— Provider 目录 / MCP 预置 / localStorage 键与读写助手
 * （自 ModelSettings.tsx 拆出：1769 行巨型文件瘦身第一步）
 */

import { Cloud } from "lucide-react";

// ===== Types =====
export interface ProviderDef {
  id: string; name: string; shortName: string; icon: typeof Cloud;
  color: string; bgColor: string; borderColor: string;
  description: string; baseURL: string;
  apiKeyUrl: string; apiKeyPlaceholder: string;
  models: ModelDef[]; openaiCompatible: boolean; docsUrl: string;
}
export interface ModelDef {
  id: string; name: string; description: string;
  contextWindow?: string; pricing?: string;
}
export interface MCPServerConfig {
  id: string; name: string; description: string;
  command: string; args: string[]; env: Record<string, string>; enabled: boolean;
  /** Streamable HTTP 端点（可选）：提供时 MCP 走真协议（mcp-client.ts） */
  endpoint?: string;
  /** 端点鉴权 Bearer token（可选） */
  token?: string;
}

// ===== Provider Definitions =====

// Ollama 直连地址：生产为静态站（无 dev 代理），统一浏览器直连。
// 跨域需本机 Ollama 放行来源：OLLAMA_ORIGINS=https://pai.yyc3.vip ollama serve
export const OLLAMA_BASE = (import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");

export const PROVIDERS: ProviderDef[] = [
  {
    id: "zhipu", name: "Z.ai 智谱", shortName: "GLM", icon: Cloud,
    color: "#4488ff", bgColor: "rgba(68,136,255,0.06)", borderColor: "rgba(68,136,255,0.2)",
    description: "Z.ai 通用端点 · GLM-5 / GLM-4 系列",
    baseURL: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys", apiKeyPlaceholder: "输入智谱 API Key...",
    openaiCompatible: true, docsUrl: "https://open.bigmodel.cn/dev/api/normal-model/glm-4",
    models: [
      { id: "glm-5.1", name: "GLM-5.1", description: "最新旗舰推理模型", contextWindow: "128K" },
      { id: "glm-5-turbo", name: "GLM-5-Turbo", description: "高速版旗舰模型", contextWindow: "128K" },
      { id: "glm-4.7", name: "GLM-4.7", description: "高性能对话模型", contextWindow: "128K" },
      { id: "glm-4.5-air", name: "GLM-4.5-Air", description: "轻量高速模型", contextWindow: "128K" },
    ],
  },
  {
    id: "zhipu-coding", name: "Z.ai Coding", shortName: "Code", icon: Cloud,
    color: "#22c55e", bgColor: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)",
    description: "Z.ai Coding 端点 · 代码专用",
    baseURL: "https://open.bigmodel.cn/api/coding/paas/v4/chat/completions",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys", apiKeyPlaceholder: "输入智谱 API Key (与通用端点共享)",
    openaiCompatible: true, docsUrl: "https://open.bigmodel.cn/dev/api/coding-model/coding-model",
    models: [
      { id: "codegeex-4", name: "CodeGeeX-4", description: "代码生成专用模型", contextWindow: "128K" },
    ],
  },
  {
    id: "ollama", name: "Ollama (本地)", shortName: "Local", icon: Cloud,
    color: "#ffaa00", bgColor: "rgba(255,170,0,0.06)", borderColor: "rgba(255,170,0,0.2)",
    description: "本地部署 · 私有数据",
    baseURL: OLLAMA_BASE + "/api/chat",
    apiKeyUrl: "", apiKeyPlaceholder: "",
    openaiCompatible: false, docsUrl: "https://ollama.com",
    models: [],
  },
];

export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  { id: "mcp-filesystem", name: "Filesystem", description: "\u6587\u4EF6\u7CFB\u7EDF\u8BFB\u5199", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "/app/designs"], env: {}, enabled: true },
  { id: "mcp-fetch", name: "Fetch", description: "HTTP \u8BF7\u6C42\u5DE5\u5177", command: "npx", args: ["-y", "@modelcontextprotocol/server-fetch"], env: {}, enabled: true },
  { id: "mcp-postgres", name: "PostgreSQL", description: "\u6570\u636E\u5E93\u67E5\u8BE2", command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres"], env: { DATABASE_URL: "postgresql://user:password@localhost:5432/mydb" }, enabled: false },
];

// ===== Storage =====
export const SK = { keys: "yyc3-provider-api-keys", urls: "yyc3-provider-urls", mcp: "yyc3-mcp-servers", custom: "yyc3-custom-providers", disabled: "yyc3-disabled-providers", customModels: "yyc3-custom-models" };

export function loadJ<T>(k: string, fb: T): T { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } }
export function saveJ(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
