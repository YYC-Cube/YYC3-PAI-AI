/**
 * @file useOverlayPanels.ts
 * @description Consolidates 10 overlay panel visibility states into a single Record
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,hook,overlay,react
 */

import { useState, useCallback, useMemo } from "react";

/** All overlay panel keys */
export type OverlayPanelKey =
  | "aiAssist"
  | "codeGen"
  | "collabPanel"
  | "gitPanel"
  | "perfDash"
  | "diagPanel"
  | "taskBoard"
  | "snippetMgr"
  | "activityLog"
  | "multiInstance";

/** Visibility record — all keys default to false */
export type OverlayPanelState = Record<OverlayPanelKey, boolean>;

const INITIAL_STATE: OverlayPanelState = {
  aiAssist: false,
  codeGen: false,
  collabPanel: false,
  gitPanel: false,
  perfDash: false,
  diagPanel: false,
  taskBoard: false,
  snippetMgr: false,
  activityLog: false,
  multiInstance: false,
};

/** Map from yyc3:open-panel event detail strings → OverlayPanelKey */
export const EVENT_TO_PANEL_KEY: Record<string, OverlayPanelKey> = {
  git: "gitPanel",
  performance: "perfDash",
  diagnostics: "diagPanel",
  taskBoard: "taskBoard",
  snippets: "snippetMgr",
  activityLog: "activityLog",
  multiInstance: "multiInstance",
};

export interface OverlayPanelsAPI {
  /** Current visibility state for all panels */
  panels: OverlayPanelState;
  /** Show a specific panel */
  show: (key: OverlayPanelKey) => void;
  /** Hide a specific panel */
  hide: (key: OverlayPanelKey) => void;
  /** Toggle a specific panel */
  toggle: (key: OverlayPanelKey) => void;
  /** Create a setter compatible with (v: boolean) => void for a given key */
  setter: (key: OverlayPanelKey) => (v: boolean) => void;
}

/** Consolidates 10 overlay panel visibility states into one Record + helper API */
export function useOverlayPanels(): OverlayPanelsAPI {
  const [panels, setPanels] = useState<OverlayPanelState>(INITIAL_STATE);

  const show = useCallback((key: OverlayPanelKey) => {
    setPanels((prev) => ({ ...prev, [key]: true }));
  }, []);

  const hide = useCallback((key: OverlayPanelKey) => {
    setPanels((prev) => ({ ...prev, [key]: false }));
  }, []);

  const toggle = useCallback((key: OverlayPanelKey) => {
    setPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /** Memoized setter factory — returns stable (v: boolean) => void per key */
  const setter = useCallback(
    (key: OverlayPanelKey) => (v: boolean) => {
      setPanels((prev) => ({ ...prev, [key]: v }));
    },
    []
  );

  return useMemo(() => ({ panels, show, hide, toggle, setter }), [panels, show, hide, toggle, setter]);
}
