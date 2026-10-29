/**
 * @file FullscreenMode.tsx
 * @description FullscreenMode组件/模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,fullscreen,ui
 */

import {
  Activity,
  AppWindow,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Brain,
  ChevronRight,
  Code2,
  Command,
  Cpu, Database,
  Eye,
  FileText,
  Flame,
  Globe,
  Image as ImageIcon,
  Layers,
  Lock,
  MessageCircle,
  MessageSquare,
  Radio,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Wifi,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { useModelStore } from "../store/model-store";
import { useThemeStore } from "../store/theme-store";
import type { ChatMessage } from "../types";
import { cyberToast } from "./CyberToast";
import { CyberTooltip } from "./CyberTooltip";
import { GlitchText } from "./GlitchText";
import { HoloCard } from "./HoloCard";
import { LangSwitcher } from "./LangSwitcher";
import { StatDetailPanel } from "./StatDetailPanel";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { MiniAudioPlayer } from "./audio/MiniAudioPlayer";
import { AIMessageRenderer } from "./ide/AIMessageRenderer";
import logoImg from "/yyc3-icons/macOS/1024.png";

// Font/color constants removed — use tokens from useThemeStore() instead

/**
 * 对齐 Guidelines: 系统提示词配置 — 根据当前上下文自动注入系统提示词
 */
const SYSTEM_PROMPT_ZH = `你是 YYC³ AI Code 智能编程助手，隶属于 YanYuCloudCube 团队。
你的核心能力：代码生成、错误诊断、性能优化、架构建议。
请用简洁专业的语言回复用户，必要时提供代码示例。
当用户询问与编程无关的问题时，礼貌地引导回技术话题。
版本号：v4.8.0 | 品牌标语：言传千行代码 | 语枢万物智能`;

const SYSTEM_PROMPT_EN = `You are YYC³ AI Code intelligent programming assistant, part of the YanYuCloudCube team.
Your core capabilities: code generation, error diagnostics, performance optimization, architecture suggestions.
Reply concisely and professionally, provide code examples when needed.
When asked non-programming questions, politely redirect to technical topics.
Version: v4.8.0 | Brand: Words Initiate Quadrants, Language Serves as Core for Future`;

/** 对话历史窗口大小（最近 N 轮对话传给 API） */
const HISTORY_WINDOW = 10;

const sidebarKeys = [
  { icon: Brain, key: "neuralCore" },
  { icon: Database, key: "dataMatrix" },
  { icon: Globe, key: "netScanner" },
  { icon: Shield, key: "iceBreaker" },
  { icon: Terminal, key: "cliAccess" },
  { icon: Settings, key: "config" },
];

const statKeys = [
  { key: "neuralNet", value: 97.3 },
  { key: "memory", value: 64.8 },
  { key: "bandwidth", value: 82.1 },
  { key: "quantum", value: 45.6 },
];

const logKeys = ["log1", "log2", "log3", "log4", "log5", "log6", "log7", "log8"];
const navTabs = [
  { key: "neural", icon: Brain },
  { key: "data", icon: Database },
  { key: "network", icon: Globe },
  { key: "security", icon: Shield },
];
const systemInfoKeys = [
  { icon: Cpu, key: "quantumCpu", value: "4.7 THz" },
  { icon: Layers, key: "neuralLayers", value: "2,847" },
  { icon: Lock, key: "encryption", value: "AES-512" },
  { icon: Zap, key: "powerCore", value: "98.2%" },
];


export function FullscreenMode({ onSwitchMode, onSwitchToIDE, onOpenSettings, onOpenNotifications, onOpenCommandPalette, onOpenGlobalSearch, onOpenAIWriting, onOpenContentTemplate, onOpenMaterialManager, onOpenPublishQueue, onOpenTrendingTopics, onOpenChat }: {
  onSwitchMode: () => void;
  onSwitchToIDE: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenGlobalSearch?: () => void;
  // 自媒体创作引擎入口
  onOpenAIWriting?: () => void;
  onOpenContentTemplate?: () => void;
  onOpenMaterialManager?: () => void;
  onOpenPublishQueue?: () => void;
  onOpenTrendingTopics?: () => void;
  // 智能聊天入口
  onOpenChat?: () => void;
}) {
  const { t, locale } = useI18n();
  const { openModelSettings, getActiveModel, sendToActiveModelStream, activeModelId, connectivityMap, lastSuccessTime } = useModelStore();
  const { tokens, isCyberpunk } = useThemeStore();

  const getModelStatusColor = useCallback(() => {
    if (!activeModelId) return tokens.foregroundMuted;
    const am = getActiveModel();
    if (!am) return tokens.foregroundMuted;
    const cs = connectivityMap[am.id];
    if (!cs || cs.status === "online" || cs.status === "checking") return tokens.success;
    if (cs.status === "offline" && lastSuccessTime > 0 && (Date.now() - lastSuccessTime) < 300_000) return tokens.success;
    if (cs.status === "offline") return tokens.error;
    return tokens.foregroundMuted;
  }, [activeModelId, connectivityMap, lastSuccessTime, getActiveModel, tokens]);
  const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "ai", content: t("chat", "initMessage"), timestamp: "00:00:01" },
    { role: "user", content: t("chat", "userMsg1"), timestamp: "00:01:23" },
    { role: "ai", content: t("chat", "aiMsg1"), timestamp: "00:01:24" },
  ]);
  const [input, setInput] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [stats, setStats] = useState(statKeys.map((s) => ({ ...s })));
  const [currentLog, setCurrentLog] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(16).fill(20));
  const chatRef = useRef<HTMLDivElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  /** 对齐 Guidelines: Streaming Chat — 流式打字效果定时器 */
  const streamingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sidebar hover state
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stat detail panel
  const [selectedStat, setSelectedStat] = useState<typeof stats[0] | null>(null);

  const handleSidebarEnter = () => {
    if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current);
    setSidebarExpanded(true);
  };

  const handleSidebarLeave = () => {
    sidebarTimeoutRef.current = setTimeout(() => {
      setSidebarExpanded(false);
    }, 300);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, [locale]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) =>
        prev.map((s) => ({
          ...s,
          value: Math.max(10, Math.min(99, s.value + (Math.random() - 0.5) * 5)),
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLog((prev) => (prev + 1) % logKeys.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevels(Array(16).fill(0).map(() => 10 + Math.random() * 70));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const ts = new Date().toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour12: false });
    const userMsg = input;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMsg, timestamp: ts },
      { role: "ai", content: "", timestamp: ts }, // SSE 占位：onChunk 将增量写入
    ]);
    setInput("");
    setAiLoading(true);

    // 清理上一次流式输出
    if (streamingRef.current) {
      clearInterval(streamingRef.current);
      streamingRef.current = null;
    }

    const activeModel = getActiveModel();

    // （历史假打字机 streamResponse 已随真 SSE 改造移除）

    if (activeModel) {
      // 构建对话历史（最近 HISTORY_WINDOW 条消息）
      const currentMessages = [...messages, { role: "user" as const, content: userMsg }];
      const historySlice = currentMessages
        .slice(-HISTORY_WINDOW)
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : m.role,
          content: m.content,
        }));

      // 系统提示词
      const systemPrompt = locale === "zh" ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN;

      sendToActiveModelStream(userMsg, {
        systemPrompt,
        history: historySlice.slice(0, -1), // 去掉最后一条（入口会自动追加）
      }, (_d, full) => {
        // 真 SSE：增量写入最后一条 AI 消息（streamResponse 为历史假打字机，已退役）
        setMessages((prev) => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === "ai") { updated[i] = { ...updated[i], content: full }; break; }
          }
          return updated;
        });
      })
        .then(() => { setAiLoading(false); })
        .catch((err: unknown) => {
          setAiLoading(false);
          const detail = err instanceof Error ? err.message : String(err);
          setMessages((prev) => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === "ai") { updated[i] = { ...updated[i], content: `[${t("modelSettings", "modelError")}] ${detail}` }; break; }
            }
            return updated;
          });
        });
    } else {
      // 无活跃模型 — 诚实指引（拒绝伪造 AI 回复）
      setMessages((prev) => [...prev, { role: "ai", content: "未激活模型——请打开 设置 → 模型管理 激活后重试。" }]);
    }
  }, [input, locale, messages, getActiveModel, sendToActiveModelStream, t]);

  // 清理流式输出定时器
  useEffect(() => {
    return () => {
      if (streamingRef.current) clearInterval(streamingRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const SIDEBAR_COLLAPSED = 56;
  const SIDEBAR_EXPANDED = 208;

  return (
    <div className="flex flex-col w-full h-screen" style={{ position: "relative", zIndex: 10 }}>
      {/* Top Navigation Bar */}
      <nav
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: tokens.panelBg,
          borderColor: tokens.border,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative" style={{ width: 28, height: 28, flexShrink: 0 }}>
            <img src={logoImg} alt="YYC³" style={{ width: "100%", height: "100%", objectFit: "contain", filter: isCyberpunk ? `drop-shadow(0 0 6px ${tokens.primary})` : "none" }} />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: tokens.success, boxShadow: isCyberpunk ? `0 0 6px ${tokens.success}` : "none" }} />
          </div>
          {isCyberpunk ? (
            <GlitchText text="YYC&#179;" className="neon-text-cyan" />
          ) : (
            <span style={{ fontFamily: tokens.fontDisplay, fontSize: "16px", color: tokens.primary, fontWeight: 700 }}>YYC&#179;</span>
          )}

        </div>

        <div className="flex items-center gap-1">
          {navTabs.map((tab, i) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === i;
            return (
              <CyberTooltip key={tab.key} label={t("navTabs", tab.key)}>
                <button
                  onClick={() => { setActiveTab(i); setSelectedStat(stats[i]); }}
                  aria-label={t("navTabs", tab.key)}
                  className="relative p-2 rounded transition-all"
                  style={{
                    color: isActive ? tokens.background : tokens.primary,
                    background: isActive ? tokens.primary : "transparent",
                    border: `1px solid ${isActive ? tokens.primary : tokens.border}`,
                    boxShadow: isActive && isCyberpunk ? `0 0 10px ${tokens.primary}55` : "none",
                  }}
                >
                  <TabIcon size={16} />
                </button>
              </CyberTooltip>
            );
          })}
        </div>

        {/* 自媒体创作引擎入口 */}
        <div className="flex items-center gap-1 px-2" style={{ borderLeft: `1px solid ${tokens.borderDim}`, borderRight: `1px solid ${tokens.borderDim}` }}>
          <CyberTooltip label="AI写作助手">
            <button onClick={() => onOpenAIWriting?.()} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: tokens.primary }}>
              <Sparkles size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label="内容模板">
            <button onClick={() => onOpenContentTemplate?.()} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: tokens.primary }}>
              <FileText size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label="素材管理器">
            <button onClick={() => onOpenMaterialManager?.()} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: tokens.primary }}>
              <ImageIcon size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label="多平台发布">
            <button onClick={() => onOpenPublishQueue?.()} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: tokens.primary }}>
              <Send size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label="热点选题">
            <button onClick={() => onOpenTrendingTopics?.()} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: tokens.primary }}>
              <Flame size={14} />
            </button>
          </CyberTooltip>
          <div className="w-px h-4 mx-1" style={{ background: tokens.borderDim }} />
          <CyberTooltip label="智能聊天">
            <button onClick={() => onOpenChat?.()} className="p-1.5 rounded transition-all hover:opacity-80" style={{ color: tokens.accent || tokens.primary }}>
              <MessageCircle size={14} />
            </button>
          </CyberTooltip>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <LangSwitcher />
          {/* Global Search */}
          <CyberTooltip label={t("ide", "search")}>
            <button
              onClick={() => onOpenGlobalSearch?.()}
              aria-label={t("ide", "search")}
              className="p-2 rounded transition-all hover:opacity-80"
              style={{ color: tokens.primary, border: `1px solid ${tokens.cardBorder}`, background: tokens.cardBg }}
            >
              <Search size={14} />
            </button>
          </CyberTooltip>
          {/* Command Palette */}
          <CyberTooltip label="⌘K">
            <button
              onClick={() => onOpenCommandPalette?.()}
              aria-label="Command Palette"
              className="p-2 rounded transition-all hover:opacity-80"
              style={{ color: tokens.primary, border: `1px solid ${tokens.cardBorder}`, background: tokens.cardBg }}
            >
              <Command size={14} />
            </button>
          </CyberTooltip>
          {/* Settings */}
          <CyberTooltip label={t("ide", "settings")}>
            <button
              onClick={() => onOpenSettings?.()}
              aria-label={t("ide", "settings")}
              className="p-2 rounded transition-all hover:opacity-80"
              style={{ color: tokens.primary, border: `1px solid ${tokens.cardBorder}`, background: tokens.cardBg }}
            >
              <Settings size={14} />
            </button>
          </CyberTooltip>
          {/* Notifications */}
          <CyberTooltip label={t("ide", "notifications")}>
            <button
              onClick={() => onOpenNotifications?.()}
              aria-label={t("ide", "notifications")}
              className="p-2 rounded transition-all hover:opacity-80"
              style={{ color: tokens.primary, border: `1px solid ${tokens.cardBorder}`, background: tokens.cardBg }}
            >
              <Bell size={14} />
            </button>
          </CyberTooltip>
          {/* Model indicator button */}
          <CyberTooltip label={t("tooltips", "modelConfig")}>
            <button
              onClick={() => openModelSettings()}
              className="flex items-center gap-1.5 px-3 py-1 rounded transition-all hover:opacity-80"
              style={{
                fontFamily: tokens.fontMono,
                fontSize: "10px",
                color: activeModelId ? tokens.success : tokens.foregroundMuted,
                border: `1px solid ${activeModelId ? tokens.success + "4d" : tokens.border}`,
                background: activeModelId ? tokens.success + "0d" : tokens.cardBg,
              }}
            >
              <Bot size={12} />
              {(() => {
                const am = getActiveModel();
                if (am) {
                  const statusColor = getModelStatusColor();
                  const cs = connectivityMap[am.id];
                  return (
                    <>
                      <span>{am.name.length > 12 ? am.name.slice(0, 12) + "…" : am.name}</span>
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: statusColor,
                          boxShadow: (statusColor === tokens.success) && isCyberpunk ? `0 0 6px ${tokens.success}` : "none",
                          animation: cs?.status === "checking" ? "pulse 1.5s infinite" : "none",
                        }}
                      />
                    </>
                  );
                }
                return <span>OFF</span>;
              })()}
            </button>
          </CyberTooltip>
          <button
            onClick={onSwitchMode}
            className="relative group p-2 rounded transition-all hover:opacity-80"
            style={{
              color: tokens.primary,
              border: `1px solid ${tokens.cardBorder}`,
              background: tokens.cardBg,
            }}
          >
            <AppWindow size={14} />
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none"
              style={{
                fontFamily: tokens.fontMono,
                fontSize: "10px",
                color: tokens.primary,
                background: tokens.panelBg,
                border: `1px solid ${tokens.border}`,
                boxShadow: tokens.shadow,
                zIndex: 50,
              }}
            >
              {t("mode", "widgetMode")}
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-1"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderBottom: `4px solid ${tokens.border}`,
                }}
              />
            </div>
          </button>
          {/* IDE Mode button */}
          <CyberTooltip label={t("ide", "ideMode")}>
            <button
              onClick={onSwitchToIDE}
              aria-label={t("ide", "ideMode")}
              className="p-2 rounded transition-all hover:opacity-80"
              style={{
                color: tokens.primary,
                border: `1px solid ${tokens.cardBorder}`,
                background: tokens.cardBg,
              }}
            >
              <Code2 size={14} />
            </button>
          </CyberTooltip>
          {/* Connection status indicator - dynamic based on actual connectivity */}
          <CyberTooltip label={t("tooltips", "connStatus")}>
            <div className="flex items-center gap-2">
              {(() => {
                const connColor = getModelStatusColor();
                return (
                  <>
                    <Wifi size={14} color={connColor} style={{ filter: isCyberpunk ? `drop-shadow(0 0 4px ${connColor})` : "none" }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: connColor, boxShadow: (connColor === tokens.success) && isCyberpunk ? `0 0 6px ${tokens.success}` : "none" }} />
                  </>
                );
              })()}
            </div>
          </CyberTooltip>
          {/* 🎵 Mini Audio Player - 音乐播放器入口 */}
          <div style={{ width: 1, height: 16, background: tokens.border, margin: '0 4px' }} />
          <MiniAudioPlayer />
          <span style={{ fontFamily: tokens.fontMono, fontSize: "12px", color: tokens.primary }}>{currentTime}</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== Retractable Sidebar ===== */}
        <aside
          className="relative border-r flex flex-col py-3 shrink-0 overflow-hidden"
          style={{
            width: sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
            transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            background: tokens.panelBg,
            borderColor: sidebarExpanded ? tokens.border : tokens.borderDim,
          }}
          onMouseEnter={handleSidebarEnter}
          onMouseLeave={handleSidebarLeave}
        >
          {/* Sensor line on the right edge */}
          <div className={`sidebar-sensor-line ${sidebarExpanded ? "active" : ""}`} />

          {/* Module title */}
          <div
            className="px-3 mb-4 overflow-hidden whitespace-nowrap"
            style={{
              opacity: sidebarExpanded ? 1 : 0,
              transition: "opacity 0.25s ease",
              transitionDelay: sidebarExpanded ? "0.15s" : "0s",
            }}
          >
            <div style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, letterSpacing: "2px", opacity: 0.6 }}>
              {t("sidebar", "modulesTitle")}
            </div>
          </div>

          {/* Collapsed: show tiny dots indicator */}
          {!sidebarExpanded && (
            <div className="px-3 mb-4 flex justify-center">
              <div className="flex flex-col gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full"
                    style={{
                      background: tokens.primary,
                      opacity: 1 - i * 0.25,
                      boxShadow: isCyberpunk ? `0 0 3px ${tokens.primary}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {sidebarKeys.map((item, i) => (
            <div key={item.key} className="relative group/sb">
              <button
                onClick={() => {
                  const sidebarActionMap: Record<string, () => void> = {
                    neuralCore: () => { setActiveTab(0); cyberToast(t("notify", "neuralCore")); },
                    dataMatrix: () => { setActiveTab(1); cyberToast(t("notify", "dataMatrix")); },
                    netScanner: () => { setActiveTab(2); cyberToast(t("notify", "netScanner")); },
                    iceBreaker: () => { setActiveTab(3); cyberToast(t("notify", "iceBreaker")); },
                    cliAccess: () => { cyberToast(t("notify", "cliAccess")); setTimeout(onSwitchToIDE, 600); },
                    config: () => { onOpenSettings?.(); },
                  };
                  sidebarActionMap[item.key]?.();
                }}
                className="flex items-center gap-3 py-2.5 mx-2 rounded transition-all hover:bg-white/5 text-left overflow-hidden w-[calc(100%-16px)]"
                style={{
                  paddingLeft: sidebarExpanded ? "12px" : "14px",
                  paddingRight: sidebarExpanded ? "12px" : "14px",
                }}
              >
                <item.icon
                  size={sidebarExpanded ? 16 : 18}
                  color={tokens.primary}
                  style={{
                    filter: isCyberpunk ? `drop-shadow(0 0 ${activeTab === i ? "6px" : "4px"} ${tokens.primary})` : "none",
                    flexShrink: 0,
                    transition: "all 0.25s ease",
                  }}
                />
                <span
                  style={{
                    fontFamily: tokens.fontBody,
                    fontSize: "13px",
                    color: tokens.primary,
                    opacity: sidebarExpanded ? 0.9 : 0,
                    width: sidebarExpanded ? "auto" : 0,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "opacity 0.2s ease, width 0.3s ease",
                    transitionDelay: sidebarExpanded ? "0.1s" : "0s",
                  }}
                >
                  {t("sidebar", item.key)}
                </span>
              </button>
              {/* Cyberpunk tooltip — only when collapsed */}
              {!sidebarExpanded && (
                <div
                  className="absolute top-1/2 left-full ml-2 -translate-y-1/2 px-2.5 py-1 rounded whitespace-nowrap opacity-0 group-hover/sb:opacity-100 transition-all duration-200 pointer-events-none"
                  style={{
                    fontFamily: tokens.fontMono,
                    fontSize: "10px",
                    letterSpacing: "0.5px",
                    color: tokens.primary,
                    background: tokens.panelBg,
                    border: `1px solid ${tokens.border}`,
                    boxShadow: tokens.shadow,
                    zIndex: 9999,
                  }}
                >
                  {t("sidebar", item.key)}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -left-1"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "4px solid transparent",
                      borderBottom: "4px solid transparent",
                      borderRight: `4px solid ${tokens.border}`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Mini visualizer */}
          <div className="mt-auto px-3">
            <div
              style={{
                fontFamily: tokens.fontMono,
                fontSize: "9px",
                color: tokens.primary,
                opacity: sidebarExpanded ? 0.5 : 0,
                marginBottom: "8px",
                transition: "opacity 0.2s ease",
                transitionDelay: sidebarExpanded ? "0.15s" : "0s",
                whiteSpace: "nowrap",
              }}
            >
              {t("sidebar", "audioSignal")}
            </div>
            <div className="flex items-end gap-0.5 h-10" style={{ justifyContent: sidebarExpanded ? "flex-start" : "center" }}>
              {audioLevels.slice(0, sidebarExpanded ? 16 : 6).map((level, i) => (
                <div
                  key={i}
                  className="rounded-sm transition-all duration-150"
                  style={{
                    height: `${level}%`,
                    width: sidebarExpanded ? undefined : "3px",
                    flex: sidebarExpanded ? 1 : undefined,
                    background: tokens.primary,
                    opacity: 0.3 + (level / 100) * 0.5,
                    boxShadow: isCyberpunk ? `0 0 3px ${tokens.primary}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
          {/* Top Stats Row - Clickable */}
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.key}
                className="stat-card-interactive group"
                onClick={() => setSelectedStat(stat)}
              >
                <HoloCard glowColor="cyan">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, letterSpacing: "1px" }}>
                      {t("stats", stat.key)}
                    </span>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight size={10} color={tokens.primary} style={{ opacity: 0.3 }} />
                      <Activity size={12} color={tokens.primary} />
                    </div>
                  </div>
                  <div style={{ fontFamily: tokens.fontDisplay, fontSize: "22px", color: tokens.primary, textShadow: isCyberpunk ? `0 0 10px ${tokens.primary}` : "none" }}>
                    {stat.value.toFixed(1)}%
                  </div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: tokens.primaryGlow }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${stat.value}%`,
                        background: tokens.primary,
                        boxShadow: isCyberpunk ? `0 0 8px ${tokens.primary}` : "none",
                      }}
                    />
                  </div>
                  <div className="mt-1.5 overflow-hidden transition-all duration-200" style={{ maxHeight: "0px", opacity: 0 }}>
                    <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.foregroundMuted }}>
                      {t("dashboard", "clickToExplore")}
                    </span>
                  </div>
                  <style>{`
                    .stat-card-interactive:hover .holo-card {
                      box-shadow: ${isCyberpunk ? `0 0 15px ${tokens.primary}2e, inset 0 0 15px ${tokens.primary}08` : tokens.shadowHover} !important;
                    }
                  `}</style>
                </HoloCard>
              </div>
            ))}
          </div>

          {/* Hint bar */}
          <div className="flex items-center justify-center">
            <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted, letterSpacing: "3px" }}>
              {t("dashboard", "clickToExplore")}
            </span>
          </div>

          {/* Main Chat + Info Area */}
          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              <HoloCard className="flex-1 flex flex-col !p-0 overflow-hidden" glowColor="cyan">
                <div
                  className="flex items-center gap-2 px-4 py-2 border-b"
                  style={{ borderColor: tokens.border }}
                >
                  <CyberTooltip label={t("tooltips", "neuralInterface")} position="right">
                    <MessageSquare size={14} color={tokens.primary} />
                  </CyberTooltip>
                  <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary }}>
                    {t("chat", "interfaceTitle")}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.success, boxShadow: isCyberpunk ? `0 0 4px ${tokens.success}` : "none" }} />
                    <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.success }}>{t("common", "active")}</span>
                  </div>
                </div>

                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 neon-scrollbar">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[80%] rounded-lg px-3 py-2"
                        style={{
                          background: msg.role === "ai" ? tokens.primaryGlow : tokens.cardBg,
                          border: `1px solid ${msg.role === "ai" ? tokens.cardBorder : tokens.borderDim}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            style={{
                              fontFamily: tokens.fontMono,
                              fontSize: "9px",
                              color: msg.role === "ai" ? tokens.primary : tokens.primaryDim,
                            }}
                          >
                            {msg.role === "ai" ? t("common", "aiLabel") : t("common", "operatorLabel")}
                          </span>
                          <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>
                            {msg.timestamp}
                          </span>
                        </div>
                        <AIMessageRenderer content={msg.content} />
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div
                        className="max-w-[80%] rounded-lg px-3 py-2"
                        style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.cardBorder}` }}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary }}>
                            {t("common", "aiLabel")}
                          </span>
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map((j) => (
                              <div
                                key={j}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background: tokens.primary,
                                  animation: `neon-pulse 1s ${j * 0.2}s ease-in-out infinite`,
                                  boxShadow: isCyberpunk ? `0 0 4px ${tokens.primary}` : "none",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontFamily: tokens.fontBody, fontSize: "12px", color: tokens.primaryDim, marginTop: "4px" }}>
                          {t("modelSettings", "aiThinking")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t" style={{ borderColor: tokens.border }}>
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} color={tokens.primary} />
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder={t("common", "enterCommand")}
                      className="flex-1 bg-transparent outline-none"
                      style={{
                        fontFamily: tokens.fontMono,
                        fontSize: "12px",
                        color: tokens.primary,
                        caretColor: tokens.primary,
                      }}
                    />
                    <CyberTooltip label={t("tooltips", "send")} position="top">
                      <button
                        onClick={handleSend}
                        aria-label={t("tooltips", "send")}
                        className="p-1.5 rounded transition-all hover:opacity-80"
                        style={{ border: `1px solid ${tokens.border}` }}
                      >
                        <Send size={14} color={tokens.primary} />
                      </button>
                    </CyberTooltip>
                  </div>
                </div>
              </HoloCard>
            </div>

            {/* Right Info Panel */}
            <div className="w-72 flex flex-col gap-3 shrink-0">
              {/* System Info */}
              <HoloCard glowColor="cyan" className="shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <CyberTooltip label={t("tooltips", "systemInfo")} position="right">
                    <Server size={14} color={tokens.primary} />
                  </CyberTooltip>
                  <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary }}>{t("systemStatus", "title")}</span>
                </div>
                {systemInfoKeys.map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon size={12} color={tokens.primary} />
                      <span style={{ fontFamily: tokens.fontBody, fontSize: "12px", color: tokens.foregroundMuted }}>{t("systemStatus", item.key)}</span>
                    </div>
                    <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary }}>{item.value}</span>
                  </div>
                ))}
              </HoloCard>

              {/* Active Processes */}
              <HoloCard glowColor="cyan" className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <CyberTooltip label={t("tooltips", "activeProcesses")} position="right">
                    <Code2 size={14} color={tokens.primary} />
                  </CyberTooltip>
                  <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary }}>{t("processes", "title")}</span>
                </div>
                <div className="flex-1 overflow-y-auto neon-scrollbar space-y-2">
                  {[
                    { name: "neural_opt.exe", cpu: "23%", status: "run" },
                    { name: "ice_defense.sys", cpu: "15%", status: "run" },
                    { name: "data_mining.dll", cpu: "42%", status: "run" },
                    { name: "quantum_sync.bin", cpu: "8%", status: "idle" },
                    { name: "net_scan.exe", cpu: "31%", status: "run" },
                    { name: "encrypt_hub.sys", cpu: "12%", status: "run" },
                  ].map((proc) => (
                    <div
                      key={proc.name}
                      className="flex items-center justify-between py-1 px-2 rounded"
                      style={{ background: tokens.primaryGlow }}
                    >
                      <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foreground }}>{proc.name}</span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary }}>{proc.cpu}</span>
                        <span
                          style={{
                            fontFamily: tokens.fontMono,
                            fontSize: "9px",
                            color: proc.status === "run" ? tokens.success : tokens.foregroundMuted,
                          }}
                        >
                          {t("common", proc.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </HoloCard>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer
        className="flex items-center justify-between px-4 py-1.5 border-t"
        style={{
          background: tokens.panelBg,
          borderColor: tokens.border,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-4">
          <CyberTooltip label={t("tooltips", "sysMonitor")} position="top">
            <div className="flex items-center gap-1.5">
              {(() => {
                const sysColor = getModelStatusColor();
                return (
                  <>
                    <Radio size={10} color={sysColor} style={{ filter: isCyberpunk ? `drop-shadow(0 0 3px ${sysColor})` : "none" }} />
                    <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: sysColor }}>{t("footer", "sysNominal")}</span>
                  </>
                );
              })()}
            </div>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "threatMonitor")} position="top">
            <div className="flex items-center gap-1.5">
              <Eye size={10} color={tokens.primary} />
              <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary }}>{t("footer", "threatLevel")}</span>
            </div>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "netBandwidth")} position="top">
            <div className="flex items-center gap-1.5">
              <BarChart3 size={10} color={tokens.primary} />
              <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary }}>{t("footer", "netSpeed")}</span>
            </div>
          </CyberTooltip>
          {/* Model status indicator */}
          {(() => {
            const am = getActiveModel();
            if (!am) return null;
            const statusColor = getModelStatusColor();
            const cs = connectivityMap[am.id];
            return (
              <CyberTooltip label={t("tooltips", "modelStatus")} position="top">
                <div className="flex items-center gap-1.5">
                  <Bot size={10} color={statusColor} style={{ filter: isCyberpunk ? `drop-shadow(0 0 3px ${statusColor})` : "none" }} />
                  <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: statusColor }}>
                    {t("modelSettings", "modelIndicator")}: {am.name.length > 10 ? am.name.slice(0, 10) + "…" : am.name}
                    {cs?.latencyMs ? ` · ${cs.latencyMs}ms` : ""}
                  </span>
                </div>
              </CyberTooltip>
            );
          })()}
        </div>

        <div className="flex-1 mx-6 overflow-hidden">
          <div
            style={{
              fontFamily: tokens.fontMono,
              fontSize: "10px",
              color: tokens.primary,
              opacity: 0.6,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: tokens.primary, opacity: 0.5 }}>&gt;</span> {t("logs", logKeys[currentLog])}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>
            YYC&#179; v4.8.0 | BUILD 20260313
          </span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-3 rounded-sm"
                style={{
                  background: i < 4 ? tokens.primary : tokens.borderDim,
                  boxShadow: i < 4 && isCyberpunk ? `0 0 3px ${tokens.primary}` : "none",
                }}
              />
            ))}
          </div>
        </div>
      </footer>

      {/* ===== Stat Detail Panel Overlay ===== */}
      {selectedStat && (
        <StatDetailPanel
          stat={selectedStat}
          onClose={() => setSelectedStat(null)}
        />
      )}
    </div>
  );
}
