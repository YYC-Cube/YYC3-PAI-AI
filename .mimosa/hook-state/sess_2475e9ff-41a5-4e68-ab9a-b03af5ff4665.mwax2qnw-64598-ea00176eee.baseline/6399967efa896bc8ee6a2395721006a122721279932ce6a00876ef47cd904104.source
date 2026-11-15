/**
 * @file useIDEKeyboard.ts
 * @description IDE global keyboard shortcuts — extracted from IDEMode
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.3
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,hook,keyboard,react
 * @license MIT
 */

import { useEffect } from "react";
import { ideStore as ideStoreDirect } from "../../store/ide-store";
import { usePreviewStore } from "../../store/preview-store";
import { fileStore as fileStoreActions } from "../../store/file-store";

export interface UseIDEKeyboardOptions {
  onSwitchMode: () => void;
  fullscreenPreview: boolean;
  setFullscreenPreview: (v: boolean) => void;
  setViewMode: (m: "edit" | "preview") => void;
  setTerminalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setTerminalExpanded: (v: boolean) => void;
  onOpenGlobalSearch?: () => void;
}

/**
 * Registers all IDE-level keyboard shortcuts.
 * Returns nothing — purely side-effect based.
 */
export function useIDEKeyboard(opts: UseIDEKeyboardOptions): void {
  const previewState = usePreviewStore();
  const {
    onSwitchMode,
    fullscreenPreview,
    setFullscreenPreview,
    setViewMode,
    setTerminalVisible,
    setTerminalExpanded,
    onOpenGlobalSearch,
  } = opts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape — exit fullscreen preview or switch mode
      if (e.key === "Escape") {
        if (fullscreenPreview) {
          setFullscreenPreview(false);
        } else {
          onSwitchMode();
        }
      }
      // Ctrl+1 — preview mode
      else if (e.ctrlKey && e.key === "1") {
        e.preventDefault();
        setViewMode("preview");
      }
      // Ctrl+2 — edit mode
      else if (e.ctrlKey && e.key === "2") {
        e.preventDefault();
        setViewMode("edit");
      }
      // Ctrl+Shift+F — global search
      else if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        onOpenGlobalSearch?.();
      }
      // Ctrl+\ — toggle split
      else if (e.ctrlKey && e.key === "\\") {
        e.preventDefault();
        ideStoreDirect.toggleSplit();
      }
      // Ctrl+W — close active tab
      else if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        ideStoreDirect.closeTab(ideStoreDirect.getState().activeTabId);
      }
      // Ctrl+Shift+P — toggle inline preview
      else if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        previewState.toggleInlinePreview();
      }
      // Ctrl+B — toggle left sidebar
      else if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        ideStoreDirect.toggleLeftCollapsed();
      }
      // Ctrl+J or Ctrl+` — toggle terminal
      else if (e.ctrlKey && (e.key === "j" || e.key === "`")) {
        e.preventDefault();
        ideStoreDirect.toggleTerminal();
        setTerminalVisible((v) => {
          if (!v) setTerminalExpanded(false);
          return !v;
        });
      }
      // Ctrl+3..9 — switch to tab by index
      else if (e.ctrlKey && e.key >= "3" && e.key <= "9") {
        e.preventDefault();
        const tabs = ideStoreDirect.getState().openTabs;
        const tabIdx = parseInt(e.key) - 1;
        if (tabIdx < tabs.length) ideStoreDirect.activateTab(tabs[tabIdx].id);
      }
      // Ctrl+E — recent files
      else if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        fileStoreActions.toggleRecentPanel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSwitchMode, fullscreenPreview, setFullscreenPreview, setViewMode, setTerminalVisible, setTerminalExpanded, onOpenGlobalSearch, previewState]);
}
