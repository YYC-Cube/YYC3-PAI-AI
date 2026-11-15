/**
 * @file MCPPanel.tsx
 * @description MCP 服务器管理面板（自 ModelSettings.tsx 拆出）
 * 双形态：stdio 配置（宿主进程型，导出 JSON 供宿主使用）与
 * Streamable HTTP 端点（浏览器内真协议直连，见 services/mcp-client.ts）
 */

import { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Plug, Plus, Settings2, Terminal, Trash2 } from "lucide-react";
import type { TranslationSection } from "../i18n/context";
import { themeStore, useThemeStore } from "../store/theme-store";
import { DEFAULT_MCP_SERVERS, loadJ, saveJ, SK, type MCPServerConfig } from "./settings-model";

// ===== Cyber input style helper（与 ModelSettings 同款） =====
const cyInput = "w-full px-3 py-2 rounded-lg text-[11px] font-mono outline-none transition-all";
function getCyInputStyle(): React.CSSProperties {
  const tk = themeStore.getTokens();
  return { color: tk.foreground, background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, caretColor: tk.primary };
}

function CopyBtn({ text }: { text: string }) {
  const [ok, set] = useState(false);
  const { tokens: _tk } = useThemeStore();
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).catch(() => { }); set(true); setTimeout(() => set(false), 2000); }}
      className="p-1 rounded transition-all hover:opacity-80" style={{ color: ok ? _tk.success : _tk.foregroundMuted }}>
      {ok ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

export function MCPPanel({ t }: { t: (section: TranslationSection, key: string) => string }) {
  const { tokens: tk } = useThemeStore();
  const [servers, setServers] = useState<MCPServerConfig[]>(() => loadJ(SK.mcp, DEFAULT_MCP_SERVERS));
  const [addingServer, setAddingServer] = useState(false);
  const [newSrv, setNewSrv] = useState({ name: "", command: "", args: "", env: "", description: "", endpoint: "", token: "" });
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { saveJ(SK.mcp, servers); }, [servers]);

  const handleAdd = () => {
    if (!newSrv.name || !newSrv.command) return;
    let envObj: Record<string, string> = {};
    try { if (newSrv.env) envObj = JSON.parse(newSrv.env); } catch { /* ignore invalid JSON */ }
    setServers(p => [...p, {
      id: "mcp-" + Date.now(), name: newSrv.name, description: newSrv.description || newSrv.name,
      command: newSrv.command, args: newSrv.args ? newSrv.args.split(/\s+/) : [], env: envObj, enabled: true,
      // endpoint/token 为可选：提供时 IDE 聊天走真协议拉取工具清单（mcp-client.ts）
      ...(newSrv.endpoint ? { endpoint: newSrv.endpoint } : {}),
      ...(newSrv.token ? { token: newSrv.token } : {}),
    }]);
    setNewSrv({ name: "", command: "", args: "", env: "", description: "", endpoint: "", token: "" });
    setAddingServer(false);
  };

  const exportJson = () => {
    const cfg: Record<string, Record<string, unknown>> = { mcpServers: {} };
    servers.filter(s => s.enabled).forEach(s => { cfg.mcpServers[s.name.toLowerCase()] = { command: s.command, args: s.args, ...(Object.keys(s.env).length > 0 ? { env: s.env } : {}) }; });
    setJsonDraft(JSON.stringify(cfg, null, 2));
    setJsonMode(true);
    setJsonError("");
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      const ms = parsed.mcpServers || parsed;
      const imported: MCPServerConfig[] = Object.entries(ms).map(([name, conf]) => {
        const cfg = conf as Record<string, unknown>;
        return {
          id: "mcp-" + Date.now() + "-" + name,
          name,
          description: cfg.description as string || name,
          command: cfg.command as string || "",
          args: (cfg.args as string[]) || [],
          env: (cfg.env as Record<string, string>) || {},
          enabled: true
        };
      });
      setServers(imported);
      setJsonMode(false);
      setJsonError("");
    } catch (e: Error | unknown) { setJsonError("JSON parse error: " + (e instanceof Error ? e.message : "Unknown error")); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug size={14} color={tk.secondary} />
          <span style={{ fontFamily: tk.fontMono, fontSize: "12px", color: tk.foreground }}>{t("modelSettings", "mcpTitle")}</span>
          <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, background: tk.cardBg }}>
            {servers.filter(s => s.enabled).length}/{servers.length} {t("modelSettings", "mcpEnabled")}
          </span>
        </div>
        <button onClick={exportJson} className="flex items-center gap-1 px-2 py-1 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
          <Terminal size={10} />{jsonMode ? t("modelSettings", "mcpListMode") : t("modelSettings", "mcpJsonMode")}
        </button>
      </div>

      {jsonMode && (
        <div className="space-y-2">
          <textarea value={jsonDraft} onChange={e => { setJsonDraft(e.target.value); setJsonError(""); }} rows={10} className="w-full px-3 py-2 rounded-lg text-[10px] font-mono resize-none outline-none" style={{ color: tk.foreground, background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, caretColor: tk.primary }} aria-label={t("modelSettings", "mcpJsonMode")} />
          {jsonError && <div className="flex items-center gap-1" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.error }}><AlertCircle size={10} />{jsonError}</div>}
          <div className="flex items-center gap-2">
            <button onClick={importJson} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.secondary, background: `${tk.secondary}1a`, border: `1px solid ${tk.secondary}33` }}><Check size={10} />{t("modelSettings", "mcpImport")}</button>
            <button onClick={() => setJsonMode(false)} className="px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foregroundMuted }}>{t("modelSettings", "cancel")}</button>
            <CopyBtn text={jsonDraft} />
          </div>
          <div style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, padding: "0 4px" }}>{t("modelSettings", "mcpCompatHint")}</div>
        </div>
      )}

      {!jsonMode && (
        <div className="space-y-2">
          {servers.map(srv => (
            <div key={srv.id} className="rounded-xl p-3 space-y-2 transition-all" style={{ background: srv.enabled ? tk.cardBg : tk.backgroundAlt, border: `1px solid ${srv.enabled ? tk.cardBorder : tk.borderDim}`, opacity: srv.enabled ? 1 : 0.5, borderRadius: tk.borderRadius }}>
              <div className="flex items-center gap-2.5">
                <button onClick={() => setServers(p => p.map(s => s.id === srv.id ? { ...s, enabled: !s.enabled } : s))} className="shrink-0" aria-label={`${srv.enabled ? t("modelSettings", "disable") : t("modelSettings", "enable")} ${srv.name}`} title={`${srv.enabled ? t("modelSettings", "disable") : t("modelSettings", "enable")} ${srv.name}`}>
                  <div className="w-8 h-4 rounded-full transition-all" style={{ background: srv.enabled ? `${tk.secondary}4d` : tk.borderDim }}>
                    <div className="w-3.5 h-3.5 rounded-full transition-all" style={{ background: srv.enabled ? tk.secondary : tk.foregroundMuted, marginTop: 1, marginLeft: srv.enabled ? 17 : 1 }} />
                  </div>
                </button>
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>
                    {srv.name}{srv.endpoint && <span className="ml-2 px-1 rounded" style={{ fontSize: "8px", color: tk.secondary, border: `1px solid ${tk.secondary}55` }}>HTTP</span>}
                  </div>
                  <div style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{srv.description}</div>
                </div>
                <button onClick={() => setEditId(editId === srv.id ? null : srv.id)} className="p-1 rounded transition-all hover:opacity-80" style={{ color: tk.foregroundMuted }} aria-label={`${t("modelSettings", "edit")} ${srv.name}`} title={`${t("modelSettings", "edit")} ${srv.name}`}><Settings2 size={10} /></button>
                <button onClick={() => setServers(p => p.filter(s => s.id !== srv.id))} className="p-1 rounded transition-all hover:opacity-80" style={{ color: tk.foregroundMuted }} aria-label={`${t("modelSettings", "remove")} ${srv.name}`} title={`${t("modelSettings", "remove")} ${srv.name}`}><Trash2 size={10} /></button>
              </div>
              {editId === srv.id && (
                <div className="pl-10 space-y-1" style={{ fontFamily: tk.fontMono, fontSize: "9px" }}>
                  <div className="flex items-center gap-2"><span style={{ color: tk.foregroundMuted, width: 56, flexShrink: 0 }}>command:</span><span style={{ color: tk.foreground }}>{srv.command}</span></div>
                  <div className="flex items-start gap-2"><span style={{ color: tk.foregroundMuted, width: 56, flexShrink: 0 }}>args:</span><span className="break-all" style={{ color: tk.foreground }}>{JSON.stringify(srv.args)}</span></div>
                  {srv.endpoint && <div className="flex items-start gap-2"><span style={{ color: tk.foregroundMuted, width: 56, flexShrink: 0 }}>endpoint:</span><span className="break-all" style={{ color: tk.foreground }}>{srv.endpoint}</span></div>}
                  {Object.keys(srv.env).length > 0 && <div className="flex items-start gap-2"><span style={{ color: tk.foregroundMuted, width: 56, flexShrink: 0 }}>env:</span><span className="break-all" style={{ color: tk.foreground }}>{JSON.stringify(srv.env)}</span></div>}
                </div>
              )}
            </div>
          ))}

          {addingServer ? (
            <div className="rounded-xl p-3 space-y-2" style={{ border: `1px dashed ${tk.secondary}33`, background: `${tk.secondary}08` }}>
              <div className="grid grid-cols-2 gap-2">
                <input value={newSrv.name} onChange={e => setNewSrv({ ...newSrv, name: e.target.value })} placeholder="Name" className={cyInput} style={{ ...getCyInputStyle(), fontSize: "10px" }} />
                <input value={newSrv.command} onChange={e => setNewSrv({ ...newSrv, command: e.target.value })} placeholder="Command (e.g. npx)" className={cyInput} style={{ ...getCyInputStyle(), fontSize: "10px" }} />
              </div>
              <input value={newSrv.args} onChange={e => setNewSrv({ ...newSrv, args: e.target.value })} placeholder="Args (space-separated)" className={cyInput} style={{ ...getCyInputStyle(), fontSize: "10px" }} />
              <input value={newSrv.endpoint} onChange={e => setNewSrv({ ...newSrv, endpoint: e.target.value })} placeholder="Streamable HTTP 端点（可选，浏览器真协议直连）" className={cyInput} style={{ ...getCyInputStyle(), fontSize: "10px" }} />
              <input value={newSrv.token} onChange={e => setNewSrv({ ...newSrv, token: e.target.value })} placeholder="Bearer Token（可选，随端点鉴权）" className={cyInput} style={{ ...getCyInputStyle(), fontSize: "10px" }} />
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={!newSrv.name || !newSrv.command} className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all disabled:opacity-30" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.secondary, background: `${tk.secondary}1a`, border: `1px solid ${tk.secondary}33` }}><Plus size={10} />{t("modelSettings", "addModelBtn")}</button>
                <button onClick={() => setAddingServer(false)} className="px-3 py-1.5 rounded-lg" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foregroundMuted }}>{t("modelSettings", "cancel")}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingServer(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-70" style={{ border: `1px dashed ${tk.borderDim}`, color: tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: "11px" }}>
              <Plus size={12} />{t("modelSettings", "mcpAdd")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
