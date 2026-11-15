/**
 * @file IDEMode.tsx
 * @description IDE模式组件，提供IDE模式切换
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,mode,ui,component
 */

import {
    Clock,
    Code2,
    Eye,
    FolderOpen, MessageSquare,
    Plus,
    Terminal as TerminalIcon,
    Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n/context";
import { gitEngine } from "../services/git-service";
import type { FileNode } from "../types";
import { activityBus } from "../store/activity-store";
import { useCollabStore } from "../store/collab-store";
import { cryptoStoreActions } from "../store/crypto-store";
import { dbStore as dbStoreActions } from "../store/db-store";
import { fileStore as fileStoreActions, useFileStore } from "../store/file-store";
import { LAYOUT_PRESETS, useIDEStore } from "../store/ide-store";
import { useModelStore } from "../store/model-store";
import { offlineStoreActions } from "../store/offline-store";
import { PANEL_CONTENT_MAP, usePanelDnD, type PanelContentType } from "../store/panel-dnd-store";
import { pluginStoreActions } from "../store/plugin-store";
import { useProjectStore } from "../store/project-store";
import { type ActionContext as QAContext } from "../store/quick-actions-store";
import { useThemeStore } from "../store/theme-store";
import type { AIContext } from "./AIAssistPanel";
import type { GeneratedFile } from "./CodeGenPanel";
import { type CyberEditorHandle } from "./CyberEditor";
import { cyberToast } from "./CyberToast";
import { CyberTooltip } from "./CyberTooltip";
import { DetachedWindowLayer } from "./DetachedWindow";
import { filterFileTree } from "./ide/FileTreeNode";
import { IDETerminal } from "./ide/IDETerminal";
import { IDEHeader } from "./IDEHeader";
import { IDELeftPanel } from "./IDELeftPanel";
import { IDEStatusBar } from "./IDEStatusBar";
import { LivePreview } from "./LivePreview";
import { PanelDropZone } from "./PanelDropZone";
import { PreviewEngine } from "./PreviewEngine";
import { QuickActionsPanel } from "./QuickActionsPanel";

// ── Extracted hooks ──
import { useAutoSave } from "./ide/useAutoSave";
import { useIDEKeyboard } from "./ide/useIDEKeyboard";
import { useIDEPanelResize } from "./ide/useIDEPanelResize";
import { EVENT_TO_PANEL_KEY, useOverlayPanels } from "./ide/useOverlayPanels";

// ── Extracted sub-components ──
import { IDEChatPanel } from "./ide/IDEChatPanel";
import { IDECodeEditorPanel } from "./ide/IDECodeEditorPanel";
import { IDEFileExplorer } from "./ide/IDEFileExplorer";
import { IDELayoutProvider } from "./ide/IDELayoutContext";
import { IDEOverlays } from "./ide/IDEOverlays";

// ── Mock data（仅当工作区无 Git 仓库时的降级树） ──
import { MOCK_FILE_TREE as IMPORTED_MOCK_FILE_TREE, SAMPLE_CODE as IMPORTED_SAMPLE_CODE } from "./ide/ide-mock-data";
const MOCK_FILE_TREE = IMPORTED_MOCK_FILE_TREE;
const SAMPLE_CODE = IMPORTED_SAMPLE_CODE;

/** 扁平路径 → FileNode 树（真实工作区文件树构建） */
function buildTreeFromPaths(paths: string[]): FileNode[] {
  const root: FileNode = { name: "/", type: "folder", children: [] };
  for (const p of paths) {
    const segs = p.split("/").filter(Boolean);
    let cur = root;
    segs.forEach((seg, i) => {
      const isFile = i === segs.length - 1;
      let next = cur.children?.find((c) => c.name === seg && (isFile ? c.type === "file" : c.type === "folder"));
      if (!next) {
        next = isFile
          ? { name: seg, type: "file", ext: seg.includes(".") ? seg.split(".").pop() : undefined }
          : { name: seg, type: "folder", children: [] };
        cur.children!.push(next);
      }
      cur = next;
    });
  }
  const sortTree = (nodes: FileNode[]): FileNode[] =>
    nodes
      .map((n) => (n.children ? { ...n, children: sortTree(n.children) } : n))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1));
  return sortTree(root.children ?? []);
}

// ===== Main IDEMode =====
export function IDEMode({ onSwitchMode, onOpenSettings, onOpenNotifications, onOpenCommandPalette, onOpenGlobalSearch, onOpenAudioPanel }: {
  onSwitchMode: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenAudioPanel?: () => void;
}) {
  const { t } = useI18n();
  const { openModelSettings } = useModelStore();
  const { tokens, isCyberpunk } = useThemeStore();
  const ideStore = useIDEStore();
  const projectStore = useProjectStore();
  const collab = useCollabStore();
  const panelDnD = usePanelDnD();
  useFileStore();

  // ── Consolidated overlay panels ──
  const overlayPanels = useOverlayPanels();
  const [fileContextMenu, setFileContextMenu] = useState<{ x: number; y: number; filename: string; isFolder: boolean } | null>(null);

  // ── Quick Actions ──
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [quickActionsPos, setQuickActionsPos] = useState({ x: 200, y: 200 });
  const [quickActionsContext, setQuickActionsContext] = useState<QAContext | null>(null);

  // ── View / layout state ──
  const [viewMode, setViewMode] = useState<"edit" | "preview">(ideStore.layoutMode);
  const [fullscreenPreview, setFullscreenPreview] = useState(ideStore.fullscreenPreview);

  // ── Terminal ──
  const [terminalVisible, setTerminalVisible] = useState(ideStore.terminalVisible);
  const [terminalExpanded, setTerminalExpanded] = useState(ideStore.terminalExpanded ?? false);

  // ── Panel resize hook ──
  const resize = useIDEPanelResize({
    initialLeftWidth: ideStore.leftWidthPercent,
    initialMiddleRatio: ideStore.middleRatioPercent,
    initialTerminalHeight: ideStore.terminalHeight,
  });

  // ── Keyboard shortcuts hook ──
  useIDEKeyboard({
    onSwitchMode,
    fullscreenPreview,
    setFullscreenPreview,
    setViewMode,
    setTerminalVisible,
    setTerminalExpanded,
    onOpenGlobalSearch,
  });

  // ── Editor / file state (shared via context) ──
  const [selectedFile, setSelectedFileRaw] = useState("IDEMode.tsx");
  const [searchQuery, setSearchQuery] = useState("");
  const setSelectedFile = useCallback((filename: string) => {
    setSelectedFileRaw(filename);
    ideStore.openTab(filename);
    fileStoreActions.recordAccess(filename);
  }, [ideStore]);

  const [editorCode, setEditorCode] = useState(SAMPLE_CODE);
  const [editorDirty, setEditorDirty] = useState(false);
  const cyberEditorRef = useRef<CyberEditorHandle>(null);
  const [fileContentMap, setFileContentMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("yyc3_file_content_map");
      if (saved) { const parsed = JSON.parse(saved); if (typeof parsed === "object" && parsed !== null && Object.keys(parsed).length > 0) return parsed; }
    } catch { /* ignore */ }
    return { "IDEMode.tsx": SAMPLE_CODE };
  });
  const [previewFiles, setPreviewFiles] = useState<GeneratedFile[]>([]);
  const [previewVersion, setPreviewVersion] = useState(0);

  // ── AutoSave hook ──
  const { lastAutoSave } = useAutoSave({
    fileContentMap, editorDirty, setEditorDirty, selectedFile, editorCode,
  });

  // ── 真实工作区联动：存在 Git 仓库时用 LightningFS 文件树取代 mock 树，
  //     文件内容以工作区为准水合（编辑器/终端/Git 三方同源）──
  const [workspaceTree, setWorkspaceTree] = useState<ReturnType<typeof buildTreeFromPaths> | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await gitEngine.isRepo())) return;
      const files = await gitEngine.listFiles();
      if (!files.length || cancelled) return;
      const contents: Record<string, string> = {};
      for (const f of files) {
        try { contents[f] = await gitEngine.readFile(f); } catch { /* 跳过不可读 */ }
      }
      if (cancelled) return;
      setWorkspaceTree(buildTreeFromPaths(files));
      setFileContentMap(contents);
      if (!files.includes(selectedFile) && files.length) setSelectedFile(files[0]);
    })().catch(() => { /* 无仓库保持 mock 树 */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived data ─
  const activeFileTree = useMemo(() => {
    if (workspaceTree) return workspaceTree;
    const proj = projectStore.getActiveProject();
    return proj?.fileTree ?? MOCK_FILE_TREE;
  }, [projectStore, workspaceTree]);

  const filteredFileTree = useMemo(() => filterFileTree(activeFileTree, searchQuery), [activeFileTree, searchQuery]);
  const borderColor = tokens.border;
  const panelBg = tokens.panelBg;

  const activeDesignJson = useMemo(() => {
    const proj = projectStore.getActiveProject();
    return proj?.designJson ?? null;
  }, [projectStore]);

  const aiContext: AIContext = useMemo(() => ({
    selectedFile, currentCode: editorCode,
    designJsonSummary: JSON.stringify({ version: "4.8.0", panels: activeDesignJson?.panels?.length ?? 0, components: activeDesignJson?.components?.length ?? 0 }),
    recentActions: ["file:select", "code:view", "terminal:execute"],
  }), [selectedFile, editorCode, activeDesignJson]);

  // ── Icon map for dynamic slot headers ──
  const SLOT_ICON_MAP = useMemo<Record<PanelContentType, React.ElementType>>(() => ({
    'ai-chat': MessageSquare, 'file-explorer': FolderOpen, 'code-editor': Code2,
    'preview': Eye, 'terminal': TerminalIcon,
  }), []);

  // ===== Effects =====

  // Sync tab → selectedFile
  useEffect(() => {
    if (ideStore.activeTabId && ideStore.activeTabId !== selectedFile) {
      queueMicrotask(() => setSelectedFileRaw(ideStore.activeTabId))
    }
  }, [ideStore.activeTabId, selectedFile])

  // Sync file content when switching files
  useEffect(() => {
    if (fileContentMap[selectedFile]) {
      queueMicrotask(() => {
        setEditorCode(fileContentMap[selectedFile])
        setEditorDirty(false)
      })
    } else {
      const ext = selectedFile.split(".").pop() || ""
      const placeholder = ext === "json" ? `{\n  "name": "${selectedFile}",\n  "version": "1.0.0"\n}`
        : ext === "css" ? `/* ${selectedFile} */\n:root {\n  --color-primary: var(--yyc3-primary);\n}`
          : `// ${selectedFile}\n\nexport default function ${selectedFile.replace(/\.[^.]+$/, "")}() {\n  return null\n}`
      queueMicrotask(() => {
        setEditorCode(placeholder)
        setEditorDirty(false)
      })
    }
    activityBus.push("file", `Opened ${selectedFile}`, `打开了 ${selectedFile}`, selectedFile)
  }, [selectedFile, fileContentMap])

  // Panel-open events (yyc3:open-panel custom event)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      const panelKey = EVENT_TO_PANEL_KEY[detail];
      if (panelKey) { overlayPanels.show(panelKey); return; }
      // External store panels
      const storeMap: Record<string, () => void> = {
        database: () => dbStoreActions.openPanel(),
        plugins: () => pluginStoreActions.openPanel(),
        security: () => cryptoStoreActions.openPanel(),
        offline: () => offlineStoreActions.openPanel(),
      };
      storeMap[detail]?.();
    };
    window.addEventListener("yyc3:open-panel", handler);
    return () => window.removeEventListener("yyc3:open-panel", handler);
  }, [overlayPanels]);

  const { setLayoutMode: syncLayoutMode, setFullscreenPreview: syncFullscreenPreview, setLeftWidth: syncLeftWidth, setMiddleRatio: syncMiddleRatio, setTerminalVisible: syncTerminalVisible, setTerminalHeight: syncTerminalHeight } = ideStore;

  // Sync state → Zustand (actions are stable module-level refs)
  useEffect(() => { syncLayoutMode(viewMode); }, [viewMode, syncLayoutMode]);
  useEffect(() => { syncFullscreenPreview(fullscreenPreview); }, [fullscreenPreview, syncFullscreenPreview]);
  useEffect(() => { syncLeftWidth(resize.leftWidth); }, [resize.leftWidth, syncLeftWidth]);
  useEffect(() => { syncMiddleRatio(resize.middleRatio); }, [resize.middleRatio, syncMiddleRatio]);
  useEffect(() => { syncTerminalVisible(terminalVisible); }, [terminalVisible, syncTerminalVisible]);
  useEffect(() => { syncTerminalHeight(resize.terminalHeight); }, [resize.terminalHeight, syncTerminalHeight]);

  // ===== Callbacks =====

  const handleAIApplyCode = useCallback((code: string, title: string) => {
    const header = `// ===== AI Suggestion Applied: ${title} =====`;
    const newCode = `${header}\n${code}\n\n// ===== End AI Suggestion =====\n\n${editorCode}`;
    setEditorCode(newCode); setEditorDirty(true);
    setFileContentMap((prev) => ({ ...prev, [selectedFile]: newCode }));
    cyberToast(`${t("ide", "savedAt")} — ${selectedFile}`);
    activityBus.push("ai", `AI code applied: ${title}`, `AI 代码已应用: ${title}`, selectedFile);
  }, [editorCode, selectedFile, t]);

  const handleSnippetInsert = useCallback((snippetCode: string) => {
    if (cyberEditorRef.current) { cyberEditorRef.current.insertAtCursor(snippetCode); }
    else {
      const newCode = editorCode + "\n" + snippetCode;
      setEditorCode(newCode); setEditorDirty(true);
      setFileContentMap((prev) => ({ ...prev, [selectedFile]: newCode }));
    }
  }, [editorCode, selectedFile]);

  const handleCodeGenerated = useCallback((files: GeneratedFile[]) => {
    setPreviewFiles(files); setPreviewVersion((v) => v + 1);
    const newMap: Record<string, string> = {};
    files.forEach((f) => { newMap[f.fileName] = f.content; });
    setFileContentMap((prev) => ({ ...prev, ...newMap }));
  }, []);

  // ===== Slot renderers =====

  const renderSlotHeaderContent = useCallback((contentType: PanelContentType) => {
    const cfg = PANEL_CONTENT_MAP[contentType];
    const IconComp = SLOT_ICON_MAP[contentType];
    return (<><IconComp size={13} color={tokens.primary} /><span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, letterSpacing: "1px" }}>{t("ide", cfg.labelKey)}</span></>);
  }, [tokens, t, SLOT_ICON_MAP]);

  const renderSlotHeaderExtra = useCallback((contentType: PanelContentType) => {
    if (contentType === 'ai-chat') return (
      <div className="ml-auto flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.success, boxShadow: isCyberpunk ? `0 0 4px ${tokens.success}` : "none" }} />
        <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.success }}>{t("common", "active")}</span>
      </div>
    );
    if (contentType === 'file-explorer') return (
      <div className="ml-auto flex items-center gap-1">
        <CyberTooltip label={t("ide", "recentFilesBtn")}><button aria-label={t("ide", "recentFilesBtn")} className="p-0.5 rounded hover:bg-white/10 transition-all" onClick={() => fileStoreActions.toggleRecentPanel()}><Clock size={10} color={tokens.primaryDim} /></button></CyberTooltip>
        <CyberTooltip label={t("ide", "newFileBtn")}><button aria-label={t("ide", "newFileBtn")} className="p-0.5 rounded hover:bg-white/10 transition-all"
          onClick={() => { const name = prompt(t("ide", "newFilePrompt")); if (name) { fileStoreActions.recordOperation("create", name, `Created ${name}`); setSelectedFile(name); cyberToast(`${t("ide", "created")} ${name}`); } }}><Plus size={10} color={tokens.primaryDim} /></button></CyberTooltip>
      </div>
    );
    return null;
  }, [tokens, isCyberpunk, t, setSelectedFile]);

  const renderSlotBody = useCallback((contentType: PanelContentType) => (
    <AnimatePresence mode="wait">
      <motion.div key={contentType} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col flex-1 overflow-hidden">
        {contentType === 'ai-chat' && <IDEChatPanel />}
        {contentType === 'file-explorer' && <IDEFileExplorer />}
        {contentType === 'code-editor' && <IDECodeEditorPanel />}
        {contentType === 'preview' && (
          <div className="flex-1 overflow-auto neon-scrollbar">
            {previewFiles.length > 0 ? <PreviewEngine files={previewFiles} version={previewVersion} isFullscreen={false} /> : <LivePreview code={editorCode} fileName={selectedFile} onScrollSync={() => { }} />}
          </div>
        )}
        {contentType === 'terminal' && (
          <div className="flex-1 flex items-center justify-center" style={{ color: tokens.foregroundMuted }}>
            <span style={{ fontFamily: tokens.fontMono, fontSize: "10px" }}>{t("ide", "terminal")}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  ), [previewFiles, previewVersion, editorCode, selectedFile, tokens, t]);

  // ===== Context value =====
  const layoutCtx = useMemo(() => ({
    selectedFile, setSelectedFile, editorCode, setEditorCode, editorDirty, setEditorDirty,
    fileContentMap, setFileContentMap, cyberEditorRef,
    searchQuery, setSearchQuery, filteredFileTree, fileContextMenu, setFileContextMenu,
    borderColor, panelBg, terminalVisible,
    setQuickActionsContext, setQuickActionsPos, setQuickActionsVisible,
  }), [selectedFile, setSelectedFile, editorCode, editorDirty, fileContentMap, searchQuery, filteredFileTree, fileContextMenu, borderColor, panelBg, terminalVisible]);

  // ===== Render =====
  return (
    <IDELayoutProvider value={layoutCtx}>
      <div className="flex flex-col w-full h-screen" style={{ position: "relative", zIndex: 10 }}>
        {/* ========== TOP NAV BAR + SECOND TOOLBAR ========== */}
        <IDEHeader
          viewMode={viewMode} setViewMode={setViewMode}
          fullscreenPreview={fullscreenPreview} setFullscreenPreview={setFullscreenPreview}
          terminalVisible={terminalVisible} setTerminalVisible={setTerminalVisible} setTerminalExpanded={setTerminalExpanded}
          openModelSettings={openModelSettings}
          overlayPanels={overlayPanels}
          onSwitchMode={onSwitchMode} onOpenSettings={onOpenSettings} onOpenNotifications={onOpenNotifications}
          onOpenCommandPalette={onOpenCommandPalette} onOpenGlobalSearch={onOpenGlobalSearch} onOpenAudioPanel={onOpenAudioPanel}
          projectStoreOpenModal={() => projectStore.openModal()}
          dbStoreOpenPanel={() => dbStoreActions.openPanel()}
          pluginStoreOpenPanel={() => pluginStoreActions.openPanel()}
          cryptoStoreOpenPanel={() => cryptoStoreActions.openPanel()}
        />

        {/* ========== MAIN THREE-COLUMN AREA ========== */}
        <div className="flex flex-1 overflow-hidden">
          {/* ===== LEFT COLUMN ===== */}
          <div className="flex flex-col border-r shrink-0 overflow-hidden"
            style={{ width: fullscreenPreview ? 0 : `${resize.leftWidth}%`, minWidth: fullscreenPreview ? 0 : undefined, background: panelBg, borderColor, transition: "width 0.3s cubic-bezier(0.22, 1, 0.36, 1)", opacity: fullscreenPreview ? 0 : 1, pointerEvents: fullscreenPreview ? "none" : "auto" }}>
            <IDELeftPanel
              renderFileExplorer={() => (<><PanelDropZone slot="left">{renderSlotHeaderContent('file-explorer')}{renderSlotHeaderExtra('file-explorer')}</PanelDropZone><IDEFileExplorer /></>)}
              renderAIChat={() => (<><PanelDropZone slot="left">{renderSlotHeaderContent('ai-chat')}{renderSlotHeaderExtra('ai-chat')}</PanelDropZone><IDEChatPanel /></>)}
              defaultTab={panelDnD.slotContent.left === 'ai-chat' ? 'ai-assistant' : 'file-explorer'}
            />
          </div>

          {/* ===== LEFT RESIZE HANDLE ===== */}
          {!fullscreenPreview && (
            <div className="shrink-0 flex items-center justify-center cursor-col-resize group" style={{ width: 5, background: "transparent", zIndex: 15 }} onMouseDown={(e) => resize.startPanelDrag("left", e)}>
              <div className="rounded-full transition-all group-hover:h-12" style={{ width: resize.isDraggingPanel ? 3 : 2, height: resize.isDraggingPanel ? "100%" : 32, background: resize.isDraggingPanel ? tokens.primary : tokens.border, boxShadow: resize.isDraggingPanel ? `0 0 6px ${tokens.primary}66` : "none", transition: "background 0.15s, box-shadow 0.15s, width 0.15s" }} />
            </div>
          )}

          {/* ===== MIDDLE + RIGHT AREA ===== */}
          <div className="flex flex-1 overflow-hidden" style={{ position: "relative" }}>
            {viewMode === "edit" ? (
              <>
                {/* MIDDLE COLUMN */}
                <div className="flex flex-col border-r overflow-hidden" style={{ width: `${resize.middleRatio}%`, borderColor }}>
                  <PanelDropZone slot="center">{renderSlotHeaderContent(panelDnD.slotContent.center)}{renderSlotHeaderExtra(panelDnD.slotContent.center)}</PanelDropZone>
                  {renderSlotBody(panelDnD.slotContent.center)}
                </div>
                {/* MIDDLE-RIGHT RESIZE */}
                <div className="shrink-0 flex items-center justify-center cursor-col-resize group" style={{ width: 5, background: "transparent", zIndex: 15 }} onMouseDown={(e) => resize.startPanelDrag("middle", e)}>
                  <div className="rounded-full transition-all group-hover:h-12" style={{ width: resize.isDraggingPanel ? 3 : 2, height: resize.isDraggingPanel ? "100%" : 32, background: resize.isDraggingPanel ? tokens.primary : tokens.border, boxShadow: resize.isDraggingPanel ? `0 0 6px ${tokens.primary}66` : "none", transition: "background 0.15s, box-shadow 0.15s, width 0.15s" }} />
                </div>
                {/* RIGHT COLUMN */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  <PanelDropZone slot="right">{renderSlotHeaderContent(panelDnD.slotContent.right)}{renderSlotHeaderExtra(panelDnD.slotContent.right)}</PanelDropZone>
                  {renderSlotBody(panelDnD.slotContent.right)}
                </div>
              </>
            ) : (
              /* PREVIEW MODE */
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ borderColor }}>
                  <Eye size={13} color={tokens.primary} />
                  <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, letterSpacing: "1px" }}>{t("ide", "preview")}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {previewFiles.length > 0 && <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.success, letterSpacing: "1px" }}>v{previewVersion} · {previewFiles.length} {t("ide", "componentsLabel")}</span>}
                    {collab.enabled && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.borderDim}` }}>
                        <Users size={8} color={tokens.primary} style={{ opacity: 0.5 }} />
                        <span style={{ fontFamily: tokens.fontMono, fontSize: "7px", color: tokens.primaryDim }}>{collab.users.length} {t("ide", "onlineLabel")}</span>
                      </div>
                    )}
                    <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>{t("ide", "previewMode")}</span>
                  </div>
                </div>
                <div className="flex-1 overflow-auto neon-scrollbar"
                  onDoubleClick={() => { if (fullscreenPreview) { setFullscreenPreview(false); setViewMode("edit"); } }}
                  style={{ cursor: fullscreenPreview ? "pointer" : undefined }}>
                  {previewFiles.length > 0
                    ? <PreviewEngine files={previewFiles} version={previewVersion} isFullscreen={fullscreenPreview} onDoubleClickRestore={fullscreenPreview ? () => { setFullscreenPreview(false); setViewMode("edit"); } : undefined} />
                    : <LivePreview code={editorCode} fileName={selectedFile} isExpanded={fullscreenPreview} onToggleExpand={() => { if (fullscreenPreview) { setFullscreenPreview(false); setViewMode("edit"); } else { setFullscreenPreview(true); } }} />
                  }
                </div>
              </div>
            )}

            {/* TERMINAL */}
            {terminalVisible && (
              <IDETerminal terminalHeight={resize.terminalHeight} terminalExpanded={terminalExpanded} middleRatio={resize.middleRatio} viewMode={viewMode}
                onClose={() => setTerminalVisible(false)} onSetExpanded={setTerminalExpanded} onSetHeight={resize.setTerminalHeight} onStartResize={resize.startTerminalResize} />
            )}
          </div>
        </div>

        {/* ========== STATUS BAR ========== */}
        <IDEStatusBar selectedFile={selectedFile} viewMode={viewMode} fullscreenPreview={fullscreenPreview} lastAutoSave={lastAutoSave}
          onApplyPreset={(presetId) => {
            ideStore.applyPreset(presetId);
            const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
            if (preset) { resize.setLeftWidth(preset.leftCollapsed ? 0 : preset.leftWidthPercent); resize.setMiddleRatio(preset.middleRatioPercent); setTerminalVisible(preset.terminalVisible); if (!preset.terminalVisible) setTerminalExpanded(false); }
          }}
        />

        {/* ========== DETACHED WINDOWS ========== */}
        <DetachedWindowLayer renderContent={(ct) => renderSlotBody(ct)} />

        {/* ========== QUICK ACTIONS ========== */}
        <QuickActionsPanel context={quickActionsContext} position={quickActionsPos} visible={quickActionsVisible} onClose={() => setQuickActionsVisible(false)}
          onApplyResult={(result, _action) => { if (cyberEditorRef.current) { cyberEditorRef.current.replaceSelection(result); setEditorDirty(true); } }} />

        {/* ========== ALL OVERLAY PANELS ========== */}
        <IDEOverlays
          panels={overlayPanels.panels} hide={overlayPanels.hide}
          aiContext={aiContext} activeDesignJson={activeDesignJson}
          editorCode={editorCode} selectedFile={selectedFile}
          onApplyCode={handleAIApplyCode} onCodeGenerated={handleCodeGenerated}
          onSnippetInsert={handleSnippetInsert}
          onRollback={(content) => { setEditorCode(content); setEditorDirty(false); }}
          onOpenFile={setSelectedFile}
          fileContextMenu={fileContextMenu} setFileContextMenu={() => setFileContextMenu(null)}
        />
      </div>
    </IDELayoutProvider>
  );
}
