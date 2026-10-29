/**
 * @file IDELayoutContext.tsx
 * @description Shared context for IDE sub-components — avoids excessive prop drilling
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,layout,context,react
 */

import { createContext, useContext, type RefObject } from "react";
import type { CyberEditorHandle } from "../CyberEditor";
import type { FileNode } from "../../types";
import type { ActionContext as QAContext } from "../../store/quick-actions-store";

/** Shared IDE state consumed by extracted sub-components */
export interface IDELayoutContextValue {
  // ── File / Editor state ──
  selectedFile: string;
  setSelectedFile: (f: string) => void;
  editorCode: string;
  setEditorCode: (code: string) => void;
  editorDirty: boolean;
  setEditorDirty: (v: boolean) => void;
  fileContentMap: Record<string, string>;
  setFileContentMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  cyberEditorRef: RefObject<CyberEditorHandle>;

  // ── File explorer state ──
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredFileTree: FileNode[];
  fileContextMenu: { x: number; y: number; filename: string; isFolder: boolean } | null;
  setFileContextMenu: (v: { x: number; y: number; filename: string; isFolder: boolean } | null) => void;

  // ── Layout state ──
  borderColor: string;
  panelBg: string;
  terminalVisible: boolean;

  // ── Quick Actions state ──
  setQuickActionsContext: (ctx: QAContext | null) => void;
  setQuickActionsPos: (pos: { x: number; y: number }) => void;
  setQuickActionsVisible: (v: boolean) => void;
}

const IDELayoutContext = createContext<IDELayoutContextValue | null>(null);

/** Provider wrapper */
export const IDELayoutProvider = IDELayoutContext.Provider;

/** Hook — throws if used outside provider */
export function useIDELayout(): IDELayoutContextValue {
  const ctx = useContext(IDELayoutContext);
  if (!ctx) throw new Error("useIDELayout must be used inside <IDELayoutProvider>");
  return ctx;
}
