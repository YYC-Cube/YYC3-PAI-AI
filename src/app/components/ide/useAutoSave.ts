/**
 * @file useAutoSave.ts
 * @description Auto-save logic — periodic interval + debounced dirty-save with version creation
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.3
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,hook,auto-save,react
 * @license MIT
 */

import { useEffect, useState, useCallback } from "react";
import { useEditorPrefs } from "../../store/editor-prefs-store";
import { useI18n } from "../../i18n/context";
import { fileStore as fileStoreActions } from "../../store/file-store";
import { gitEngine } from "../../services/git-service";

const STORAGE_KEY = "yyc3_file_content_map";

/** 落盘直通：工作区仓库存在时同步写入 LightningFS（Git 面板/终端可见），fire-and-forget */
function writeThroughToWorkspace(fileContentMap: Record<string, string>) {
  gitEngine.isRepo().then((has) => {
    if (!has) return;
    for (const [name, content] of Object.entries(fileContentMap)) {
      gitEngine.writeFile(name, content).catch(() => { /* 单文件失败不阻塞 */ });
    }
  }).catch(() => { /* FS 不可用忽略 */ });
}

export interface UseAutoSaveOptions {
  /** Current file content map */
  fileContentMap: Record<string, string>;
  /** Whether current editor buffer has unsaved changes */
  editorDirty: boolean;
  /** Reset dirty flag after save */
  setEditorDirty: (v: boolean) => void;
  /** Currently selected file name */
  selectedFile: string;
  /** Current editor code */
  editorCode: string;
}

export interface AutoSaveAPI {
  /** Timestamp string of last auto-save (or null) */
  lastAutoSave: string | null;
}

/**
 * Encapsulates both:
 * 1. Periodic interval save (every 10s) — persists fileContentMap to localStorage
 * 2. Debounced dirty-save (3s after edit) — also creates a file version
 */
export function useAutoSave(opts: UseAutoSaveOptions): AutoSaveAPI {
  const { fileContentMap, editorDirty, setEditorDirty, selectedFile, editorCode } = opts;
  const { prefs: editorPrefs } = useEditorPrefs();
  const { locale } = useI18n();
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  const formatTime = useCallback(
    () => new Date().toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-US", { hour12: false }),
    [locale]
  );

  // Periodic interval save (every 10s)
  useEffect(() => {
    if (!editorPrefs.autoSave) return;
    const timer = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileContentMap));
        writeThroughToWorkspace(fileContentMap);
        setLastAutoSave(formatTime());
      } catch { /* ignore */ }
    }, 10_000);
    return () => clearInterval(timer);
  }, [editorPrefs.autoSave, fileContentMap, formatTime]);

  // Debounced dirty-save (3s after edit stops)
  useEffect(() => {
    if (!editorPrefs.autoSave || !editorDirty) return;
    const debounce = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fileContentMap));
        writeThroughToWorkspace(fileContentMap);
        setLastAutoSave(formatTime());
        if (selectedFile && editorCode) {
          fileStoreActions.createVersion(selectedFile, editorCode, "auto");
        }
        setEditorDirty(false);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearTimeout(debounce);
  }, [editorPrefs.autoSave, editorDirty, fileContentMap, formatTime, selectedFile, editorCode, setEditorDirty]);

  return { lastAutoSave };
}
