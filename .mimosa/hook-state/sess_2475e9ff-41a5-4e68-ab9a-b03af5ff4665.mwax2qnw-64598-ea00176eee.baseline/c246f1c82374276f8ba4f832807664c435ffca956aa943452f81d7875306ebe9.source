/**
 * @file useIDEPanelResize.ts
 * @description Terminal + panel column resize logic — extracted from IDEMode
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.3
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,hook,resize,react
 * @license MIT
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TERMINAL_HEIGHT_MIN,
  TERMINAL_HEIGHT_MAX,
  LEFT_WIDTH_MIN,
  LEFT_WIDTH_MAX,
  MIDDLE_RATIO_MIN,
  MIDDLE_RATIO_MAX,
} from "../../types";

export interface UseIDEPanelResizeOptions {
  /** Initial left panel width percentage */
  initialLeftWidth: number;
  /** Initial middle panel ratio percentage */
  initialMiddleRatio: number;
  /** Initial terminal height in px */
  initialTerminalHeight: number;
}

export interface IDEPanelResizeAPI {
  /* ── Column layout ── */
  leftWidth: number;
  setLeftWidth: React.Dispatch<React.SetStateAction<number>>;
  middleRatio: number;
  setMiddleRatio: React.Dispatch<React.SetStateAction<number>>;
  isDraggingPanel: boolean;
  /** Initiate column drag — call from onMouseDown of resize handles */
  startPanelDrag: (type: "left" | "middle", e: React.MouseEvent) => void;

  /* ── Terminal ── */
  terminalHeight: number;
  setTerminalHeight: React.Dispatch<React.SetStateAction<number>>;
  /** Initiate terminal resize — call from onMouseDown of terminal drag bar */
  startTerminalResize: (e: React.MouseEvent) => void;
}

/**
 * Encapsulates all mouse-driven panel resize logic (terminal + 3-column layout).
 */
export function useIDEPanelResize(opts: UseIDEPanelResizeOptions): IDEPanelResizeAPI {
  const { initialLeftWidth, initialMiddleRatio, initialTerminalHeight } = opts;

  // ── Column state ──
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [middleRatio, setMiddleRatio] = useState(initialMiddleRatio);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const panelDragRef = useRef<{ type: "left" | "middle"; startX: number; startVal: number } | null>(null);

  // ── Terminal state ──
  const [terminalHeight, setTerminalHeight] = useState(initialTerminalHeight);
  const terminalResizeRef = useRef<{ startY: number; startH: number } | null>(null);

  // ===== Terminal resize handlers =====
  const handleTerminalResize = useCallback((e: MouseEvent) => {
    if (terminalResizeRef.current) {
      const delta = terminalResizeRef.current.startY - e.clientY;
      setTerminalHeight(
        Math.max(TERMINAL_HEIGHT_MIN, Math.min(TERMINAL_HEIGHT_MAX, terminalResizeRef.current.startH + delta))
      );
    }
  }, []);

  const handleTerminalResizeEnd = useCallback(() => {
    terminalResizeRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleTerminalResize);
    window.addEventListener("mouseup", handleTerminalResizeEnd);
    return () => {
      window.removeEventListener("mousemove", handleTerminalResize);
      window.removeEventListener("mouseup", handleTerminalResizeEnd);
    };
  }, [handleTerminalResize, handleTerminalResizeEnd]);

  const startTerminalResize = useCallback(
    (e: React.MouseEvent) => {
      terminalResizeRef.current = { startY: e.clientY, startH: terminalHeight };
    },
    [terminalHeight]
  );

  // ===== Panel column resize handlers =====
  const handlePanelResize = useCallback(
    (e: MouseEvent) => {
      if (!panelDragRef.current) return;
      const { type, startX, startVal } = panelDragRef.current;
      const deltaX = e.clientX - startX;
      const totalW = window.innerWidth;
      if (type === "left") {
        setLeftWidth(Math.max(LEFT_WIDTH_MIN, Math.min(LEFT_WIDTH_MAX, startVal + (deltaX / totalW) * 100)));
      } else {
        const remainingW = totalW * (1 - leftWidth / 100);
        if (remainingW > 0) {
          setMiddleRatio(
            Math.max(MIDDLE_RATIO_MIN, Math.min(MIDDLE_RATIO_MAX, startVal + (deltaX / remainingW) * 100))
          );
        }
      }
    },
    [leftWidth]
  );

  const handlePanelResizeEnd = useCallback(() => {
    panelDragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    setIsDraggingPanel(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handlePanelResize);
    window.addEventListener("mouseup", handlePanelResizeEnd);
    return () => {
      window.removeEventListener("mousemove", handlePanelResize);
      window.removeEventListener("mouseup", handlePanelResizeEnd);
    };
  }, [handlePanelResize, handlePanelResizeEnd]);

  const startPanelDrag = useCallback(
    (type: "left" | "middle", e: React.MouseEvent) => {
      e.preventDefault();
      panelDragRef.current = {
        type,
        startX: e.clientX,
        startVal: type === "left" ? leftWidth : middleRatio,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      setIsDraggingPanel(true);
    },
    [leftWidth, middleRatio]
  );

  return {
    leftWidth,
    setLeftWidth,
    middleRatio,
    setMiddleRatio,
    isDraggingPanel,
    startPanelDrag,
    terminalHeight,
    setTerminalHeight,
    startTerminalResize,
  };
}
