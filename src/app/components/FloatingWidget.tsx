/**
 * @file FloatingWidget.tsx
 * @description 浮动组件，提供浮动窗口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags widget,floating,ui,component
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  GripHorizontal, Minus, Maximize2, Minimize2, X,
  ChevronRight, Send, Activity, Wifi,
} from "lucide-react";
import { GlitchText } from "./GlitchText";
import { LangSwitcher } from "./LangSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { CyberTooltip } from "./CyberTooltip";
import { useI18n } from "../i18n/context";
import { useModelStore } from "../store/model-store";
import { useThemeStore } from "../store/theme-store";
import logoImg from "/yyc3-icons/macOS/16.png";
import type { ChatMessage } from "../types";

// Font/color constants removed — use tokens from useThemeStore() instead


export function FloatingWidget({ onSwitchMode }: { onSwitchMode: () => void }) {
  const { t } = useI18n();
  const { getActiveModel, sendToActiveModelStream } = useModelStore();
  const { tokens, isCyberpunk } = useThemeStore();
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ w: 420, h: 520 });
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "ai", content: t("chat", "widgetInitMessage") }
  ]);
  const [input, setInput] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(12).fill(20));
  const chatRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);
  const prevSize = useRef(size);
  const prevPos = useRef(pos);

  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevels(Array(12).fill(0).map(() => 10 + Math.random() * 70));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragRef.current) {
      setPos({ x: dragRef.current.posX + e.clientX - dragRef.current.startX, y: dragRef.current.posY + e.clientY - dragRef.current.startY });
    }
    if (resizeRef.current) {
      setSize({ w: Math.max(320, resizeRef.current.w + e.clientX - resizeRef.current.startX), h: Math.max(300, resizeRef.current.h + e.clientY - resizeRef.current.startY) });
    }
  }, []);

  const handleMouseUp = useCallback(() => { dragRef.current = null; resizeRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [handleMouseMove, handleMouseUp]);

  const startDrag = (e: React.MouseEvent) => { if (!maximized) dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y }; };
  const startResize = (e: React.MouseEvent) => { e.stopPropagation(); if (!maximized) resizeRef.current = { startX: e.clientX, startY: e.clientY, w: size.w, h: size.h }; };

  const toggleMaximize = () => {
    if (maximized) { setSize(prevSize.current); setPos(prevPos.current); }
    else { prevSize.current = size; prevPos.current = pos; setPos({ x: 20, y: 20 }); setSize({ w: window.innerWidth - 40, h: window.innerHeight - 40 }); }
    setMaximized(!maximized);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev,
      { role: "user", content: userMsg },
      { role: "ai", content: "" }, // SSE 占位
    ]);
    setInput("");
    const activeModel = getActiveModel();
    if (activeModel) {
      sendToActiveModelStream(userMsg, undefined, (_d, full) => {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
            updated[lastIdx] = { ...updated[lastIdx], content: full };
          }
          return updated;
        });
      })
        .catch((err: unknown) => {
          const detail = err instanceof Error ? err.message : String(err);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === "ai") {
              updated[lastIdx] = { ...updated[lastIdx], content: `[错误] ${detail}` };
            }
            return updated;
          });
        });
    } else {
      setMessages((prev) => [...prev.slice(0, -1), { role: "ai", content: "未激活模型——请先在设置中激活。" }]);
    }
  };

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  if (minimized) {
    return (
      <div className="fixed z-50 cursor-pointer" style={{ left: pos.x, top: pos.y }} onClick={() => setMinimized(false)}>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: tokens.panelBg, border: `1px solid ${tokens.cardBorder}`, boxShadow: tokens.shadow, backdropFilter: "blur(10px)" }}
        >
          <img src={logoImg} alt="YYC³" style={{ width: 20, height: 20, objectFit: "contain", filter: isCyberpunk ? `drop-shadow(0 0 6px ${tokens.primary})` : "none" }} />
          {isCyberpunk ? (
            <span style={{ fontFamily: tokens.fontDisplay, fontSize: "11px", color: tokens.primary }}>YYC&sup3;</span>
          ) : (
            <span style={{ fontFamily: tokens.fontDisplay, fontSize: "11px", color: tokens.primary, fontWeight: 700 }}>YYC&#179;</span>
          )}
          <div className="flex items-end gap-0.5 h-4 ml-1">
            {audioLevels.slice(0, 6).map((l, i) => (
              <div key={i} className="w-1 rounded-sm transition-all duration-150" style={{ height: `${l}%`, background: tokens.primary, opacity: 0.3 + (l / 100) * 0.5 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-50" style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}>
      <div
        className="w-full h-full rounded-lg overflow-hidden flex flex-col"
        style={{ background: tokens.panelBg, border: `1px solid ${tokens.cardBorder}`, boxShadow: tokens.shadowHover, backdropFilter: "blur(15px)" }}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-3 py-2 cursor-move select-none border-b" style={{ borderColor: tokens.border }} onMouseDown={startDrag}>
          <div className="flex items-center gap-2">
            <GripHorizontal size={14} color={tokens.foregroundMuted} />
            <img src={logoImg} alt="YYC³" style={{ width: 20, height: 20, objectFit: "contain", filter: isCyberpunk ? `drop-shadow(0 0 6px ${tokens.primary})` : "none" }} />
            {isCyberpunk ? (
              <GlitchText text="YYC&#179; AI" className="neon-text-cyan" />
            ) : (
              <span style={{ fontFamily: tokens.fontDisplay, fontSize: "13px", color: tokens.primary, fontWeight: 700 }}>YYC&#179; AI</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <LangSwitcher compact />
            <CyberTooltip label={t("tooltips", "fullscreenMode")} position="bottom">
              <button onClick={onSwitchMode} className="px-2 py-0.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary, border: `1px solid ${tokens.border}` }}>
                {t("mode", "fullMode")}
              </button>
            </CyberTooltip>
            <CyberTooltip label={t("tooltips", "minimize")} position="bottom">
              <button onClick={() => setMinimized(true)} className="p-1 rounded hover:opacity-80 transition-all"><Minus size={12} color={tokens.primary} /></button>
            </CyberTooltip>
            <CyberTooltip label={maximized ? t("tooltips", "restore") : t("tooltips", "maximize")} position="bottom">
              <button onClick={toggleMaximize} className="p-1 rounded hover:opacity-80 transition-all">
                {maximized ? <Minimize2 size={12} color={tokens.primary} /> : <Maximize2 size={12} color={tokens.primary} />}
              </button>
            </CyberTooltip>
            <CyberTooltip label={t("tooltips", "close")} position="bottom">
              <button onClick={() => setMinimized(true)} className="p-1 rounded hover:opacity-80 transition-all"><X size={12} color={tokens.primary} /></button>
            </CyberTooltip>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 border-b" style={{ borderColor: tokens.borderDim }}>
          <div className="flex items-center gap-3">
            <CyberTooltip label={t("tooltips", "connStatus")} position="bottom">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.success, boxShadow: isCyberpunk ? `0 0 4px ${tokens.success}` : "none" }} />
                <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.success }}>{t("common", "online")}</span>
              </div>
            </CyberTooltip>
            <CyberTooltip label={t("tooltips", "cpuUsage")} position="bottom">
              <div className="flex items-center gap-1">
                <Activity size={10} color={tokens.primary} />
                <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary }}>CPU: 23%</span>
              </div>
            </CyberTooltip>
            <CyberTooltip label={t("tooltips", "netStatus")} position="bottom">
              <div className="flex items-center gap-1">
                <Wifi size={10} color={tokens.primary} />
                <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary }}>847 TB/s</span>
              </div>
            </CyberTooltip>
          </div>
          <div className="flex items-end gap-0.5 h-3">
            {audioLevels.map((l, i) => (
              <div key={i} className="w-0.5 rounded-sm transition-all duration-150" style={{ height: `${l}%`, background: tokens.primary, opacity: 0.3 + (l / 100) * 0.5 }} />
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 neon-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] rounded-lg px-3 py-2"
                style={{
                  background: msg.role === "ai" ? tokens.primaryGlow : tokens.cardBg,
                  border: `1px solid ${msg.role === "ai" ? tokens.cardBorder : tokens.borderDim}`,
                }}
              >
                <div className="mb-0.5">
                  <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: msg.role === "ai" ? tokens.primary : tokens.primaryDim }}>
                    {msg.role === "ai" ? t("common", "aiLabel") : t("common", "youLabel")}
                  </span>
                </div>
                <p style={{ fontFamily: tokens.fontBody, fontSize: "12px", color: tokens.foreground, lineHeight: "1.4" }}>{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="px-3 py-2 border-t" style={{ borderColor: tokens.border }}>
          <div className="flex items-center gap-2">
            <ChevronRight size={12} color={tokens.primary} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("common", "enterCommand")}
              className="flex-1 bg-transparent outline-none"
              style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary, caretColor: tokens.primary }}
            />
            <CyberTooltip label={t("tooltips", "send")} position="top">
              <button onClick={handleSend} className="p-1 rounded transition-all hover:opacity-80" style={{ border: `1px solid ${tokens.border}` }}>
                <Send size={12} color={tokens.primary} />
              </button>
            </CyberTooltip>
          </div>
        </div>

        {/* Resize Handle */}
        {!maximized && (
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={startResize} style={{ zIndex: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M14 14L14 8M14 14L8 14" stroke={tokens.primary} strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
              <path d="M14 14L14 11M14 14L11 14" stroke={tokens.primary} strokeWidth="1.5" strokeOpacity="0.6" fill="none" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
