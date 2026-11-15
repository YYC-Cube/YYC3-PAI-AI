/**
 * @file ide-mock-data.ts
 * @description Mock data and VFS helpers for IDEMode — extracted to reduce IDEMode.tsx line count
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.2
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @tags ide,mock-data,test
 */

import type { FileNode } from "../../types";

// ===== Mock file tree data =====
export const MOCK_FILE_TREE: FileNode[] = [
  {
    name: "src", type: "folder", children: [
      {
        name: "app", type: "folder", children: [
          { name: "App.tsx", type: "file", ext: "tsx" },
          {
            name: "components", type: "folder", children: [
              { name: "IDEMode.tsx", type: "file", ext: "tsx" },
              { name: "FullscreenMode.tsx", type: "file", ext: "tsx" },
              { name: "FloatingWidget.tsx", type: "file", ext: "tsx" },
              { name: "CyberTooltip.tsx", type: "file", ext: "tsx" },
              { name: "GlitchText.tsx", type: "file", ext: "tsx" },
              { name: "HoloCard.tsx", type: "file", ext: "tsx" },
              { name: "ModelSettings.tsx", type: "file", ext: "tsx" },
            ]
          },
          {
            name: "i18n", type: "folder", children: [
              { name: "context.tsx", type: "file", ext: "tsx" },
              { name: "translations.ts", type: "file", ext: "ts" },
            ]
          },
          {
            name: "store", type: "folder", children: [
              { name: "model-store.tsx", type: "file", ext: "tsx" },
              { name: "ide-store.ts", type: "file", ext: "ts" },
            ]
          },
          { name: "types.ts", type: "file", ext: "ts" },
        ]
      },
      {
        name: "styles", type: "folder", children: [
          { name: "cyberpunk.css", type: "file", ext: "css" },
          { name: "fonts.css", type: "file", ext: "css" },
          { name: "theme.css", type: "file", ext: "css" },
        ]
      },
    ]
  },
  { name: "package.json", type: "file", ext: "json" },
  { name: "tsconfig.json", type: "file", ext: "json" },
  { name: "vite.config.ts", type: "file", ext: "ts" },
];

// ===== Sample code content =====
export const SAMPLE_CODE = `import { useState, useEffect } from "react";
import { Brain, Database, Globe } from "lucide-react";
import { useI18n } from "../i18n/context";

interface PanelProps {
  id: string;
  title: string;
  children?: React.ReactNode;
}

export function Panel({ id, title, children }: PanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useI18n();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="panel-container">
      <div className="panel-header">
        <h3>{title}</h3>
        <button onClick={handleToggle}>
          {isOpen ? "▼" : "▶"}
        </button>
      </div>
      {isOpen && (
        <div className="panel-content">
          {children}
        </div>
      )}
    </div>
  );
}`;

export const TERMINAL_HISTORY = [
  { type: "input" as const, text: "$ npm run dev" },
  { type: "output" as const, text: "  VITE v5.4.7  ready in 312 ms" },
  { type: "output" as const, text: "  ➜  Local:   http://localhost:5173/" },
  { type: "output" as const, text: "  ➜  Network: http://192.168.1.42:5173/" },
  { type: "output" as const, text: "" },
  { type: "input" as const, text: "$ git status" },
  { type: "output" as const, text: "On branch main" },
  { type: "output" as const, text: "Changes not staged for commit:" },
  { type: "output" as const, text: "  modified:   src/app/components/IDEMode.tsx" },
  { type: "output" as const, text: "  modified:   src/app/App.tsx" },
  { type: "output" as const, text: "" },
  { type: "input" as const, text: "$ tsc --noEmit" },
  { type: "output" as const, text: "✓ No errors found" },
];

export const MOCK_PROJECTS = [
  { id: "p1", name: "YYC³ Dashboard", time: "2h ago", status: "active" as const },
  { id: "p2", name: "Neural API", time: "5h ago", status: "idle" as const },
  { id: "p3", name: "ICE Protocol", time: "1d ago", status: "active" as const },
  { id: "p4", name: "Quantum Sync", time: "3d ago", status: "idle" as const },
  { id: "p5", name: "Data Matrix v2", time: "5d ago", status: "idle" as const },
];

// ===== Virtual file system for terminal CRUD simulation =====
export interface VFSNode { type: "file" | "dir"; content?: string; children?: Record<string, VFSNode> }

export const INITIAL_VFS: Record<string, VFSNode> = {
  src: { type: "dir", children: {
    app: { type: "dir", children: {
      "App.tsx": { type: "file", content: "export default function App() { return <div>YYC³</div>; }" },
      components: { type: "dir", children: {
        "IDEMode.tsx": { type: "file", content: "// IDE Mode component" },
        "ModelSettings.tsx": { type: "file", content: "// Model Settings" },
        "GlitchText.tsx": { type: "file", content: "// Glitch text effect" },
      }},
      i18n: { type: "dir", children: {
        "translations.ts": { type: "file", content: "export const translations = {...}" },
        "context.tsx": { type: "file", content: "// i18n context provider" },
      }},
      store: { type: "dir", children: {
        "model-store.tsx": { type: "file", content: "// Model store" },
        "ide-store.ts": { type: "file", content: "// IDE store" },
      }},
    }},
  }},
  "package.json": { type: "file", content: '{ "name": "yyc3-ai-code", "version": "1.0.0" }' },
  "tsconfig.json": { type: "file", content: '{ "compilerOptions": { "strict": true } }' },
  "vite.config.ts": { type: "file", content: "// Vite config" },
  "README.md": { type: "file", content: "# YYC³ AI Code\nDesktop AI IDE" },
};

export function vfsResolve(root: Record<string, VFSNode>, path: string): VFSNode | null {
  const parts = path.split("/").filter(Boolean);
  let cur: VFSNode = { type: "dir", children: root };
  for (const p of parts) {
    if (cur.type !== "dir" || !cur.children?.[p]) return null;
    cur = cur.children[p];
  }
  return cur;
}

export function vfsResolveParts(root: Record<string, VFSNode>, path: string): { parent: VFSNode | null; name: string } {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { parent: { type: "dir", children: root }, name: "" };
  const name = parts.pop()!;
  let cur: VFSNode = { type: "dir", children: root };
  for (const p of parts) {
    if (cur.type !== "dir" || !cur.children?.[p]) return { parent: null, name };
    cur = cur.children[p];
  }
  return { parent: cur, name };
}

export function vfsListDir(node: VFSNode): string[] {
  if (node.type !== "dir" || !node.children) return [];
  return Object.entries(node.children).map(([n, v]) => v.type === "dir" ? n + "/" : n);
}

export function vfsTreeLines(children: Record<string, VFSNode>, prefix: string, isLast: boolean[]): string[] {
  const lines: string[] = [];
  const entries = Object.entries(children);
  entries.forEach(([n, v], i) => {
    const last = i === entries.length - 1;
    const connector = last ? "└── " : "├── ";
    const display = v.type === "dir" ? n + "/" : n;
    lines.push(prefix + connector + display);
    if (v.type === "dir" && v.children) {
      const childPrefix = prefix + (last ? "    " : "│   ");
      lines.push(...vfsTreeLines(v.children, childPrefix, [...isLast, last]));
    }
  });
  return lines;
}
