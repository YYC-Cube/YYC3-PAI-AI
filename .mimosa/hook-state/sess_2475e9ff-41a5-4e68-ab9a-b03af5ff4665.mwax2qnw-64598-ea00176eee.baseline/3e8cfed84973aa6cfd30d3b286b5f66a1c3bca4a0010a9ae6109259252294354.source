/**
 * @file IDEFileExplorer.tsx
 * @description File explorer panel — search + file tree
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.2
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ide,file-explorer,ui,component
 * @license MIT
 */

import { Search, X } from "lucide-react";
import { useI18n } from "../../i18n/context";
import { useThemeStore } from "../../store/theme-store";
import { useIDELayout } from "./IDELayoutContext";
import { FileTreeNode } from "./FileTreeNode";
import { VirtualList, type VirtualListItem } from "../VirtualList";

const VIRTUAL_LIST_THRESHOLD = 100;

interface FileNodeItem {
  name: string;
  path: string;
  type: "file" | "folder" | "root";
  children?: FileNodeItem[];
}

function flattenFileTree(nodes: FileNodeItem[], depth = 0): Array<{ node: FileNodeItem; depth: number }> {
  const result: Array<{ node: FileNodeItem; depth: number }> = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.children && node.children.length > 0) {
      result.push(...flattenFileTree(node.children, depth + 1));
    }
  }
  return result;
}

/** File explorer body — reads shared state from IDELayoutContext */
export function IDEFileExplorer() {
  const { t } = useI18n();
  const { tokens } = useThemeStore();
  const { searchQuery, setSearchQuery, filteredFileTree, selectedFile, setSelectedFile, setFileContextMenu, borderColor } = useIDELayout();

  const flattenedNodes = flattenFileTree(filteredFileTree as unknown as FileNodeItem[]);
  const useVirtualList = filteredFileTree.length > VIRTUAL_LIST_THRESHOLD;

  const virtualItems: VirtualListItem<{ node: FileNodeItem; depth: number }>[] = flattenedNodes.map((item, idx) => ({
    id: item.node.path || `${item.node.name}-${idx}`,
    data: item,
  }));

  return (
    <>
      {/* Search */}
      <div className="px-3 py-1.5 border-b" style={{ borderColor }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ border: `1px solid ${tokens.borderDim}`, background: tokens.inputBg }}>
          <Search size={10} color={tokens.primary} style={{ opacity: 0.4 }} />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("ide", "searchFiles")}
            className="flex-1 bg-transparent outline-none" style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, caretColor: tokens.primary }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5 rounded hover:bg-white/10 transition-all" style={{ lineHeight: 0 }}>
              <X size={9} color={tokens.primary} style={{ opacity: 0.5 }} />
            </button>
          )}
        </div>
      </div>
      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1 neon-scrollbar">
        <div className="px-2 py-1 mb-1">
          <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary, opacity: 0.4, letterSpacing: "1px" }}>
            {t("ide", "projectStructure")}
          </span>
        </div>
        {filteredFileTree.length > 0 ? (
          useVirtualList ? (
            <VirtualList
              items={virtualItems}
              itemHeight={24}
              overscan={10}
              renderItem={(item) => (
                <div style={{ paddingLeft: `${item.data.depth * 16}px` }}>
                  <FileTreeNode
                    key={item.data.node.name}
                    node={item.data.node as Parameters<typeof FileTreeNode>[0]["node"]}
                    depth={item.data.depth}
                    selectedFile={selectedFile}
                    onSelect={setSelectedFile}
                    highlightQuery={searchQuery}
                    onContextMenu={(e, filename, isFolder) => setFileContextMenu({ x: e.clientX, y: e.clientY, filename, isFolder })}
                  />
                </div>
              )}
              emptyComponent={
                <div className="px-4 py-6 text-center">
                  <p style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>{t("ide", "noMatchFiles")}</p>
                </div>
              }
            />
          ) : (
            filteredFileTree.map((node) => (
              <FileTreeNode key={node.name} node={node} depth={0} selectedFile={selectedFile} onSelect={setSelectedFile}
                highlightQuery={searchQuery} onContextMenu={(e, filename, isFolder) => setFileContextMenu({ x: e.clientX, y: e.clientY, filename, isFolder })} />
            ))
          )
        ) : (
          <div className="px-4 py-6 text-center">
            <Search size={16} color={tokens.primary} style={{ opacity: 0.2, margin: "0 auto 8px" }} />
            <p style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>{t("ide", "noMatchFiles")}</p>
          </div>
        )}
      </div>
    </>
  );
}
