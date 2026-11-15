/**
 * @file IDEOverlays.tsx
 * @description All lazy-loaded modal/overlay panels — code-split via React.lazy
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.2
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,overlay,ui,component
 * @license MIT
 */

import { lazy, Suspense } from "react";
import { ProjectCreateModal } from "../ProjectCreateModal";
import { FileContextMenu } from "../FileContextMenu";
import { VersionHistoryPanel } from "../VersionHistoryPanel";
import { RecentFilesPanel } from "../RecentFilesPanel";
import { DatabasePanel } from "../DatabasePanel";
import { SystemPanel } from "../SystemPanel";
import { useI18n } from "../../i18n/context";
import { fileStore as fileStoreActions } from "../../store/file-store";
import { ideStore as ideStoreDirect } from "../../store/ide-store";
import { cyberToast } from "../CyberToast";
import type { AIContext } from "../AIAssistPanel";
import type { GeneratedFile } from "../CodeGenPanel";
import type { DesignRoot } from "../../types";

import type { OverlayPanelState, OverlayPanelKey } from "./useOverlayPanels";

// ===== React.lazy imports =====
const AIAssistPanel = lazy(() => import("../AIAssistPanel").then(m => ({ default: m.AIAssistPanel })));
const CodeGenPanel = lazy(() => import("../CodeGenPanel").then(m => ({ default: m.CodeGenPanel })));
const CollabPanel = lazy(() => import("../CollabPanel").then(m => ({ default: m.CollabPanel })));
const GitPanel = lazy(() => import("../GitPanel").then(m => ({ default: m.GitPanel })));
const PerformanceDashboard = lazy(() => import("../PerformanceDashboard").then(m => ({ default: m.PerformanceDashboard })));
const DiagnosticsPanel = lazy(() => import("../DiagnosticsPanel").then(m => ({ default: m.DiagnosticsPanel })));
const TaskBoard = lazy(() => import("../TaskBoard").then(m => ({ default: m.TaskBoard })));
const SnippetManager = lazy(() => import("../SnippetManager").then(m => ({ default: m.SnippetManager })));
const ActivityLog = lazy(() => import("../ActivityLog").then(m => ({ default: m.ActivityLog })));
const MultiInstancePanel = lazy(() => import("../MultiInstancePanel").then(m => ({ default: m.MultiInstancePanel })));

export interface IDEOverlaysProps {
  /** Consolidated panel visibility */
  panels: OverlayPanelState;
  /** Hide a specific panel */
  hide: (key: OverlayPanelKey) => void;
  // Data
  aiContext: AIContext;
  activeDesignJson: DesignRoot | null;
  editorCode: string;
  selectedFile: string;
  // Callbacks
  onApplyCode: (code: string, title: string) => void;
  onCodeGenerated: (files: GeneratedFile[]) => void;
  onSnippetInsert: (code: string) => void;
  onRollback: (content: string) => void;
  onOpenFile: (f: string) => void;
  // File context menu
  fileContextMenu: { x: number; y: number; filename: string; isFolder: boolean } | null;
  setFileContextMenu: (v: null) => void;
}

/** All modal overlays extracted from IDEMode — reduces main component by ~130 lines */
export function IDEOverlays(props: IDEOverlaysProps) {
  const { t } = useI18n();
  const { panels, hide } = props;

  return (
    <>
      <ProjectCreateModal />

      <Suspense fallback={null}>
        <AIAssistPanel visible={panels.aiAssist} onClose={() => hide("aiAssist")}
          context={props.aiContext} onApplyCode={props.onApplyCode} />
      </Suspense>
      <Suspense fallback={null}>
        <CodeGenPanel visible={panels.codeGen} onClose={() => hide("codeGen")}
          designJson={props.activeDesignJson} onCodeGenerated={props.onCodeGenerated} />
      </Suspense>
      <Suspense fallback={null}>
        <CollabPanel visible={panels.collabPanel} onClose={() => hide("collabPanel")} />
      </Suspense>
      <Suspense fallback={null}>
        <GitPanel visible={panels.gitPanel} onClose={() => hide("gitPanel")} />
      </Suspense>
      <Suspense fallback={null}>
        <PerformanceDashboard visible={panels.perfDash} onClose={() => hide("perfDash")} />
      </Suspense>
      <Suspense fallback={null}>
        <DiagnosticsPanel visible={panels.diagPanel} onClose={() => hide("diagPanel")} />
      </Suspense>
      <Suspense fallback={null}>
        <TaskBoard visible={panels.taskBoard} onClose={() => hide("taskBoard")} />
      </Suspense>
      <Suspense fallback={null}>
        <SnippetManager visible={panels.snippetMgr} onClose={() => hide("snippetMgr")}
          onInsertSnippet={props.onSnippetInsert} />
      </Suspense>
      <Suspense fallback={null}>
        <ActivityLog visible={panels.activityLog} onClose={() => hide("activityLog")} />
      </Suspense>
      <Suspense fallback={null}>
        <MultiInstancePanel visible={panels.multiInstance} onClose={() => hide("multiInstance")} />
      </Suspense>

      {/* File context menu */}
      {props.fileContextMenu && (
        <FileContextMenu
          x={props.fileContextMenu.x}
          y={props.fileContextMenu.y}
          filename={props.fileContextMenu.filename}
          isFolder={props.fileContextMenu.isFolder}
          onClose={() => props.setFileContextMenu(null)}
          onOpen={(f) => props.onOpenFile(f)}
          onRename={(f) => {
            const newName = prompt(`${t("ide", "renamePrompt")} "${f}":`, f);
            if (newName && newName !== f) {
              fileStoreActions.recordOperation('rename', newName, `${f} → ${newName}`, f);
              cyberToast(`${t("ide", "renamed")} ${newName}`);
            }
          }}
          onDelete={(f) => {
            if (confirm(`${t("ide", "deleteConfirm")} "${f}"?`)) {
              fileStoreActions.recordOperation('delete', f, `Deleted ${f}`);
              cyberToast(`${t("ide", "deleted")} ${f}`);
            }
          }}
          onCopyPath={(f) => { navigator.clipboard.writeText(f).then(() => { cyberToast(t("ide", "pathCopied")); }); }}
          onViewHistory={(f) => fileStoreActions.openVersionPanel(f)}
          onPinTab={(f) => ideStoreDirect.togglePinTab(f)}
          onNewFile={() => {
            const name = prompt(t("ide", "newFilePrompt"));
            if (name) {
              fileStoreActions.recordOperation('create', name, `Created ${name}`);
              props.onOpenFile(name);
              cyberToast(`${t("ide", "created")} ${name}`);
            }
          }}
          onNewFolder={() => {
            const name = prompt(t("ide", "newFolderPrompt"));
            if (name) {
              fileStoreActions.recordOperation('create', name, `Created folder ${name}`);
              cyberToast(`${t("ide", "createdFolder")} ${name}`);
            }
          }}
        />
      )}

      {/* Version history */}
      <VersionHistoryPanel currentContent={props.editorCode} onRollback={props.onRollback} />

      {/* Recent files */}
      <RecentFilesPanel onOpenFile={props.onOpenFile} />

      {/* Database + System panels */}
      <DatabasePanel />
      <SystemPanel />
    </>
  );
}