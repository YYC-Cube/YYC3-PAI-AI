/**
 * @file IDEHeader.tsx
 * @description YYC3 IDE 顶部导航栏 + 第二工具栏 — 从 IDEMode.tsx 提取
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @tags component,header,ide,ui
 */

import {
    Activity, AlertTriangle,
    Bell,
    Bot,
    ChevronLeft,
    Clock,
    Code2,
    Command,
    Database,
    Eye,
    FileCode,
    FileText,
    FolderOpen,
    GitBranch,
    Github,
    Layers,
    LayoutGrid,
    Maximize,
    Minimize2,
    MoreHorizontal,
    Plus,
    Puzzle,
    Rocket,
    Scissors,
    Search,
    Settings,
    Share2,
    Shield,
    Sparkles,
    Terminal as TerminalIcon,
    User,
    Users,
} from "lucide-react";
import { useI18n } from "../i18n/context";
import { useThemeStore } from "../store/theme-store";
import { MiniAudioPlayer } from "./audio/MiniAudioPlayer";
import { cyberToast } from "./CyberToast";
import { CyberTooltip } from "./CyberTooltip";
import { GlitchText } from "./GlitchText";
import { LangSwitcher } from "./LangSwitcher";
import { ThemeSwitcher } from "./ThemeSwitcher";
import logoImg from "/yyc3-icons/macOS/32.png";

import type { OverlayPanelsAPI } from "./ide/useOverlayPanels";

export interface IDEHeaderProps {
  /** 视图模式 */
  viewMode: "edit" | "preview";
  setViewMode: (m: "edit" | "preview") => void;
  /** 全屏预览状态 */
  fullscreenPreview: boolean;
  setFullscreenPreview: (v: boolean) => void;
  /** 终端状态 */
  terminalVisible: boolean;
  setTerminalVisible: (v: boolean) => void;
  setTerminalExpanded: (v: boolean) => void;
  /** 面板开关回调 */
  openModelSettings: () => void;
  /** Consolidated overlay panel API */
  overlayPanels: OverlayPanelsAPI;
  /** 外部回调 */
  onSwitchMode?: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenAudioPanel?: () => void;
  /** Store actions */
  projectStoreOpenModal: () => void;
  dbStoreOpenPanel: () => void;
  pluginStoreOpenPanel: () => void;
  cryptoStoreOpenPanel: () => void;
}

export function IDEHeader({
  viewMode, setViewMode,
  fullscreenPreview, setFullscreenPreview,
  terminalVisible, setTerminalVisible, setTerminalExpanded,
  openModelSettings, overlayPanels,
  onSwitchMode, onOpenSettings, onOpenNotifications, onOpenCommandPalette, onOpenGlobalSearch, onOpenAudioPanel,
  projectStoreOpenModal, dbStoreOpenPanel, pluginStoreOpenPanel, cryptoStoreOpenPanel,
}: IDEHeaderProps) {
  const { t } = useI18n();
  const { tokens, isCyberpunk } = useThemeStore();
  const panelBg = tokens.panelBg;
  const borderColor = tokens.border;
  const { show } = overlayPanels;

  return (
    <>
      {/* ========== TOP NAV BAR ========== */}
      <nav
        className="flex items-center justify-between px-4 py-1.5 border-b shrink-0"
        style={{ background: panelBg, borderColor, backdropFilter: "blur(10px)" }}
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative" style={{ width: 26, height: 26, flexShrink: 0 }}>
            <img src={logoImg} alt="YYC³" style={{ width: "100%", height: "100%", objectFit: "contain", filter: isCyberpunk ? `drop-shadow(0 0 6px ${tokens.primary})` : "none" }} />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: tokens.success, boxShadow: isCyberpunk ? `0 0 4px ${tokens.success}` : "none" }} />
          </div>
          {isCyberpunk ? (
            <GlitchText text="YYC&#179;" className="neon-text-cyan" />
          ) : (
            <span style={{ fontFamily: tokens.fontDisplay, fontSize: "14px", color: tokens.primary, fontWeight: 700 }}>YYC&#179;</span>
          )}
          <span style={{ fontFamily: tokens.fontMono, color: tokens.primary, opacity: 0.5, fontSize: "10px" }}>
            {t("ide", "projectTitle")}
          </span>
        </div>

        {/* Right: action icons */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LangSwitcher />
          {[
            { icon: FolderOpen, label: t("ide", "projectMgr"), action: projectStoreOpenModal },
            { icon: Settings, label: t("ide", "settings"), action: () => onOpenSettings?.() },
            { icon: Github, label: t("ide", "github"), action: () => show("gitPanel") },
            { icon: Share2, label: t("ide", "share"), action: () => cyberToast(t("notify", "shareLink")) },
            { icon: Rocket, label: t("ide", "deploy"), action: () => cyberToast(t("notify", "deployStarted")) },
            { icon: Bell, label: t("ide", "notifications"), action: () => onOpenNotifications?.() },
          ].map((item, i) => (
            <CyberTooltip key={i} label={item.label}>
              <button onClick={item.action} aria-label={item.label} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: "none", background: "transparent" }}>
                <item.icon size={14} />
              </button>
            </CyberTooltip>
          ))}
          {/* Mini Audio Player */}
          <div style={{ width: 1, height: 16, background: tokens.border, margin: '0 4px' }} />
          <MiniAudioPlayer onOpenFullPlayer={onOpenAudioPanel} />
          {/* User avatar */}
          <CyberTooltip label={t("ide", "userProfile")}>
            <button onClick={() => cyberToast(t("notify", "profileOpened"))} aria-label={t("ide", "userProfile")} className="flex items-center gap-1.5 ml-1 p-1 rounded transition-all hover:opacity-80">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.cardBorder}` }}>
                <User size={12} color={tokens.primary} />
              </div>
            </button>
          </CyberTooltip>
        </div>
      </nav>

      {/* ========== SECOND TOOLBAR ========== */}
      <div
        className="flex items-center justify-between px-3 py-1 border-b shrink-0"
        style={{ background: panelBg, borderColor, backdropFilter: "blur(10px)" }}
      >
        {/* Left group: AI/Tools/Config */}
        <div className="flex items-center gap-1">
          {[
            { icon: Bot, label: t("ide", "aiModel"), action: openModelSettings },
            { icon: Sparkles, label: t("ide", "aiAssist"), action: () => show("aiAssist") },
            { icon: FileCode, label: t("ide", "codeGen"), action: () => show("codeGen") },
            { icon: Users, label: t("ide", "collab"), action: () => show("collabPanel") },
            { icon: GitBranch, label: t("panels", "git"), action: () => show("gitPanel") },
            { icon: Activity, label: t("panels", "performance"), action: () => show("perfDash") },
            { icon: AlertTriangle, label: t("panels", "diagnostics"), action: () => show("diagPanel") },
            { icon: LayoutGrid, label: t("panels", "taskBoard"), action: () => show("taskBoard") },
            { icon: Scissors, label: t("panels", "snippets"), action: () => show("snippetMgr") },
            { icon: Clock, label: t("panels", "activityLog"), action: () => show("activityLog") },
            { icon: Plus, label: t("ide", "newProject"), action: projectStoreOpenModal },
            { icon: Command, label: "⌘K", action: () => onOpenCommandPalette?.() },
          ].map((item, i) => (
            <CyberTooltip key={i} label={item.label}>
              <button onClick={item.action} aria-label={item.label} className="p-1.5 rounded transition-all hover:bg-white/5" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
                <item.icon size={14} />
              </button>
            </CyberTooltip>
          ))}
        </div>

        {/* Center: View switchers */}
        <div className="flex items-center gap-1">
          <CyberTooltip label={t("ide", "goBack")}>
            <button onClick={onSwitchMode} aria-label={t("ide", "goBack")} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <ChevronLeft size={14} />
            </button>
          </CyberTooltip>

          <CyberTooltip label={t("ide", "fullscreen")}>
            <button
              onClick={() => {
                setFullscreenPreview(!fullscreenPreview);
                if (!fullscreenPreview) cyberToast(t("notify", "fullscreenEntered"));
              }}
              aria-label={t("ide", "fullscreen")}
              className="p-1.5 rounded transition-all"
              style={{
                color: fullscreenPreview ? tokens.background : tokens.primary,
                background: fullscreenPreview ? tokens.primary : "transparent",
                border: `1px solid ${fullscreenPreview ? tokens.primary : tokens.border}`,
                boxShadow: fullscreenPreview && isCyberpunk ? `0 0 8px ${tokens.primary}44` : "none",
              }}
            >
              {fullscreenPreview ? <Minimize2 size={14} /> : <Maximize size={14} />}
            </button>
          </CyberTooltip>

          {[
            { icon: Eye, label: t("ide", "preview"), mode: "preview" as const },
            { icon: Code2, label: t("ide", "codeView"), mode: "edit" as const },
          ].map((item) => {
            const isActive = viewMode === item.mode;
            return (
              <CyberTooltip key={item.mode} label={item.label}>
                <button
                  onClick={() => setViewMode(item.mode)}
                  aria-label={item.label}
                  className="p-1.5 rounded transition-all"
                  style={{
                    color: isActive ? tokens.background : tokens.primary,
                    background: isActive ? tokens.primary : "transparent",
                    border: `1px solid ${isActive ? tokens.primary : tokens.border}`,
                    boxShadow: isActive && isCyberpunk ? `0 0 8px ${tokens.primary}44` : "none",
                  }}
                >
                  <item.icon size={14} />
                </button>
              </CyberTooltip>
            );
          })}

          <div style={{ width: 1, height: 18, background: tokens.border, margin: "0 4px" }} />

          <CyberTooltip label={t("ide", "search")}>
            <button onClick={() => onOpenGlobalSearch?.()} aria-label={t("ide", "search")} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <Search size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("panels", "database")}>
            <button onClick={dbStoreOpenPanel} aria-label={t("panels", "database")} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <Database size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("panels", "plugins")}>
            <button onClick={pluginStoreOpenPanel} aria-label={t("panels", "plugins")} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <Puzzle size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("panels", "security")}>
            <button onClick={cryptoStoreOpenPanel} aria-label={t("panels", "security")} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <Shield size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("ide", "more")}>
            <button onClick={() => onOpenCommandPalette?.()} aria-label={t("ide", "more")} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <MoreHorizontal size={14} />
            </button>
          </CyberTooltip>
        </div>

        {/* Right group: File/Terminal/Notes */}
        <div className="flex items-center gap-1">
          <CyberTooltip label={t("ide", "fileManager")}>
            <button
              onClick={() => { if (viewMode !== "edit") setViewMode("edit"); cyberToast(t("notify", "fileManagerOpened")); }}
              aria-label={t("ide", "fileManager")}
              className="p-1.5 rounded transition-all"
              style={{
                color: viewMode === "edit" ? tokens.background : tokens.primary,
                background: viewMode === "edit" ? tokens.primary : "transparent",
                border: `1px solid ${viewMode === "edit" ? tokens.primary : tokens.border}`,
              }}
            >
              <FolderOpen size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("ide", "terminal")}>
            <button
              onClick={() => {
                if (!terminalVisible) { setTerminalVisible(true); setTerminalExpanded(false); } else { setTerminalVisible(false); }
              }}
              aria-label={t("ide", "terminal")}
              className="p-1.5 rounded transition-all"
              style={{
                color: terminalVisible ? tokens.background : tokens.primary,
                background: terminalVisible ? tokens.primary : "transparent",
                border: `1px solid ${terminalVisible ? tokens.primary : tokens.border}`,
              }}
            >
              <TerminalIcon size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("ide", "notes")}>
            <button onClick={() => show("activityLog")} aria-label={t("ide", "notes")} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <FileText size={14} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("panels", "multiInstance") || "Multi-Instance"}>
            <button onClick={() => show("multiInstance")} aria-label={t("panels", "multiInstance") || "Multi-Instance"} className="p-1.5 rounded transition-all" style={{ color: tokens.primary, border: `1px solid ${tokens.border}` }}>
              <Layers size={14} />
            </button>
          </CyberTooltip>
        </div>
      </div>
    </>
  );
}
