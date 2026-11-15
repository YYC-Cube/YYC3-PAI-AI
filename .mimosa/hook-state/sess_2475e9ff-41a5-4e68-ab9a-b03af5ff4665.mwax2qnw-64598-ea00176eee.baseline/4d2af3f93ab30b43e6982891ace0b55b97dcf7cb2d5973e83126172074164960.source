/**
 * @file IDETerminal.tsx
 * @description Integrated terminal panel — extracted from IDEMode.tsx
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v4.8.2
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @tags ide,terminal,ui
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Terminal as TerminalIcon, X, Minus, Maximize2,
  ChevronsLeftRight, ChevronsRightLeft,
} from "lucide-react";
import { CyberTooltip } from "../CyberTooltip";
import { useI18n } from "../../i18n/context";
import { gitEngine } from "../../services/git-service";
import { useThemeStore } from "../../store/theme-store";
import {
  TERMINAL_HISTORY,
  type VFSNode,
  INITIAL_VFS,
  vfsResolve,
  vfsResolveParts,
  vfsListDir,
  vfsTreeLines,
} from "./ide-mock-data";

interface IDETerminalProps {
  terminalHeight: number;
  terminalExpanded: boolean;
  middleRatio: number;
  viewMode: "edit" | "preview";
  onClose: () => void;
  onSetExpanded: (v: boolean) => void;
  onSetHeight: (h: number) => void;
  onStartResize: (e: React.MouseEvent) => void;
}

export function IDETerminal({
  terminalHeight,
  terminalExpanded,
  middleRatio,
  viewMode,
  onClose,
  onSetExpanded,
  onSetHeight,
  onStartResize,
}: IDETerminalProps) {
  const { t } = useI18n();
  const { tokens } = useThemeStore();

  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState(TERMINAL_HISTORY);
  const [terminalCwd, setTerminalCwd] = useState("/src/app");
  const [vfs, setVfs] = useState<Record<string, VFSNode>>(() => JSON.parse(JSON.stringify(INITIAL_VFS)));
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLines]);

  const resolveAbsPath = useCallback((rel: string) => {
    if (rel.startsWith("/")) return rel;
    const parts = terminalCwd.split("/").filter(Boolean);
    rel.split("/").forEach(seg => {
      if (seg === "..") parts.pop();
      else if (seg !== "." && seg !== "") parts.push(seg);
    });
    return "/" + parts.join("/");
  }, [terminalCwd]);

  const handleTerminalSend = () => {
    if (!terminalInput.trim()) return;
    const raw = terminalInput.trim();
    setTerminalLines(prev => [...prev, { type: "input", text: `${terminalCwd} $ ${raw}` }]);
    setTerminalInput("");
    const out = (text: string) => setTerminalLines(prev => [...prev, { type: "output", text }]);
    const parts = raw.split(/\s+/);
    const cmd = parts[0];
    const arg1 = parts[1];

    // ── 真实工作区命令（LightningFS + isomorphic-git，与 Git 面板/编辑器同源） ──
    if (cmd === "git") {
      void (async () => {
        if (!(await gitEngine.isRepo())) {
          out("git: 工作区未初始化（在 Git 面板点击「初始化仓库」）");
          return;
        }
        try {
          if (arg1 === "status") {
            const cur = (await gitEngine.branches()).find(b => b.current)?.name ?? "main";
            out(`On branch ${cur}`);
            const st = await gitEngine.status();
            if (!st.length) { out("nothing to commit, working tree clean"); return; }
            out("Changes:");
            for (const s of st) {
              const flag = s.staged ? "staged:    " : s.untracked ? "untracked: " : "modified:  ";
              out(`  ${flag}${s.path}`);
            }
          } else if (arg1 === "log") {
            const log = await gitEngine.log(15);
            if (!log.length) { out("fatal: your current branch does not have any commits yet"); return; }
            for (const c of log) {
              out(`commit ${c.oid.slice(0, 7)}`);
              out(`Author: ${c.author}`);
              out(`Date:   ${new Date(c.timestamp).toLocaleString("zh-CN", { hour12: false })}`);
              out(`  ${c.message}`);
              out("");
            }
          } else if (arg1 === "commit" && parts.includes("-m")) {
            const mi = parts.indexOf("-m");
            const msg = parts.slice(mi + 1).join(" ").replace(/^["']|["']$/g, "");
            if (!msg) { out('usage: git commit -m "message"'); return; }
            const oid = await gitEngine.commit(msg);
            out(oid ? `[main ${oid.slice(0, 7)}] ${msg}` : "nothing to commit, working tree clean");
          } else if (arg1 === "branch") {
            (await gitEngine.branches()).forEach(b => out(b.current ? `* ${b.name}` : `  ${b.name}`));
          } else if (arg1 === "ls-files") {
            (await gitEngine.listFiles()).forEach(f => out(f));
          } else {
            out(`git: '${arg1 ?? ""}' 在浏览器引擎(isomorphic-git)中未实现`);
            out("可用：status / log / commit -m / branch / ls-files");
          }
        } catch (e) {
          out(`git: ${(e as Error).message}`);
        }
      })();
      return;
    }
    if (cmd === "npm" || cmd === "pnpm" || cmd === "yarn" || cmd === "tsc" || cmd === "node") {
      out(`${cmd}: 浏览器沙箱内没有 Node.js 运行时——此命令不可用（拒绝伪造输出）。`);
      out("可在宿主机的真实终端执行本仓库脚本。");
      return;
    }
    const arg2 = parts[2] || "";

    setTimeout(() => {
      if (cmd === "clear") { setTerminalLines([]); }
      else if (cmd === "pwd") { out(terminalCwd); }
      else if (cmd === "date") { out(new Date().toString()); }
      else if (cmd === "whoami") { out("yyc3-admin"); }
      else if (cmd === "uname" || cmd === "uname -a") { out("YYC3-OS 1.0.0 (FEFS/Tauri) x86_64"); }
      else if (cmd === "echo") { out(raw.slice(5)); }
      else if (cmd === "help") {
        out("YYC³ Terminal v1.0 — Available commands:");
        out("  ls [path]        List directory contents");
        out("  cd <path>        Change directory");
        out("  pwd              Print working directory");
        out("  cat <file>       Display file contents");
        out("  touch <file>     Create empty file");
        out("  mkdir <dir>      Create directory");
        out("  rm <path>        Remove file or directory");
        out("  mv <old> <new>   Rename/move file");
        out("  cp <src> <dst>   Copy file");
        out("  tree             Show directory tree");
        out("  echo <text>      Print text");
        out("  clear            Clear terminal");
        out("  date / whoami / uname");
        out("  git status|log|commit -m|branch|ls-files  真实工作区仓库（isomorphic-git）");
      } else if (cmd === "ls") {
        const target = arg1 ? resolveAbsPath(arg1) : terminalCwd;
        const node = vfsResolve(vfs, target);
        if (!node) { out(`ls: cannot access '${arg1}': No such file or directory`); }
        else if (node.type === "file") { out(target.split("/").pop() || ""); }
        else { out(vfsListDir(node).join("  ")); }
      } else if (cmd === "cd") {
        if (!arg1 || arg1 === "~") { setTerminalCwd("/"); return; }
        const target = resolveAbsPath(arg1);
        const node = vfsResolve(vfs, target);
        if (!node) { out(`cd: no such directory: ${arg1}`); }
        else if (node.type !== "dir") { out(`cd: not a directory: ${arg1}`); }
        else { setTerminalCwd(target === "" ? "/" : target); }
      } else if (cmd === "cat") {
        if (!arg1) { out("cat: missing operand"); return; }
        const target = resolveAbsPath(arg1);
        const node = vfsResolve(vfs, target);
        if (!node) { out(`cat: ${arg1}: No such file`); }
        else if (node.type === "dir") { out(`cat: ${arg1}: Is a directory`); }
        else { out(node.content || ""); }
      } else if (cmd === "touch") {
        if (!arg1) { out("touch: missing operand"); return; }
        const target = resolveAbsPath(arg1);
        const { parent, name } = vfsResolveParts(vfs, target);
        if (!parent || parent.type !== "dir") { out(`touch: cannot create '${arg1}': No such directory`); }
        else {
          if (!parent.children) parent.children = {};
          if (!parent.children[name]) { parent.children[name] = { type: "file", content: "" }; setVfs({ ...vfs }); out(`Created: ${name}`); }
          else { out(`File exists: ${name}`); }
        }
      } else if (cmd === "mkdir") {
        if (!arg1) { out("mkdir: missing operand"); return; }
        const target = resolveAbsPath(arg1);
        const { parent, name } = vfsResolveParts(vfs, target);
        if (!parent || parent.type !== "dir") { out(`mkdir: cannot create '${arg1}': No such directory`); }
        else {
          if (!parent.children) parent.children = {};
          if (parent.children[name]) { out(`mkdir: '${name}' already exists`); }
          else { parent.children[name] = { type: "dir", children: {} }; setVfs({ ...vfs }); out(`Created directory: ${name}`); }
        }
      } else if (cmd === "rm") {
        if (!arg1) { out("rm: missing operand"); return; }
        const target = resolveAbsPath(arg1);
        const { parent, name } = vfsResolveParts(vfs, target);
        if (!parent || parent.type !== "dir" || !parent.children?.[name]) { out(`rm: '${arg1}': No such file or directory`); }
        else { delete parent.children[name]; setVfs({ ...vfs }); out(`Removed: ${name}`); }
      } else if (cmd === "mv") {
        if (!arg1 || !arg2) { out("mv: missing operand"); return; }
        const srcPath = resolveAbsPath(arg1);
        const dstPath = resolveAbsPath(arg2);
        const src = vfsResolveParts(vfs, srcPath);
        const dst = vfsResolveParts(vfs, dstPath);
        if (!src.parent?.children?.[src.name]) { out(`mv: '${arg1}': not found`); }
        else if (!dst.parent || dst.parent.type !== "dir") { out(`mv: target directory not found`); }
        else {
          const node = src.parent.children[src.name];
          delete src.parent.children[src.name];
          if (!dst.parent.children) dst.parent.children = {};
          dst.parent.children[dst.name] = node;
          setVfs({ ...vfs }); out(`Moved: ${src.name} → ${dst.name}`);
        }
      } else if (cmd === "cp") {
        if (!arg1 || !arg2) { out("cp: missing operand"); return; }
        const srcPath = resolveAbsPath(arg1);
        const dstPath = resolveAbsPath(arg2);
        const srcNode = vfsResolve(vfs, srcPath);
        const dst = vfsResolveParts(vfs, dstPath);
        if (!srcNode || srcNode.type !== "file") { out(`cp: '${arg1}': not a file`); }
        else if (!dst.parent || dst.parent.type !== "dir") { out(`cp: target directory not found`); }
        else {
          if (!dst.parent.children) dst.parent.children = {};
          dst.parent.children[dst.name] = { type: "file", content: srcNode.content || "" };
          setVfs({ ...vfs }); out(`Copied: ${arg1} → ${arg2}`);
        }
      } else if (cmd === "tree") {
        const target = arg1 ? resolveAbsPath(arg1) : terminalCwd;
        const node = vfsResolve(vfs, target);
        if (!node || node.type !== "dir" || !node.children) { out("tree: not a directory"); }
        else {
          out(target === "/" ? "." : target.split("/").pop() || ".");
          vfsTreeLines(node.children, "", []).forEach(l => out(l));
        }
      } else if (raw.startsWith("echo ")) { out(raw.slice(5)); }
      else { out(`command not found: ${cmd}`); out("Type 'help' for available commands."); }
    }, 150);
  };

  return (
    <div
      className="absolute bottom-0 border-t flex flex-col"
      style={{
        left: viewMode === "preview" ? 0 : terminalExpanded ? 0 : `${middleRatio}%`,
        right: 0,
        height: terminalHeight,
        background: tokens.panelBg,
        borderColor: tokens.border,
        backdropFilter: "blur(10px)",
        zIndex: 20,
        transition: "left 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Resize handle */}
      <div className="flex items-center justify-center cursor-ns-resize shrink-0" style={{ height: 6 }} onMouseDown={onStartResize}>
        <div style={{ width: 40, height: 2, borderRadius: 1, background: tokens.border }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b shrink-0" style={{ borderColor: tokens.borderDim }}>
        <div className="flex items-center gap-2">
          <TerminalIcon size={11} color={tokens.primary} />
          <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, letterSpacing: "1px" }}>
            {t("ide", "integratedTerminal")}
          </span>
          <span className="px-1.5 py-0.5 rounded" style={{
            fontFamily: tokens.fontMono, fontSize: "8px",
            color: terminalExpanded ? tokens.success : tokens.foregroundMuted,
            background: terminalExpanded ? tokens.success + "12" : "transparent",
            border: `1px solid ${terminalExpanded ? tokens.success + "33" : tokens.borderDim}`,
            letterSpacing: "0.5px",
          }}>
            {terminalExpanded ? t("ide", "terminalWide") + " 65%" : t("ide", "terminalRightOnly") + " 35%"}
          </span>
          {terminalExpanded && (
            <span style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.foregroundMuted, opacity: 0.5, letterSpacing: "0.5px" }}>
              ~{terminalCwd}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <CyberTooltip label={terminalExpanded ? t("ide", "terminalCollapse") : t("ide", "terminalExpand")} position="top">
            <button onClick={() => onSetExpanded(!terminalExpanded)} className="p-0.5 rounded hover:bg-white/5 transition-all"
              style={{ color: terminalExpanded ? tokens.success : tokens.primary, background: terminalExpanded ? tokens.success + "12" : "transparent" }}>
              {terminalExpanded ? <ChevronsRightLeft size={10} /> : <ChevronsLeftRight size={10} />}
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "minimize")} position="top">
            <button onClick={onClose} className="p-0.5 rounded hover:bg-white/5 transition-all">
              <Minus size={10} color={tokens.primary} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "maximize")} position="top">
            <button onClick={() => onSetHeight(500)} className="p-0.5 rounded hover:bg-white/5 transition-all">
              <Maximize2 size={10} color={tokens.primary} />
            </button>
          </CyberTooltip>
          <CyberTooltip label={t("tooltips", "close")} position="top">
            <button onClick={onClose} className="p-0.5 rounded hover:bg-white/5 transition-all">
              <X size={10} color={tokens.primary} />
            </button>
          </CyberTooltip>
        </div>
      </div>

      {/* Output */}
      <div ref={terminalRef} className="flex-1 overflow-y-auto px-3 py-1.5 neon-scrollbar">
        {terminalLines.map((line, i) => (
          <div key={i} className="flex items-baseline gap-2" style={{ fontFamily: tokens.fontMono, fontSize: "11px", lineHeight: "18px" }}>
            {terminalExpanded && (
              <span className="shrink-0 select-none" style={{ width: 28, textAlign: "right", fontSize: "9px", color: tokens.foregroundMuted, opacity: 0.3 }}>
                {i + 1}
              </span>
            )}
            <span className="flex-1 break-all" style={{ color: line.type === "input" ? tokens.primary : tokens.foregroundMuted }}>
              {line.text}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-1.5 border-t shrink-0" style={{ borderColor: tokens.borderDim }}>
        <div className="flex items-center gap-1.5">
          {terminalExpanded && (
            <span className="shrink-0" style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted, opacity: 0.5 }}>
              ~{terminalCwd}
            </span>
          )}
          <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.success }}>$</span>
          <input
            value={terminalInput}
            onChange={e => setTerminalInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleTerminalSend()}
            placeholder={t("ide", "terminalPlaceholder")}
            className="flex-1 bg-transparent outline-none"
            style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary, caretColor: tokens.success }}
          />
        </div>
      </div>
    </div>
  );
}
