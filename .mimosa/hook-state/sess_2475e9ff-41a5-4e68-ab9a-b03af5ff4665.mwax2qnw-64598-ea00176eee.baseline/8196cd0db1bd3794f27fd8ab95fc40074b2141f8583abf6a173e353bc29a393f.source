/**
 * @file DetachedWindow.tsx
 * @description 分离窗口组件，提供窗口管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags window,management,ui,component
 */

import { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Maximize2, GripHorizontal, RotateCcw, ArrowLeftRight } from "lucide-react";
import { useThemeStore } from "../store/theme-store";
import { usePanelDnD, type DetachedWindow as DetachedWindowType, PANEL_CONTENT_MAP } from "../store/panel-dnd-store";
import { useI18n } from "../i18n/context";
import { CyberTooltip } from "./CyberTooltip";

interface DetachedWindowProps {
  window: DetachedWindowType;
  /** Render function for the actual panel content */
  renderContent: (contentType: DetachedWindowType["contentType"]) => React.ReactNode;
}

/**
 * 浮动窗口 — 模拟桌面窗口管理器
 * 支持标题栏拖拽、角落缩放、最小化/最大化/关闭
 */
export function DetachedWindowComponent({ window: win, renderContent }: DetachedWindowProps) {
  const { tokens, isCyberpunk } = useThemeStore();
  const { t } = useI18n();
  const panelDnD = usePanelDnD();
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevContentType, setPrevContentType] = useState(win.contentType);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevBounds, setPrevBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const cfg = PANEL_CONTENT_MAP[win.contentType];

  // Track content type changes for animation
  const contentChanged = prevContentType !== win.contentType;
  if (contentChanged) {
    setPrevContentType(win.contentType);
  }

  // Whether this window is a valid cross-drag drop target right now
  const isCrossDropTarget =
    panelDnD.isCrossDragging &&
    panelDnD.crossDropTarget?.type === 'window' &&
    panelDnD.crossDropTarget.windowId === win.id;

  // Whether this window is the cross-drag source
  const isCrossDragSource =
    panelDnD.isCrossDragging &&
    panelDnD.crossDragSource?.type === 'window' &&
    panelDnD.crossDragSource.windowId === win.id;

  // ===== Title bar drag =====
  const handleMouseDownDrag = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = win.position.x;
    const startPosY = win.position.y;

    // Bring to front
    panelDnD.setWindowZIndex(win.id, panelDnD.nextZIndex);

    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      panelDnD.moveWindow(win.id, {
        x: Math.max(0, startPosX + dx),
        y: Math.max(0, startPosY + dy),
      });
    };
    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [win, isMaximized, panelDnD]);

  // ===== Corner resize =====
  const handleMouseDownResize = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = win.size.width;
    const startH = win.size.height;

    setIsResizing(true);

    const onMove = (ev: MouseEvent) => {
      const dw = ev.clientX - startX;
      const dh = ev.clientY - startY;
      panelDnD.resizeWindow(win.id, {
        width: Math.max(320, startW + dw),
        height: Math.max(200, startH + dh),
      });
    };
    const onUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [win, isMaximized, panelDnD]);

  // ===== Maximize / Restore =====
  const handleToggleMaximize = useCallback(() => {
    if (isMaximized && prevBounds) {
      panelDnD.moveWindow(win.id, { x: prevBounds.x, y: prevBounds.y });
      panelDnD.resizeWindow(win.id, { width: prevBounds.w, height: prevBounds.h });
      setIsMaximized(false);
    } else {
      setPrevBounds({ x: win.position.x, y: win.position.y, w: win.size.width, h: win.size.height });
      panelDnD.moveWindow(win.id, { x: 0, y: 0 });
      panelDnD.resizeWindow(win.id, { width: globalThis.innerWidth || 1200, height: globalThis.innerHeight || 800 });
      setIsMaximized(true);
    }
  }, [win, isMaximized, prevBounds, panelDnD]);

  // ===== Focus on click =====
  const handleFocus = useCallback(() => {
    panelDnD.setWindowZIndex(win.id, panelDnD.nextZIndex);
  }, [win.id, panelDnD]);

  // ===== Reattach to slot =====
  const handleReattach = useCallback(() => {
    panelDnD.setSlotContent(win.sourceSlot, win.contentType);
    panelDnD.closeWindow(win.id);
  }, [win, panelDnD]);

  // ===== Minimized state =====
  if (win.isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed bottom-4 rounded-lg overflow-hidden cursor-pointer"
        style={{
          left: 80 + panelDnD.detachedWindows.filter(w => w.isMinimized).indexOf(win) * 160,
          zIndex: win.zIndex,
          background: tokens.panelBg,
          border: `1px solid ${tokens.cardBorder}`,
          boxShadow: tokens.shadowHover,
          backdropFilter: "blur(10px)",
          width: 150,
        }}
        onClick={() => panelDnD.restoreWindow(win.id)}
        whileHover={{ scale: 1.05 }}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-2 h-2 rounded-full" style={{ background: tokens.primary }} />
          <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary, letterSpacing: "0.5px" }}>
            {t("ide", cfg.labelKey)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="fixed rounded-lg overflow-hidden flex flex-col"
      style={{
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
        background: tokens.panelBg,
        border: `1px solid ${
          isCrossDropTarget ? tokens.primary
          : isCrossDragSource ? tokens.warning ?? tokens.primary
          : isDragging ? tokens.primary
          : tokens.cardBorder
        }`,
        boxShadow: isCrossDropTarget
          ? `0 0 20px ${tokens.primary}44, 0 0 0 2px ${tokens.primary}55, 0 8px 32px ${tokens.primary}22`
          : isCrossDragSource
          ? `0 0 12px ${(tokens.warning ?? tokens.primary)}33, 0 4px 16px rgba(0,0,0,0.3)`
          : isDragging
          ? `0 8px 32px ${tokens.primary}33, 0 0 0 1px ${tokens.primary}44`
          : isCyberpunk
          ? `0 4px 24px rgba(0,0,0,0.6), 0 0 1px ${tokens.primary}22`
          : "0 4px 24px rgba(0,0,0,0.15)",
        backdropFilter: "blur(12px)",
        transition: isDragging || isResizing ? "none" : "box-shadow 0.3s, border-color 0.3s",
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: isCrossDropTarget ? 1.02 : isCrossDragSource ? 0.97 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onMouseDown={handleFocus}
    >
      {/* ===== Title Bar ===== */}
      <div
        ref={headerRef}
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0 cursor-move select-none"
        style={{
          borderColor: isCrossDropTarget
            ? tokens.primary
            : tokens.borderDim,
          background: isDragging
            ? tokens.primary + "0a"
            : isCrossDropTarget
            ? tokens.primary + "14"
            : "transparent",
        }}
        onMouseDown={handleMouseDownDrag}
        onDoubleClick={handleToggleMaximize}
        // Cross-window drop target (HTML5 Drag API)
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; panelDnD.hoverCrossTarget({ type: 'window', windowId: win.id }); }}
        onDragLeave={() => { if (panelDnD.crossDropTarget?.type === 'window' && panelDnD.crossDropTarget.windowId === win.id) panelDnD.hoverCrossTarget(null); }}
        onDrop={(e) => { e.preventDefault(); panelDnD.completeCrossDrop(); }}
      >
        {/* Cross-window content drag handle (对齐 Guidelines: Window Synchronization) */}
        <CyberTooltip label={t("ide", "dragToSwap")} position="bottom">
          <div
            draggable
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10 transition-all"
            style={{ color: panelDnD.isCrossDragging ? tokens.primary : tokens.foregroundMuted }}
            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", `window:${win.id}`); panelDnD.startCrossDragFromWindow(win.id); }}
            onDragEnd={() => { panelDnD.cancelCrossDrag(); }}
          >
            <ArrowLeftRight size={10} />
          </div>
        </CyberTooltip>

        {/* Drag grip */}
        <GripHorizontal size={12} color={tokens.foregroundMuted} style={{ opacity: 0.4 }} />

        {/* Window title */}
        <div className="w-2 h-2 rounded-full" style={{ background: tokens.primary, boxShadow: isCyberpunk ? `0 0 4px ${tokens.primary}` : "none" }} />
        <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, letterSpacing: "1px" }}>
          {t("ide", cfg.labelKey)}
        </span>

        {/* Window ID badge */}
        <span style={{ fontFamily: tokens.fontMono, fontSize: "7px", color: tokens.foregroundMuted, opacity: 0.4, letterSpacing: "0.5px" }}>
          [{win.sourceSlot.toUpperCase()}]
        </span>

        <div className="flex-1" />

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <CyberTooltip label={t("ide", "resetLayout")} position="bottom">
            <button
              className="p-0.5 rounded hover:bg-white/10 transition-all"
              onClick={handleReattach}
            >
              <RotateCcw size={10} color={tokens.foregroundMuted} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "minimize")} position="bottom">
            <button
              className="p-0.5 rounded hover:bg-white/10 transition-all"
              onClick={() => panelDnD.minimizeWindow(win.id)}
            >
              <Minus size={10} color={tokens.windowMinimize} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "maximize")} position="bottom">
            <button
              className="p-0.5 rounded hover:bg-white/10 transition-all"
              onClick={handleToggleMaximize}
            >
              <Maximize2 size={10} color={tokens.windowMaximize} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "close")} position="bottom">
            <button
              className="p-0.5 rounded hover:bg-white/10 transition-all"
              onClick={() => panelDnD.closeWindow(win.id)}
            >
              <X size={10} color={tokens.windowClose} />
            </button>
          </CyberTooltip>
        </div>
      </div>

      {/* ===== Content with AnimatePresence cross-swap transition ===== */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={win.contentType}
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {renderContent(win.contentType)}
          </motion.div>
        </AnimatePresence>

        {/* Cross-drag drop target glow overlay */}
        <AnimatePresence>
          {isCrossDropTarget && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-b-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                background: `linear-gradient(135deg, ${tokens.primary}08, ${tokens.primary}14)`,
                border: `1px dashed ${tokens.primary}44`,
                borderTop: "none",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ===== Resize handle (bottom-right corner) ===== */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          style={{ zIndex: 10 }}
          onMouseDown={handleMouseDownResize}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" className="absolute bottom-0 right-0">
            <line x1="14" y1="4" x2="4" y2="14" stroke={tokens.border} strokeWidth="1" />
            <line x1="14" y1="8" x2="8" y2="14" stroke={tokens.border} strokeWidth="1" />
            <line x1="14" y1="12" x2="12" y2="14" stroke={tokens.border} strokeWidth="1" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

/**
 * DetachedWindowLayer — Renders all detached windows as a portal layer
 */
export function DetachedWindowLayer({ renderContent }: { renderContent: (ct: DetachedWindowType["contentType"]) => React.ReactNode }) {
  const { detachedWindows } = usePanelDnD();

  if (detachedWindows.length === 0) return null;

  return (
    <AnimatePresence>
      {detachedWindows.map((win) => (
        <DetachedWindowComponent key={win.id} window={win} renderContent={renderContent} />
      ))}
    </AnimatePresence>
  );
}
