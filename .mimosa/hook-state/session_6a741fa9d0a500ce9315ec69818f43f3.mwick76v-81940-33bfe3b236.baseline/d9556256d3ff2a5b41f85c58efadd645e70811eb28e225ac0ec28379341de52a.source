/**
 * @file FileTreeNode.tsx
 * @description File tree node component + filter helper — extracted from IDEMode.tsx
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,file-tree,component
 */

import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { useThemeStore } from "../../store/theme-store";
import type { FileNode } from "../../types";

/** Recursive file tree node */
export function FileTreeNode({ node, depth, selectedFile, onSelect, highlightQuery, onContextMenu: onCtxMenu }: {
  node: FileNode; depth: number; selectedFile: string; onSelect: (name: string) => void; highlightQuery?: string;
  onContextMenu?: (e: React.MouseEvent, filename: string, isFolder: boolean) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isFolder = node.type === "folder";
  const isSelected = selectedFile === node.name;
  const indent = depth * 16;
  const { tokens: ftk } = useThemeStore();

  const getFileColor = (ext?: string) => {
    if (!ext) return ftk.primary;
    const map: Record<string, string> = { tsx: ftk.primary, ts: ftk.primary, css: ftk.secondary, json: ftk.warning };
    return map[ext] || ftk.primary;
  };

  const renderName = () => {
    if (!highlightQuery || !highlightQuery.trim()) return node.name;
    const q = highlightQuery.toLowerCase();
    const idx = node.name.toLowerCase().indexOf(q);
    if (idx === -1) return node.name;
    return (<>{node.name.slice(0, idx)}<span style={{ background: ftk.primary + "33", borderRadius: 2, padding: "0 1px" }}>{node.name.slice(idx, idx + highlightQuery.length)}</span>{node.name.slice(idx + highlightQuery.length)}</>);
  };

  return (
    <>
      <button
        className="flex items-center gap-1.5 w-full text-left py-0.5 px-1 rounded transition-all hover:opacity-80"
        style={{ paddingLeft: `${indent + 8}px`, background: isSelected ? ftk.primaryGlow : "transparent" }}
        onClick={() => { if (isFolder) setOpen(!open); else onSelect(node.name); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onCtxMenu?.(e, node.name, isFolder); }}
      >
        {isFolder ? (
          <>
            {open ? <ChevronDown size={10} color={ftk.primary} style={{ opacity: 0.5 }} /> : <ChevronRight size={10} color={ftk.primary} style={{ opacity: 0.5 }} />}
            <Folder size={13} color={ftk.primary} style={{ opacity: 0.7 }} />
          </>
        ) : (
          <>
            <span style={{ width: 10 }} />
            <File size={12} color={getFileColor(node.ext)} style={{ opacity: 0.6 }} />
          </>
        )}
        <span style={{ fontFamily: ftk.fontMono, fontSize: "11px", color: isSelected ? ftk.primary : isFolder ? ftk.primary : ftk.foreground, opacity: isSelected ? 1 : isFolder ? 0.8 : 0.6 }}>
          {renderName()}
        </span>
      </button>
      {isFolder && open && node.children?.map((child) => (
        <FileTreeNode key={child.name} node={child} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} highlightQuery={highlightQuery} onContextMenu={onCtxMenu} />
      ))}
    </>
  );
}

/** Recursive file tree filter */
export function filterFileTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  return nodes.reduce<FileNode[]>((acc, node) => {
    if (node.type === "file") {
      if (node.name.toLowerCase().includes(q)) acc.push(node);
    } else {
      const filteredChildren = node.children ? filterFileTree(node.children, query) : [];
      if (node.name.toLowerCase().includes(q) || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children });
      }
    }
    return acc;
  }, []);
}
