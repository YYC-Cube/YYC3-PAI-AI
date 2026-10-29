/**
 * @file IDEChatPanel.tsx
 * @description Self-contained AI chat panel — owns messages, input, streaming state
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.2
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,chat,ai,ui,component
 * @license MIT
 */

import {
    Bot,
    ChevronRight,
    Clipboard,
    Code,
    Figma,
    FolderOpen,
    Image,
    Link,
    Plug,
    Plus,
    Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createMCPClient } from "../../services/mcp-client";
import { useI18n } from "../../i18n/context";
import { useModelStore } from "../../store/model-store";
import { useProjectStore } from "../../store/project-store";
import { settingsActions } from "../../store/settings-store";
import { useThemeStore } from "../../store/theme-store";
import type { ChatMessage } from "../../types";
import { cyberToast } from "../CyberToast";
import { CyberTooltip } from "../CyberTooltip";
import { AIMessageActions } from "./AIMessageActions";
import { AIMessageRenderer } from "./AIMessageRenderer";

/** AI Chat body — fully self-contained with own state */
export function IDEChatPanel() {
  const { t, locale } = useI18n();
  const { tokens, isCyberpunk } = useThemeStore();
  const { openModelSettings, getActiveModel, sendToActiveModelStream, activeModelId, connectivityMap } = useModelStore();
  const projectStore = useProjectStore();
  const borderColor = tokens.border;

  // ── Chat state (owned) ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatToolbarOpen, setChatToolbarOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  // ── MCP tools (local) ──
  // 配置支持可选 endpoint/token（Streamable HTTP）：提供时走真协议拉取工具清单，
  // 否则回退为名称列表（stdio 型服务需要宿主进程，浏览器内不可达）
  const enabledMCPTools = useMemo(() => {
    try {
      const raw = localStorage.getItem("yyc3-mcp-servers");
      if (!raw) return [] as { id: string; name: string; enabled: boolean; endpoint?: string; token?: string }[];
      const servers: { id: string; name: string; enabled: boolean; endpoint?: string; token?: string }[] = JSON.parse(raw);
      return servers.filter(s => s.enabled);
    } catch { return [] as { id: string; name: string; enabled: boolean; endpoint?: string; token?: string }[]; }
  }, []);

  // 真协议工具清单（按 endpoint 连接；失败静默降级）
  const [mcpToolsPrompt, setMcpToolsPrompt] = useState('');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const parts: string[] = [];
      for (const s of enabledMCPTools) {
        if (!s.endpoint) continue;
        try {
          const client = createMCPClient(s.endpoint, s.token);
          await client.connect();
          const text = await client.toolsAsPromptText();
          if (text) parts.push(`# MCP server: ${s.name}\n${text}`);
        } catch { /* CORS/网络失败 → 名称列表降级 */ }
      }
      if (!cancelled) setMcpToolsPrompt(parts.join('\n\n'));
    })().catch(() => { /* 全链失败保持空 */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Init message ──
  useEffect(() => {
    if (!initRef.current) {
      const ts = new Date().toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour12: false });
      setMessages([{ role: "ai", content: t("chat", "initMessage"), timestamp: ts }]);
      initRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll ──
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // ── Recent projects ──
  const recentProjects = useMemo(() => {
    const storeProjects = projectStore.projects.map((p) => ({
      id: p.id,
      name: p.name,
      time: new Date(p.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US"),
      status: (p.status === "active" ? "active" : "idle") as "active" | "idle",
    }));
    if (storeProjects.length > 0) return storeProjects;
    return [
      { id: "demo-1", name: "YYC3-AI-Code", time: "2026-03-18", status: "active" as const },
      { id: "demo-2", name: "Dashboard-v2", time: "2026-03-17", status: "idle" as const },
    ];
  }, [projectStore.projects, locale]);

  // ── Send handler ──（真 SSE：响应由 sendToActiveModelStream 的 onChunk 增量写入，
  //     历史假打字机 streamChatResponse 已随零 mock 决战移除）
  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return;
    const ts = new Date().toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour12: false });
    const msg = chatInput;
    setMessages(prev => [...prev,
      { role: "user", content: msg, timestamp: ts },
      { role: "ai", content: "", timestamp: ts }, // SSE 占位：onChunk 将增量写入
    ]);
    setChatInput("");
    setAiLoading(true);

    const langDirective = `Respond in ${locale === "zh" ? "Chinese" : "English"}.`;
    const rulesInjection = settingsActions.getActiveRulesAsSystemPrompt();
    const systemPromptParts = [`You are YYC\u00B3 AI Code assistant. ${langDirective}`];
    if (mcpToolsPrompt) {
      // 真协议：来自 MCP 服务端的实时工具清单（含调用约定）
      systemPromptParts.push(`\n---\n\n${mcpToolsPrompt}`);
    } else if (enabledMCPTools.length > 0) {
      systemPromptParts.push(`You have access to the following MCP tools: [${enabledMCPTools.map(tool => tool.name).join(", ")}]. You may reference these tools when helping the user with relevant tasks.`);
    }
    if (rulesInjection) {
      systemPromptParts.push(`\n---\n\n${rulesInjection}`);
    }
    const mcpSystemPrompt = systemPromptParts.join(" ");

    const chatHistory = messages.slice(-20).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    const activeModel = getActiveModel();
    if (activeModel) {
      sendToActiveModelStream(msg, { systemPrompt: mcpSystemPrompt, history: chatHistory }, (_d, full) => {
        // 真 SSE：增量直接渲染（覆盖历史假打字机 streamChatResponse）
        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
            updated[lastIdx] = { ...updated[lastIdx], content: full };
          }
          return updated;
        });
      })
        .then(() => { setAiLoading(false); })
        .catch((err: unknown) => {
          const detail = err instanceof Error ? err.message : String(err);
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], content: `[${t("modelSettings", "modelError")}] ${detail}` };
            }
            return updated;
          });
          setAiLoading(false);
        });
    } else {
      setMessages(prev => [...prev, {
        role: "ai",
        content: `未激活模型——请点击上方模型栏选择或配置（模型设置 → 激活）。`,
        timestamp: new Date().toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour12: false }),
      }]);
      setAiLoading(false);
    }
  }, [chatInput, locale, messages, enabledMCPTools, mcpToolsPrompt, getActiveModel, sendToActiveModelStream, t]);

  return (
    <>
      {/* Model indicator */}
      <div className="px-3 py-1.5 border-b" style={{ borderColor }}>
        <button onClick={() => openModelSettings()} className="flex items-center gap-1.5 w-full text-left"
          aria-label={t("modelSettings", "modelConfig")}
          style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: activeModelId ? tokens.success : tokens.foregroundMuted }}>
          <Bot size={10} />
          <span>{(() => { const am = getActiveModel(); return am ? am.name : t("modelSettings", "noActiveModel"); })()}</span>
          {(() => { const am = getActiveModel(); if (!am) return null; const cs = connectivityMap[am.id]; const isOnline = cs?.status === "online"; return (
            <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{
              background: isOnline || !cs ? tokens.success : cs?.status === "checking" ? tokens.warning : tokens.error,
              boxShadow: (isOnline || !cs) && isCyberpunk ? `0 0 4px ${tokens.success}` : "none",
              animation: cs?.status === "checking" ? "pulse 1.5s infinite" : "none",
            }} />
          ); })()}
        </button>
      </div>
      {/* MCP Tools indicator */}
      {enabledMCPTools.length > 0 && (
        <div className="px-3 py-1 border-b flex items-center gap-1.5 overflow-x-auto" style={{ borderColor }}>
          <Plug size={9} color={tokens.secondary} style={{ opacity: 0.6 }} className="shrink-0" />
          <span className="shrink-0 cursor-pointer" style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.secondary, opacity: 0.6, letterSpacing: "0.5px" }}
            onClick={() => openModelSettings("mcp")} title={t("modelSettings", "mcpSettings")}>MCP</span>
          {enabledMCPTools.map(tool => (
            <span key={tool.id} className="shrink-0 px-1.5 py-0.5 rounded cursor-pointer transition-all"
              style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.secondary, opacity: 0.7, background: tokens.secondary + "0a", border: `1px solid ${tokens.secondary}1e` }}
              onClick={() => openModelSettings("mcp")} title={`${t("modelSettings", "mcpConfigure")} ${tool.name}`}>
              {tool.name}
            </span>
          ))}
        </div>
      )}
      {/* Chat messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 neon-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[90%] rounded-lg px-2.5 py-1.5"
              style={{ background: msg.role === "ai" ? tokens.primaryGlow : tokens.cardBg, border: `1px solid ${msg.role === "ai" ? tokens.cardBorder : tokens.borderDim}` }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: msg.role === "ai" ? tokens.primary : tokens.primaryDim }}>
                  {msg.role === "ai" ? t("common", "aiLabel") : t("common", "operatorLabel")}
                </span>
                <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.foregroundMuted }}>{msg.timestamp}</span>
              </div>
              <AIMessageRenderer content={msg.content} />
              {msg.role === "ai" && (
                <AIMessageActions content={msg.content} onRegenerate={() => {}} isRegenerating={false} />
              )}
            </div>
          </div>
        ))}
        {aiLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-2.5 py-1.5" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.cardBorder}` }}>
              <div className="flex items-center gap-1">
                <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.primary }}>{t("common", "aiLabel")}</span>
                {[0, 1, 2].map((j) => (
                  <div key={j} className="w-1 h-1 rounded-full" style={{ background: tokens.primary, animation: `neon-pulse 1s ${j * 0.2}s ease-in-out infinite`, boxShadow: isCyberpunk ? `0 0 3px ${tokens.primary}` : "none" }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Chat input */}
      <div className="px-3 py-4 border-t shrink-0" style={{ borderColor }}>
        <div className="flex items-center gap-1 mb-2">
          <CyberTooltip label={t("ide", "expandMenu")} position="top">
            <button onClick={() => setChatToolbarOpen(!chatToolbarOpen)} className="p-1 rounded transition-all"
              aria-label={t("ide", "expandMenu")}
              style={{ color: chatToolbarOpen ? tokens.background : tokens.primary, background: chatToolbarOpen ? tokens.primary : "transparent", border: `1px solid ${chatToolbarOpen ? tokens.primary : tokens.border}` }}>
              <Plus size={11} />
            </button>
          </CyberTooltip>
          {chatToolbarOpen && (
            <div className="flex items-center gap-0.5" style={{ animation: "fadeIn 0.2s ease-out" }}>
              {[
                { icon: Image, label: t("ide", "imageUpload"), notifyKey: "imageUpload" as const },
                { icon: FolderOpen, label: t("ide", "fileImport"), notifyKey: "fileImport" as const },
                { icon: Link, label: t("ide", "githubLink"), notifyKey: "githubLink" as const },
                { icon: Figma, label: t("ide", "figmaFile"), notifyKey: "figmaImport" as const },
                { icon: Code, label: t("ide", "codeSnippet"), notifyKey: "codeSnippet" as const },
                { icon: Clipboard, label: t("ide", "clipboard"), notifyKey: "clipboardPaste" as const },
              ].map((item, idx) => (
                <CyberTooltip key={idx} label={item.label} position="top">
                  <button onClick={() => cyberToast(t("notify", item.notifyKey))} className="p-1 rounded transition-all hover:bg-white/5"
                    aria-label={item.label}
                    style={{ color: tokens.primary, border: `1px solid ${tokens.borderDim}` }}>
                    <item.icon size={10} />
                  </button>
                </CyberTooltip>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-start gap-2">
          <ChevronRight size={12} color={tokens.primary} style={{ marginTop: 6 }} />
          <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
            placeholder={t("ide", "chatPlaceholder")} rows={3}
            className="flex-1 bg-transparent outline-none resize-none neon-scrollbar"
            style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary, caretColor: tokens.primary, lineHeight: "1.5" }} />
          <CyberTooltip label={t("tooltips", "send")} position="top">
            <button onClick={handleChatSend} className="p-1 rounded transition-all hover:opacity-80"
              aria-label={t("tooltips", "send")}
              style={{ border: `1px solid ${tokens.border}`, marginTop: 2 }}>
              <Send size={12} color={tokens.primary} />
            </button>
          </CyberTooltip>
        </div>
      </div>
      {/* Recent project cards */}
      <div className="px-3 py-2 border-t shrink-0" style={{ borderColor }}>
        <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary, opacity: 0.5, letterSpacing: "1px" }}>
          {t("ide", "recentProjects")}
        </span>
        <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1 neon-scrollbar" style={{ scrollbarWidth: "thin" }}>
          {recentProjects.map((proj) => (
            <button key={proj.id} onClick={() => { cyberToast(`${t("notify", "projectOpened")}: ${proj.name}`); }}
              className="shrink-0 rounded-md p-2 transition-all hover:bg-white/5 text-left"
              style={{ width: 120, border: `1px solid ${tokens.borderDim}`, background: tokens.primaryGlow }}>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: proj.status === "active" ? tokens.success : tokens.foregroundMuted, boxShadow: proj.status === "active" ? `0 0 4px ${tokens.success}` : "none" }} />
                <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</span>
              </div>
              <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.foregroundMuted }}>{proj.time}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
