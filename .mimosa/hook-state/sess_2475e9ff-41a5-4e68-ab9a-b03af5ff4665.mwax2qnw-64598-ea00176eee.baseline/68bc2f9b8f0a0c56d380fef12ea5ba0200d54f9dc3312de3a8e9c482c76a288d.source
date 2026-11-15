/**
 * @file IDECodeEditorPanel.tsx
 * @description Code editor panel — Monaco editor + split + inline preview
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.2
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,editor,code,ui,component
 * @license MIT
 */

import { Eye, Code2, Columns2 } from "lucide-react";
import { CyberTooltip } from "../CyberTooltip";
import { CyberEditor } from "../CyberEditor";
import { EditorTabBar } from "../EditorTabBar";
import { LivePreview } from "../LivePreview";
import { useI18n } from "../../i18n/context";
import { useThemeStore } from "../../store/theme-store";
import { useIDEStore } from "../../store/ide-store";
import { useCollabStore } from "../../store/collab-store";
import { usePreviewStore } from "../../store/preview-store";
import { useIDELayout } from "./IDELayoutContext";

/** Code editor body — reads shared state from IDELayoutContext + Zustand stores */
export function IDECodeEditorPanel() {
  const { t } = useI18n();
  const { tokens } = useThemeStore();
  const ideStore = useIDEStore();
  const collab = useCollabStore();
  const previewState = usePreviewStore();
  const {
    editorCode, setEditorCode, editorDirty, setEditorDirty,
    selectedFile, fileContentMap, setFileContentMap,
    cyberEditorRef, terminalVisible,
    setQuickActionsContext, setQuickActionsPos, setQuickActionsVisible,
  } = useIDELayout();

  return (
    <>
      {/* Tab Bar + Split controls */}
      <div className="flex items-center shrink-0" style={{ background: tokens.backgroundAlt }}>
        <div className="flex-1 overflow-hidden"><EditorTabBar /></div>
        <CyberTooltip label={t("ide", "inlinePreview")} position="left">
          <button className="p-1.5 rounded transition-all hover:opacity-80"
            style={{ color: previewState.inlinePreviewVisible ? tokens.primary : tokens.foregroundMuted, background: previewState.inlinePreviewVisible ? tokens.primaryGlow : "transparent", border: `1px solid ${previewState.inlinePreviewVisible ? tokens.primary + "44" : tokens.borderDim}` }}
            onClick={() => previewState.toggleInlinePreview()}>
            <Eye size={12} />
          </button>
        </CyberTooltip>
        <CyberTooltip label={t("ide", "splitEditor")} position="left">
          <button className="p-1.5 mx-1 rounded transition-all hover:opacity-80"
            style={{ color: ideStore.splitDirection !== "none" ? tokens.primary : tokens.foregroundMuted, background: ideStore.splitDirection !== "none" ? tokens.primaryGlow : "transparent", border: `1px solid ${ideStore.splitDirection !== "none" ? tokens.primary + "44" : tokens.borderDim}` }}
            onClick={() => ideStore.toggleSplit()}>
            <Columns2 size={12} />
          </button>
        </CyberTooltip>
      </div>
      {/* Code area */}
      <div className="flex-1 overflow-hidden flex"
        style={{ flexDirection: ideStore.splitDirection === "vertical" ? "column" : "row", paddingBottom: terminalVisible ? 0 : undefined }}>
        <div className="flex-1 overflow-hidden flex flex-col" style={{ flex: ideStore.splitDirection !== "none" ? `0 0 ${ideStore.splitRatio}%` : undefined }}>
          <CyberEditor ref={cyberEditorRef} code={editorCode} fileName={selectedFile}
            onChange={(val) => { setEditorCode(val); setEditorDirty(true); setFileContentMap((prev) => ({ ...prev, [selectedFile]: val })); ideStore.markTabModified(selectedFile, true); }}
            onSelectionChange={(sel) => {
              if (sel && sel.text.trim().length > 2) {
                setQuickActionsContext({ selection: sel.text, language: selectedFile.split('.').pop(), filePath: selectedFile, fullContent: editorCode });
                setQuickActionsPos({ x: Math.min(window.innerWidth - 350, 300), y: 120 });
                setQuickActionsVisible(true);
              } else {
                setTimeout(() => { if (!document.getSelection()?.toString()?.trim()) { setQuickActionsVisible(false); } }, 200);
              }
            }} />
        </div>
        {ideStore.splitDirection !== "none" && (
          <>
            <div className="shrink-0 flex items-center justify-center cursor-col-resize group"
              style={{ width: ideStore.splitDirection === "horizontal" ? 4 : undefined, height: ideStore.splitDirection === "vertical" ? 4 : undefined, background: "transparent" }}>
              <div className="rounded-full transition-all" style={{ width: ideStore.splitDirection === "horizontal" ? 2 : 24, height: ideStore.splitDirection === "horizontal" ? 24 : 2, background: tokens.border }} />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-2 py-1 border-b shrink-0 flex items-center gap-1.5" style={{ borderColor: tokens.borderDim, background: tokens.backgroundAlt }}>
                <Code2 size={9} color={tokens.foregroundMuted} />
                <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>{ideStore.splitActiveFile || selectedFile}</span>
              </div>
              <CyberEditor code={fileContentMap[ideStore.splitActiveFile || selectedFile] || `// ${ideStore.splitActiveFile || selectedFile}`}
                fileName={ideStore.splitActiveFile || selectedFile}
                onChange={(val) => { const f = ideStore.splitActiveFile || selectedFile; setFileContentMap((prev) => ({ ...prev, [f]: val })); ideStore.markTabModified(f, true); }} />
            </div>
          </>
        )}
      </div>
      {/* Inline Preview Panel */}
      {previewState.inlinePreviewVisible && (
        <>
          <div className="shrink-0 flex items-center justify-center cursor-row-resize group" style={{ height: 5, background: "transparent" }}
            onMouseDown={(e) => {
              e.preventDefault(); const startY = e.clientY; const startH = previewState.inlinePreviewHeight;
              const onMove = (ev: MouseEvent) => { previewState.setInlinePreviewHeight(startH + (startY - ev.clientY)); };
              const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
              window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
            }}>
            <div className="rounded-full transition-all group-hover:w-16" style={{ width: 24, height: 2, background: tokens.border }} />
          </div>
          <div className="shrink-0 overflow-hidden border-t" style={{ height: previewState.inlinePreviewHeight, borderColor: tokens.borderDim }}>
            <LivePreview code={editorCode} fileName={selectedFile} onScrollSync={() => {}} />
          </div>
        </>
      )}
      {/* Modified / Collab status bar */}
      {(editorDirty || collab.enabled) && (
        <div className="px-3 py-1 border-t shrink-0 flex items-center gap-2" style={{ borderColor: tokens.borderDim }}>
          {editorDirty && <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.warning, letterSpacing: "1px" }}>● MODIFIED</span>}
          {collab.enabled && <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.foregroundMuted, letterSpacing: "1px" }}>CRDT:{collab.syncStatus.toUpperCase()} · {collab.users.length} {t("ide", "usersLabel")}</span>}
        </div>
      )}
    </>
  );
}
