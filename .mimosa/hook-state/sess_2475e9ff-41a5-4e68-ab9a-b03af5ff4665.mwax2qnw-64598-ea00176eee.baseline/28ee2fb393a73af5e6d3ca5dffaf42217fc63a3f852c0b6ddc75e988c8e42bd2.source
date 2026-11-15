/**
 * @file PanelDropZone.tsx
 * @description 面板拖拽区域组件，提供拖拽区域功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,drag-drop,ui,component
 */

import { useRef, useCallback, useState } from "react";
import { GripVertical, ArrowLeftRight, RotateCcw, ChevronDown, ExternalLink, Save, FolderOpen, Cloud, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "../store/theme-store";
import { usePanelDnD, type PanelSlot, PANEL_CONTENT_MAP } from "../store/panel-dnd-store";
import { useI18n } from "../i18n/context";
import { CyberTooltip } from "./CyberTooltip";

interface PanelDropZoneProps {
  slot: PanelSlot;
  /** Additional header content (label, buttons etc.) rendered to the right of the drag handle */
  children?: React.ReactNode;
}

/**
 * 面板拖拽区域 — 可拖拽的面板头部手柄
 * 使用原生 HTML5 拖拽 API + Motion 动画实现三栏面板交换
 */
export function PanelDropZone({ slot, children }: PanelDropZoneProps) {
  const { tokens } = useThemeStore();
  const { t } = useI18n();
  const dnd = usePanelDnD();
  const ref = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isDropTarget = dnd.isDragging && dnd.dropTarget === slot;
  const isDragSource = dnd.isDragging && dnd.dragSource === slot;
  const canDrop = dnd.isDragging && dnd.dragSource !== slot;

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slot);
    // Create a ghost image from the header
    if (ref.current) {
      const ghost = ref.current.cloneNode(true) as HTMLElement;
      ghost.style.opacity = "0.8";
      ghost.style.transform = "scale(0.95)";
      ghost.style.position = "fixed";
      ghost.style.top = "-9999px";
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 15);
      requestAnimationFrame(() => document.body.removeChild(ghost));
    }
    dnd.startDrag(slot);
    // Also start cross-drag so window targets can receive (对齐 Guidelines: Window Synchronization)
    if (dnd.detachedWindows && dnd.detachedWindows.length > 0) {
      dnd.startCrossDragFromSlot(slot);
    }
  }, [slot, dnd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Support both slot-to-slot and window-to-slot drag
    if (dnd.isCrossDragging) {
      dnd.hoverCrossTarget({ type: 'slot', slot });
    } else {
      dnd.hoverSlot(slot);
    }
  }, [slot, dnd]);

  const handleDragLeave = useCallback(() => {
    if (dnd.isCrossDragging) {
      if (dnd.crossDropTarget?.type === 'slot' && dnd.crossDropTarget.slot === slot) {
        dnd.hoverCrossTarget(null);
      }
    } else if (dnd.dropTarget === slot) {
      dnd.hoverSlot(null);
    }
  }, [slot, dnd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dnd.isCrossDragging) {
      dnd.completeCrossDrop();
    } else {
      dnd.completeDrop();
    }
  }, [dnd]);

  const handleDragEnd = useCallback(() => {
    dnd.cancelDrag();
    if (dnd.isCrossDragging) {
      dnd.cancelCrossDrag();
    }
  }, [dnd]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPickerOpen(true);
  }, []);

  return (
    <motion.div
      ref={ref}
      layout
      className="group flex items-center gap-2 px-3 py-2 border-b shrink-0 select-none relative"
      style={{
        borderColor: isDropTarget ? tokens.primary : tokens.border + "44",
        background: isDropTarget
          ? tokens.primary + "14"
          : isDragSource
          ? tokens.warning + "0a"
          : "transparent",
      }}
      animate={{
        boxShadow: isDropTarget
          ? `inset 0 0 16px ${tokens.primary}28`
          : isDragSource
          ? `inset 0 0 8px ${tokens.warning}15`
          : "inset 0 0 0px transparent",
        opacity: isDragSource ? 0.55 : 1,
        scale: isDragSource ? 0.98 : isDropTarget ? 1.01 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      drag={false}
      draggable
      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent)}
      onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e as unknown as React.DragEvent)}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
    >
      {/* Drag handle grip */}
      <CyberTooltip label={t("ide", "dragToSwap")} position="bottom">
        <motion.div
          className="cursor-grab active:cursor-grabbing p-0.5 rounded"
          style={{ color: canDrop ? tokens.primary : tokens.foregroundMuted }}
          whileHover={{ scale: 1.15, backgroundColor: "rgba(255,255,255,0.08)" }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <GripVertical size={12} />
        </motion.div>
      </CyberTooltip>

      {/* Drop zone overlay — animated pulse */}
      <AnimatePresence>
        {canDrop && isDropTarget && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 5 }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                background: tokens.primary + "22",
                border: `1px dashed ${tokens.primary}66`,
                backdropFilter: "blur(6px)",
              }}
              animate={{
                boxShadow: [
                  `0 0 0px ${tokens.primary}00`,
                  `0 0 12px ${tokens.primary}33`,
                  `0 0 0px ${tokens.primary}00`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowLeftRight size={12} color={tokens.primary} />
              <span style={{
                fontFamily: tokens.fontMono,
                fontSize: "9px",
                color: tokens.primary,
                letterSpacing: "0.5px",
              }}>
                {t("ide", "dropToSwap")}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot indicator badge — click to open picker */}
      <motion.button
        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
        style={{
          background: pickerOpen ? tokens.primary + "18" : tokens.primaryGlow,
          border: `1px solid ${pickerOpen ? tokens.primary + "44" : tokens.borderDim}`,
          cursor: "pointer",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setPickerOpen(!pickerOpen)}
        title={t("ide", "panelContent")}
      >
        <span style={{
          fontFamily: tokens.fontMono,
          fontSize: "7px",
          color: pickerOpen ? tokens.primary : tokens.foregroundMuted,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}>
          {slot === "left" ? "L" : slot === "center" ? "C" : "R"}
        </span>
        <ChevronDown size={7} color={pickerOpen ? tokens.primary : tokens.foregroundMuted} style={{ marginLeft: -1 }} />
      </motion.button>

      {/* Panel content (icon + label + extras) */}
      {children}

      {/* Detach button — pop out to floating window (对齐 Guidelines: Window Management) */}
      <CyberTooltip label={t("ide", "detachWindow") ?? "Detach"} position="bottom">
        <motion.button
          className="ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100"
          style={{ color: tokens.foregroundMuted }}
          whileHover={{ scale: 1.15, color: tokens.primary }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); dnd.detachWindow(slot); }}
        >
          <ExternalLink size={10} />
        </motion.button>
      </CyberTooltip>

      {/* Inline Picker Dropdown */}
      <AnimatePresence>
        {pickerOpen && (
          <PanelSlotPicker slot={slot} onClose={() => setPickerOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * PanelSlotPicker — Animated dropdown to select panel content type
 */
export function PanelSlotPicker({ slot, onClose }: { slot: PanelSlot; onClose: () => void }) {
  const { tokens } = useThemeStore();
  const { t } = useI18n();
  const dnd = usePanelDnD();
  const [layoutView, setLayoutView] = useState<'main' | 'save' | 'load'>('main');
  const [saveLayoutName, setSaveLayoutName] = useState('');
  const [cloudSyncing, setCloudSyncing] = useState(false);

  const allTypes = Object.values(PANEL_CONTENT_MAP);
  const currentType = dnd.slotContent[slot];
  const savedLayouts = dnd.listLayouts().filter(l => l.name !== '__autosave__');
  const syncState = dnd.getSyncState();

  const handleSaveLayout = () => {
    if (saveLayoutName.trim()) {
      dnd.saveLayout(saveLayoutName.trim());
      setSaveLayoutName('');
      setLayoutView('main');
    }
  };

  const handleCloudSync = async () => {
    setCloudSyncing(true);
    await dnd.syncAllToCloud();
    setCloudSyncing(false);
  };

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 998 }} onClick={onClose} />
      <motion.div
        className="absolute top-full left-0 mt-1 rounded-lg overflow-hidden"
        style={{
          zIndex: 999,
          background: tokens.panelBg,
          border: `1px solid ${tokens.cardBorder}`,
          boxShadow: tokens.shadowHover,
          minWidth: 170,
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: -6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <div className="px-3 py-1.5 border-b" style={{ borderColor: tokens.borderDim }}>
          <span style={{
            fontFamily: tokens.fontMono,
            fontSize: "8px",
            color: tokens.foregroundMuted,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}>
            {t("ide", "panelContent")}
          </span>
        </div>
        {layoutView === 'main' && (
          <>
            {allTypes.map((cfg, i) => (
              <motion.button
                key={cfg.type}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{
                  fontFamily: tokens.fontMono,
                  fontSize: "10px",
                  color: currentType === cfg.type ? tokens.primary : tokens.foreground,
                  background: currentType === cfg.type ? tokens.primaryGlow : "transparent",
                }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => {
                  dnd.setSlotContent(slot, cfg.type);
                  onClose();
                }}
              >
                {currentType === cfg.type && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: tokens.primary }}
                    layoutId={`picker-dot-${slot}`}
                  />
                )}
                <span>{t("ide", cfg.labelKey)}</span>
              </motion.button>
            ))}
            <div className="border-t" style={{ borderColor: tokens.borderDim }}>
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => { dnd.resetSlots(); onClose(); }}
              >
                <RotateCcw size={9} />
                <span>{t("ide", "resetLayout")}</span>
              </motion.button>
            </div>
            <div className="border-t" style={{ borderColor: tokens.borderDim }}>
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => setLayoutView('save')}
              >
                <Save size={9} />
                <span>{t("ide", "saveLayout")}</span>
              </motion.button>
            </div>
            <div className="border-t" style={{ borderColor: tokens.borderDim }}>
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => setLayoutView('load')}
              >
                <FolderOpen size={9} />
                <span>{t("ide", "loadLayout")}</span>
              </motion.button>
            </div>
            <div className="border-t" style={{ borderColor: tokens.borderDim }}>
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={handleCloudSync}
              >
                <Cloud size={9} />
                <span>{cloudSyncing ? t("ide", "syncing") : t("ide", "syncCloud")}</span>
              </motion.button>
            </div>
          </>
        )}
        {layoutView === 'save' && (
          <>
            <div className="px-3 py-1.5 border-b" style={{ borderColor: tokens.borderDim }}>
              <span style={{
                fontFamily: tokens.fontMono,
                fontSize: "8px",
                color: tokens.foregroundMuted,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}>
                {t("ide", "saveLayout")}
              </span>
            </div>
            <div className="px-3 py-1.5">
              <input
                type="text"
                value={saveLayoutName}
                onChange={(e) => setSaveLayoutName(e.target.value)}
                placeholder={t("ide", "layoutName")}
                className="w-full px-2 py-1.5 rounded border outline-none"
                style={{
                  borderColor: tokens.borderDim,
                  background: tokens.panelBg,
                  color: tokens.foreground,
                  fontFamily: tokens.fontMono,
                  fontSize: "10px",
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLayout(); }}
                autoFocus
              />
            </div>
            <div className="px-3 py-1.5">
              <motion.button
                className="w-full px-2 py-1.5 rounded transition-colors"
                style={{
                  background: saveLayoutName.trim() ? tokens.primary : tokens.borderDim,
                  color: saveLayoutName.trim() ? '#fff' : tokens.foregroundMuted,
                  fontFamily: tokens.fontMono,
                  fontSize: "9px",
                  opacity: saveLayoutName.trim() ? 1 : 0.5,
                  cursor: saveLayoutName.trim() ? 'pointer' : 'not-allowed',
                }}
                whileHover={saveLayoutName.trim() ? { scale: 1.02 } : {}}
                whileTap={saveLayoutName.trim() ? { scale: 0.98 } : {}}
                onClick={handleSaveLayout}
                disabled={!saveLayoutName.trim()}
              >
                <Check size={9} style={{ display: "inline", marginRight: 4 }} />
                {t("ide", "save")}
              </motion.button>
            </div>
            <div className="border-t" style={{ borderColor: tokens.borderDim }}>
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => setLayoutView('main')}
              >
                <ChevronDown size={9} />
                <span>{t("ide", "back")}</span>
              </motion.button>
            </div>
          </>
        )}
        {layoutView === 'load' && (
          <>
            <div className="px-3 py-1.5 border-b" style={{ borderColor: tokens.borderDim }}>
              <span style={{
                fontFamily: tokens.fontMono,
                fontSize: "8px",
                color: tokens.foregroundMuted,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}>
                {t("ide", "loadLayout")}
              </span>
            </div>
            {savedLayouts.map((layout, i) => (
              <motion.button
                key={layout.id}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{
                  fontFamily: tokens.fontMono,
                  fontSize: "10px",
                  color: tokens.foreground,
                }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 25 }}
                onClick={() => {
                  dnd.loadLayout(layout.id);
                  onClose();
                }}
              >
                <FolderOpen size={9} color={tokens.foregroundMuted} />
                <span className="flex-1 truncate">{layout.name}</span>
                <span style={{ fontFamily: tokens.fontMono, fontSize: "7px", color: tokens.foregroundMuted }}>
                  {new Date(layout.updatedAt).toLocaleDateString()}
                </span>
                <motion.div
                  className="p-0.5 rounded hover:bg-white/10"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); dnd.deleteLayout(layout.id); }}
                >
                  <Trash2 size={8} color={tokens.foregroundMuted} />
                </motion.div>
              </motion.button>
            ))}
            {savedLayouts.length === 0 && (
              <div className="px-3 py-2" style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>
                {t("ide", "noSavedLayouts")}
              </div>
            )}
            {/* Cloud sync status */}
            {syncState.lastCloudSyncTime && (
              <div className="px-3 py-1" style={{ fontFamily: tokens.fontMono, fontSize: "7px", color: tokens.foregroundMuted, opacity: 0.7 }}>
                <Cloud size={7} style={{ display: "inline", marginRight: 3 }} />
                {new Date(syncState.lastCloudSyncTime).toLocaleTimeString()}
                {syncState.cloudLayoutCount > 0 && ` (${syncState.cloudLayoutCount})`}
              </div>
            )}
            <div className="border-t" style={{ borderColor: tokens.borderDim }}>
              <motion.button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-white/5"
                style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => setLayoutView('main')}
              >
                <ChevronDown size={9} />
                <span>{t("ide", "back")}</span>
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
