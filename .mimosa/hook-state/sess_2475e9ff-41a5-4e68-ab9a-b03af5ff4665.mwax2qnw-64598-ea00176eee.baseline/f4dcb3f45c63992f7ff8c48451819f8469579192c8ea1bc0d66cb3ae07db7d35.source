/**
 * @file IDEStatusBar.tsx
 * @description YYC3 IDE 底部状态栏 — 从 IDEMode.tsx 拆分的独立组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status stable
 * @license MIT
 * @tags component,status-bar,ide,ui
 */

import {
  Bot, Wifi, Database, Puzzle, Clock, History, LayoutGrid,
} from "lucide-react";
import { CyberTooltip } from "./CyberTooltip";
import { useI18n } from "../i18n/context";
import { useThemeStore } from "../store/theme-store";
import { useModelStore } from "../store/model-store";
import { useEditorPrefs } from "../store/editor-prefs-store";
import { useIDEStore, LAYOUT_PRESETS } from "../store/ide-store";
import { fileStore as fileStoreActions } from "../store/file-store";
import { dbStore as dbStoreActions } from "../store/db-store";
import { pluginStoreActions } from "../store/plugin-store";
import { offlineStoreActions } from "../store/offline-store";
import { useState } from "react";

interface IDEStatusBarProps {
  selectedFile: string;
  viewMode: "edit" | "preview";
  fullscreenPreview: boolean;
  lastAutoSave: string | null;
  onApplyPreset: (presetId: string) => void;
}

export function IDEStatusBar({
  selectedFile,
  viewMode,
  fullscreenPreview,
  lastAutoSave,
  onApplyPreset,
}: IDEStatusBarProps) {
  const { t, locale } = useI18n();
  const { tokens, isCyberpunk } = useThemeStore();
  const { getActiveModel, connectivityMap } = useModelStore();
  const { prefs: editorPrefs } = useEditorPrefs();
  const ideStore = useIDEStore();
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  const panelBg = tokens.panelBg;
  const borderColor = tokens.cardBorder;

  return (
    <footer
      className="flex items-center justify-between px-4 py-1 border-t shrink-0"
      style={{ background: panelBg, borderColor, backdropFilter: "blur(10px)" }}
    >
      <div className="flex items-center gap-3">
        <CyberTooltip label={t("tooltips", "connStatus")} position="top">
          <div className="flex items-center gap-1">
            <Wifi size={10} color={tokens.success} style={{ filter: isCyberpunk ? `drop-shadow(0 0 3px ${tokens.success})` : "none" }} />
            <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.success }}>{t("common", "online")}</span>
          </div>
        </CyberTooltip>
        <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>
          {fullscreenPreview ? t("ide", "fullscreenMode") : viewMode === "edit" ? t("ide", "editMode") : t("ide", "previewMode")}
        </span>

        {/* Layout Preset Selector */}
        <div className="relative">
          <CyberTooltip label={t("ide", "layoutPreset")} position="top">
            <button
              className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all hover:opacity-80"
              style={{
                fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.primaryDim,
                background: tokens.primaryGlow, border: `1px solid ${tokens.borderDim}`,
              }}
              onClick={() => setPresetMenuOpen(prev => !prev)}
            >
              <LayoutGrid size={8} />
              {LAYOUT_PRESETS.find(p => p.id === ideStore.activePresetId)?.name[locale] || "Coding"}
            </button>
          </CyberTooltip>
          {presetMenuOpen && (
            <>
              <div className="fixed inset-0" style={{ zIndex: 998 }} onClick={() => setPresetMenuOpen(false)} />
              <div
                className="absolute bottom-full left-0 mb-1 rounded-lg overflow-hidden"
                style={{ zIndex: 999, background: tokens.panelBg, border: `1px solid ${tokens.cardBorder}`, boxShadow: tokens.shadowHover, minWidth: 150 }}
              >
                {LAYOUT_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-all hover:bg-white/5"
                    style={{
                      fontFamily: tokens.fontMono, fontSize: "10px",
                      color: ideStore.activePresetId === preset.id ? tokens.primary : tokens.foreground,
                      background: ideStore.activePresetId === preset.id ? tokens.primaryGlow : "transparent",
                    }}
                    onClick={() => {
                      onApplyPreset(preset.id);
                      setPresetMenuOpen(false);
                    }}
                  >
                    {ideStore.activePresetId === preset.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.primary }} />}
                    <span>{preset.name[locale]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Model status */}
        {(() => {
          const am = getActiveModel();
          if (!am) return null;
          const cs = connectivityMap[am.id];
          const statusColor = cs?.status === "online" ? tokens.success : cs?.status === "checking" ? tokens.warning : cs?.status === "offline" ? tokens.error : tokens.foregroundMuted;
          return (
            <CyberTooltip label={t("tooltips", "modelStatus")} position="top">
              <div className="flex items-center gap-1">
                <Bot size={9} color={statusColor} style={{ filter: isCyberpunk ? `drop-shadow(0 0 3px ${statusColor})` : "none" }} />
                <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: statusColor }}>
                  {am.name.length > 12 ? am.name.slice(0, 12) + "\u2026" : am.name}
                </span>
              </div>
            </CyberTooltip>
          );
        })()}

        {/* DB Manager */}
        <CyberTooltip label={t("ide", "dbManager")} position="top">
          <button className="flex items-center gap-1 p-0.5 rounded hover:bg-white/5 transition-all" onClick={() => dbStoreActions.openPanel()}>
            <Database size={9} color={tokens.primaryDim} />
            <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.primaryDim }}>DB</span>
          </button>
        </CyberTooltip>

        {/* Plugin Manager */}
        <CyberTooltip label={t("ide", "pluginManager")} position="top">
          <button className="p-0.5 rounded hover:bg-white/5 transition-all" onClick={() => pluginStoreActions.openPanel()}>
            <Puzzle size={9} color={tokens.primaryDim} />
          </button>
        </CyberTooltip>

        {/* Offline Status */}
        <CyberTooltip label={t("ide", "offlineCache")} position="top">
          <button className="p-0.5 rounded hover:bg-white/5 transition-all" onClick={() => offlineStoreActions.openPanel()}>
            <Wifi size={9} color={navigator.onLine ? tokens.success : tokens.error} />
          </button>
        </CyberTooltip>
      </div>

      <div className="flex items-center gap-3">
        {editorPrefs.autoSave && lastAutoSave && (
          <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.success, opacity: 0.6 }}>
            {`${t("ide", "savedAt")} ${lastAutoSave}`}
          </span>
        )}
        <CyberTooltip label={t("ide", "recentFilesShort")} position="top">
          <button className="p-0.5 rounded hover:bg-white/5 transition-all" onClick={() => fileStoreActions.toggleRecentPanel()}>
            <Clock size={10} color={tokens.primaryDim} />
          </button>
        </CyberTooltip>
        <CyberTooltip label={t("ide", "versionHistory")} position="top">
          <button className="p-0.5 rounded hover:bg-white/5 transition-all" onClick={() => fileStoreActions.openVersionPanel(selectedFile)}>
            <History size={10} color={tokens.primaryDim} />
          </button>
        </CyberTooltip>
        <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>
          {selectedFile}
        </span>
        <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>
          YYC&#179; v4.8.0
        </span>
      </div>
    </footer>
  );
}
