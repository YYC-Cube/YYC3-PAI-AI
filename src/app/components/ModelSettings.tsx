/**
 * @file ModelSettings.tsx
 * @description 模型设置组件，提供模型配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,model,ai,ui,component
 */
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bot,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown, ChevronRight,
  Clock,
  Cloud,
  Copy,
  Cpu,
  Edit3,
  ExternalLink,
  Eye, EyeOff,
  FileCode2,
  Lightbulb,
  Loader2,
  Palette,
  Plug,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wifi,
  X,
  XCircle,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { panelActions } from "../store/panel-store";
import { useI18n, type TranslationSection } from "../i18n/context";
import { aiMetricsStore } from "../store/ai-metrics-store";
import { useModelStore, type AIModel } from "../store/model-store";
import { BLUR, themeStore, useThemeStore, Z_INDEX, type ThemeTokens } from "../store/theme-store";
import type { NetworkError as _NetworkError } from "../types/errors";
import { createLogger } from "../utils/logger";
import { loadAllProviderKeys, migratePlaintextKeysToVault, saveProviderKey } from "../utils/key-storage";
import { loadJ, OLLAMA_BASE, PROVIDERS, saveJ, SK, type ModelDef, type ProviderDef } from "./settings-model";
import { MCPPanel } from "./MCPPanel";
import { PerformancePanel } from "./PerformancePanel";
import { trackModelImport, trackModelSwitch, trackModelTest, trackOllamaDetection } from "../utils/model-performance-tracker";
import { ThemePreview } from "./ThemePreview";

const logger = createLogger('ModelSettings');

// Font/color constants removed — use tokens from useThemeStore() instead

// ===== Types（Provider/Model/MCP 类型与目录已拆至 settings-model.ts） =====
interface DiagnosticResult {
  providerId: string; modelName: string;
  status: "idle" | "testing" | "success" | "error";
  latency?: number; message: string; modelResponse?: string; timestamp?: number;
}
interface OllamaDetectedModel {
  name: string; size: string; status: "online" | "offline"; quantization: string;
}

// ===== Cyber input style helper =====
const cyInput = "w-full px-3 py-2 rounded-lg text-[11px] font-mono outline-none transition-all";
function getCyInputStyle(): React.CSSProperties {
  const tk = themeStore.getTokens();
  return { color: tk.foreground, background: tk.inputBg, border: `1px solid ${tk.inputBorder}`, caretColor: tk.primary };
}

/**
 * Adapts provider brand colors for the current theme.
 * Cyberpunk: neon colors as-is. Clean: increased opacity for light-bg visibility.
 */
function getProviderColors(prov: ProviderDef, isClean: boolean) {
  if (!isClean) return { color: prov.color, bgColor: prov.bgColor, borderColor: prov.borderColor };
  return {
    color: prov.color,
    bgColor: prov.bgColor.replace(/[\d.]+\)$/, '0.10)'),
    borderColor: prov.borderColor.replace(/[\d.]+\)$/, '0.30)'),
  };
}

// Legacy cyInputStyle/cyInputFocus removed — use getCyInputStyle() with tokens instead

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

// ===== Provider Card =====
function ProviderCard({ provider, apiKey, customUrl, diags, expanded, activeModelKey,
  onToggle, onApiKeyChange, onUrlChange, onTestConnection, onSelectModel, isCustom, onRemoveProvider,
  onDisableProvider, onEditProvider, onAddModel, onRemoveModel, onEditModel, t, tk }: {
    provider: ProviderDef; apiKey: string; customUrl: string;
    diags: Record<string, DiagnosticResult>; expanded: boolean; activeModelKey: string | null;
    onToggle: () => void; onApiKeyChange: (k: string) => void; onUrlChange: (u: string) => void;
    onTestConnection: (modelId: string) => void; onSelectModel: (modelId: string) => void;
    isCustom?: boolean; onRemoveProvider?: () => void;
    onDisableProvider?: () => void; onEditProvider?: () => void;
    onAddModel?: (modelId: string, modelName: string, description?: string) => void;
    onRemoveModel?: (modelId: string) => void;
    onEditModel?: (modelId: string, updates: Partial<ModelDef>) => void;
    t: (section: TranslationSection, key: string) => string;
    tk: ThemeTokens;
  }) {
  const [showKey, setShowKey] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState(customUrl || provider.baseURL);
  const [addingModel, setAddingModel] = useState(false);
  const [newMId, setNewMId] = useState("");
  const [newMName, setNewMName] = useState("");
  const Icon = typeof provider.icon === "function" ? provider.icon : Bot;
  const activeUrl = customUrl || provider.baseURL;
  const hasActive = activeModelKey ? activeModelKey.startsWith(provider.id + ":") : false;
  const hasOnline = Object.values(diags).some(d => d.status === "success");
  const hasError = Object.values(diags).some(d => d.status === "error");
  const isTesting = Object.values(diags).some(d => d.status === "testing");
  const pc = getProviderColors(provider, !tk.enableGlow);

  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{
      background: hasActive ? `${pc.color}${tk.enableGlow ? '06' : '0a'}` : tk.cardBg,
      border: `1px solid ${hasActive ? `${pc.color}30` : tk.cardBorder}`,
      boxShadow: hasActive && tk.enableGlow ? `0 0 20px ${pc.color}10` : tk.shadow,
      borderRadius: tk.borderRadius,
    }}>
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:opacity-90">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: pc.bgColor, border: `1px solid ${pc.borderColor}` }}>
          <Icon size={14} color={pc.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: tk.fontMono, fontSize: "12px", color: tk.foreground }}>{provider.name}</span>
            {provider.openaiCompatible && (
              <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.primary, opacity: 0.7, background: tk.primaryGlow, border: `1px solid ${tk.border}` }}>
                OpenAI \u517C\u5BB9
              </span>
            )}
          </div>
          <div style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, marginTop: 2 }}>{provider.description}</div>
        </div>
        <div className="flex items-center gap-2">
          {hasActive && <span className="px-1.5 py-0.5 rounded-full" style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.border}` }}>{t("modelSettings", "inUse")}</span>}
          {apiKey && <div className="w-2 h-2 rounded-full" style={{ background: tk.success }} />}
          {hasOnline && <CheckCircle2 size={12} color={tk.success} />}
          {hasError && !hasOnline && <AlertCircle size={12} color={tk.error} />}
          {isTesting && <Loader2 size={12} color={tk.primary} className="animate-spin" />}
          <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{provider.models.length} models</span>
          {expanded ? <ChevronDown size={12} color={tk.foregroundMuted} /> : <ChevronRight size={12} color={tk.foregroundMuted} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${tk.borderDim}` }}>
          {/* API Endpoint */}
          <div className="pt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, letterSpacing: "1px" }}>{t("modelSettings", "apiEndpointLabel")}</label>
              <div className="flex items-center gap-1">
                {!editingUrl ? (
                  <button onClick={() => { setEditingUrl(true); setUrlDraft(activeUrl); }} className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
                    <Edit3 size={9} />{t("modelSettings", "edit")}
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { onUrlChange(urlDraft); setEditingUrl(false); }} className="px-1.5 py-0.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.success }} aria-label={t("modelSettings", "confirm")} title={t("modelSettings", "confirm")}><Check size={9} /></button>
                    <button onClick={() => setEditingUrl(false)} className="px-1.5 py-0.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{t("modelSettings", "cancel")}</button>
                  </div>
                )}
                <CopyBtn text={activeUrl} />
              </div>
            </div>
            {editingUrl ? (
              <input value={urlDraft} onChange={e => setUrlDraft(e.target.value)} className={cyInput} style={{ ...getCyInputStyle() }} aria-label={t("modelSettings", "apiEndpointLabel")} />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: tk.inputBg, border: `1px solid ${tk.borderDim}` }}>
                <span className="truncate flex-1" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foregroundMuted }}>{activeUrl}</span>
              </div>
            )}
          </div>

          {/* API Key */}
          {provider.id !== "ollama" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, letterSpacing: "1px" }}>API KEY</label>
                {provider.apiKeyUrl && (
                  <a href={provider.apiKeyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.primary }}>
                    <ExternalLink size={9} />{t("modelSettings", "getApiKey")}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input type={showKey ? "text" : "password"} value={apiKey} onChange={e => onApiKeyChange(e.target.value)}
                    placeholder={provider.apiKeyPlaceholder} className={cyInput} style={{ ...getCyInputStyle(), paddingRight: 32 }} />
                  <button onClick={() => setShowKey(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: tk.foregroundMuted }}>
                    {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
              {!apiKey && (
                <div className="flex items-center gap-1.5" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.warning }}>
                  <AlertCircle size={10} /><span>{t("modelSettings", "apiKeyNotSet")}</span>
                </div>
              )}
            </div>
          )}

          {/* Model list */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, letterSpacing: "1px" }}>{t("modelSettings", "modelList")}</label>
              <button onClick={() => setAddingModel(true)} className="flex items-center gap-1 px-1.5 py-0.5 rounded transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
                <PlusCircle size={9} />{t("modelSettings", "addModelBtn")}
              </button>
            </div>
            <div className="space-y-1">
              {provider.models.map(model => {
                const diag = diags[model.id];
                const mKey = provider.id + ":" + model.id;
                const isActive = activeModelKey === mKey;
                return (
                  <div key={model.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all group" style={{
                    background: isActive ? tk.primaryGlow : tk.cardBg,
                    border: `1px solid ${isActive ? tk.border : "transparent"}`,
                  }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                      background: isActive ? tk.primary : diag?.status === "success" ? tk.success : diag?.status === "error" ? tk.error : diag?.status === "testing" ? tk.primary : tk.borderDim,
                      boxShadow: isActive && tk.enableGlow ? `0 0 4px ${tk.primary}` : "none",
                    }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: isActive ? tk.primary : tk.foreground }}>{model.name}</span>
                        {isActive && <span className="px-1.5 py-0.5 rounded-full" style={{ fontFamily: tk.fontMono, fontSize: "7px", color: tk.primary, background: tk.primaryGlow, border: `1px solid ${tk.border}` }}>{t("modelSettings", "currentUse")}</span>}
                        {model.contextWindow && <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted, background: tk.cardBg }}>{model.contextWindow}</span>}
                      </div>
                      <div style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{model.description}</div>
                    </div>
                    {model.pricing && <span style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>{model.pricing}</span>}
                    {diag?.status === "success" && diag.latency != null && <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.success }}>{diag.latency}ms</span>}
                    <div className="flex items-center gap-0.5 opacity-100 transition-opacity">
                      {!isActive && <button onClick={() => onSelectModel(model.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.primary, border: `1px solid ${tk.border}` }}><ArrowRight size={9} />{t("modelSettings", "use")}</button>}
                      <button onClick={() => onTestConnection(model.id)} className="p-1 rounded transition-all hover:opacity-80" style={{ color: tk.foregroundMuted }} aria-label={`${t("modelSettings", "testConnection")} ${model.name}`} title={`${t("modelSettings", "testConnection")} ${model.name}`}>
                        {diag?.status === "testing" ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                      </button>
                      {onEditModel && (
                        <button onClick={() => {
                          const newName = prompt(t("modelSettings", "editModelName"), model.name);
                          if (newName && newName !== model.name) {
                            onEditModel(model.id, { name: newName });
                          }
                        }} className="p-1 rounded transition-all hover:opacity-80" style={{ color: tk.primary }} aria-label={`${t("modelSettings", "edit")} ${model.name}`} title={`${t("modelSettings", "edit")} ${model.name}`}>
                          <Edit3 size={10} />
                        </button>
                      )}
                      {onRemoveModel && (
                        <button onClick={() => {
                          if (confirm(t("modelSettings", "confirmRemoveModel"))) {
                            onRemoveModel(model.id);
                          }
                        }} className="p-1 rounded transition-all hover:opacity-80" style={{ color: tk.error }} aria-label={`${t("modelSettings", "remove")} ${model.name}`} title={`${t("modelSettings", "remove")} ${model.name}`}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {addingModel && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: `1px dashed ${tk.border}`, background: tk.inputBg }}>
                <input value={newMId} onChange={e => setNewMId(e.target.value)} placeholder="Model ID" className="flex-1 bg-transparent text-[11px] font-mono outline-none" style={{ color: tk.foreground, caretColor: tk.primary }} aria-label="Model ID" />
                <input value={newMName} onChange={e => setNewMName(e.target.value)} placeholder="Display Name" className="flex-1 bg-transparent text-[11px] font-mono outline-none" style={{ color: tk.foreground, caretColor: tk.primary }} aria-label="Display Name" />
                <button onClick={() => {
                  if (newMId && newMName && onAddModel) {
                    onAddModel(newMId, newMName, "Custom model");
                    setNewMId("");
                    setNewMName("");
                    setAddingModel(false);
                  }
                }} disabled={!newMId || !newMName} className="p-1 disabled:opacity-30" style={{ color: tk.success }} aria-label={t("modelSettings", "confirm")} title={t("modelSettings", "confirm")}><Check size={12} /></button>
                <button onClick={() => { setAddingModel(false); setNewMId(""); setNewMName(""); }} className="p-1" style={{ color: tk.foregroundMuted }} aria-label={t("modelSettings", "cancel")} title={t("modelSettings", "cancel")}><X size={12} /></button>
              </div>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => provider.models.forEach(m => onTestConnection(m.id))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: pc.color, background: pc.bgColor, border: `1px solid ${pc.borderColor}` }}>
              <Activity size={10} />{t("modelSettings", "testAll")}
            </button>
            {provider.docsUrl && (
              <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}>
                <FileCode2 size={10} />{t("modelSettings", "apiDocs")}
              </a>
            )}
            {/* Edit button for all providers */}
            {onEditProvider && (
              <button onClick={onEditProvider} className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.primary, border: `1px solid ${tk.primary}22` }}>
                <Edit3 size={10} />{t("modelSettings", "edit")}
              </button>
            )}
            {/* Disable button for all providers */}
            {onDisableProvider && (
              <button onClick={onDisableProvider} className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.warning, border: `1px solid ${tk.warning}22` }}>
                <AlertCircle size={10} />{t("modelSettings", "disable")}
              </button>
            )}
            {/* Delete button only for custom providers */}
            {isCustom && onRemoveProvider && (
              <button onClick={onRemoveProvider} className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.error, border: `1px solid ${tk.error}22` }}>
                <Trash2 size={10} />{t("modelSettings", "removeProvider")}
              </button>
            )}
          </div>

          {/* Error details */}
          {Object.entries(diags).filter(([, d]) => d.status === "error").map(([mId, diag]) => (
            <div key={mId} className="px-3 py-2 rounded-lg space-y-1" style={{ background: `${tk.error}08`, border: `1px solid ${tk.error}1a` }}>
              <div className="flex items-center gap-1.5">
                <XCircle size={10} color={tk.error} />
                <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.error }}>{diag.modelName}</span>
                {diag.latency != null && <span className="ml-auto" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{diag.latency}ms</span>}
              </div>
              <div style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, paddingLeft: 18 }}>{diag.message}</div>
            </div>
          ))}
          {Object.entries(diags).filter(([, d]) => d.status === "success" && d.modelResponse).map(([mId, diag]) => (
            <div key={mId} className="px-3 py-2 rounded-lg space-y-1" style={{ background: `${tk.success}08`, border: `1px solid ${tk.success}1a` }}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={10} color={tk.success} />
                <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.success }}>{diag.modelName}</span>
                <span className="ml-auto" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{diag.latency}ms</span>
              </div>
              <div style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, paddingLeft: 18 }}>{diag.modelResponse}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// PerformancePanel 已拆至 ./PerformancePanel.tsx（二期拆分）

// （性能表格/错误分析/成本报告段随拆分迁移至 PerformancePanel.tsx）

// ===== Main Component =====
type TabKey = "providers" | "ollama" | "mcp" | "diagnostics" | "performance" | "theme";

export function ModelSettings() {
  const { t } = useI18n();
  const { modelSettingsOpen, modelSettingsInitialTab, closeModelSettings, aiModels, addAIModel, updateAIModel, activateAIModel, activeModelId, getActiveModel, sendToActiveModel } = useModelStore();
  const { tokens, isCyberpunk, themeId, setTheme, autoDetect, setAutoDetect } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabKey>("providers");

  // When ModelSettings opens with a specific initial tab, jump to it
  useEffect(() => {
    if (modelSettingsOpen && modelSettingsInitialTab) {
      const validTabs: TabKey[] = ["providers", "ollama", "mcp", "diagnostics", "performance", "theme"];
      if (validTabs.includes(modelSettingsInitialTab as TabKey)) {
        queueMicrotask(() => setActiveTab(modelSettingsInitialTab as TabKey));
      }
    }
  }, [modelSettingsOpen, modelSettingsInitialTab]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>("zhipu");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [customUrls, setCustomUrls] = useState<Record<string, string>>(() => loadJ(SK.urls, {}));
  const [customProviders, setCustomProviders] = useState<ProviderDef[]>(() => {
    const loaded = loadJ(SK.custom, []);
    return loaded.map((p: ProviderDef) => ({ ...p, icon: p.icon || Bot }));
  });
  const [disabledProviders, setDisabledProviders] = useState<Set<string>>(() => new Set(loadJ(SK.disabled, [])));
  const [customModels, setCustomModels] = useState<Record<string, ModelDef[]>>(() => loadJ(SK.customModels, {}));
  const [addingProvider, setAddingProvider] = useState(false);
  const [newProv, setNewProv] = useState({ name: "", baseURL: "", apiKeyUrl: "" });
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticResult>>({});
  const pendingRef = useRef<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ollamaHost, setOllamaHost] = useState(import.meta.env.VITE_OLLAMA_BASE_URL || "http://localhost:11434");
  const [ollamaScanning, setOllamaScanning] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaDetectedModel[]>([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [ollamaImportMessage, setOllamaImportMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [diagRunning, setDiagRunning] = useState(false);
  const [aiDiagReport, setAiDiagReport] = useState<string | null>(null);
  const [aiDiagLoading, setAiDiagLoading] = useState(false);

  // API Key 存储：启动时从统一门面（加密保险库优先）载入；写入时经门面持久化，
  // 不再整表明文写 localStorage（yyc3-provider-api-keys 仅作为保险库未解锁时的降级层）
  useEffect(() => {
    loadAllProviderKeys().then((all) => setApiKeys(all)).catch(() => { /* 降级为空 */ })
    // 保险库已解锁（如本会话内刚设置主口令）→ 顺带迁移历史明文
    migratePlaintextKeysToVault().catch(() => { /* 迁移失败不阻塞 UI */ })
  }, [])
  const updateApiKey = useCallback((providerId: string, key: string) => {
    setApiKeys(p => ({ ...p, [providerId]: key }))
    saveProviderKey(providerId, key).catch(() => { /* 存储失败时保留在内存态 */ })
  }, [])
  useEffect(() => { saveJ(SK.urls, customUrls); }, [customUrls]);
  useEffect(() => { saveJ(SK.custom, customProviders); }, [customProviders]);
  useEffect(() => { saveJ(SK.disabled, Array.from(disabledProviders)); }, [disabledProviders]);

  useEffect(() => {
    const pn = pendingRef.current;
    if (!pn) return;
    const found = aiModels.find(m => m.name === pn && !m.isActive);
    if (found) { pendingRef.current = null; activateAIModel(found.id); }
  }, [aiModels, activateAIModel]);

  const allProviders = useMemo(() => {
    const providers = [...PROVIDERS, ...customProviders];
    // Merge custom models into providers and filter excluded models
    return providers.map(p => {
      const custom = customModels[p.id] || [];

      // Get excluded models for this provider
      const excludedModelsKey = `yyc3-excluded-models-${p.id}`;
      const excludedModels: string[] = loadJ(excludedModelsKey, []);

      // Filter out excluded models from both preset and custom models
      const baseModels = p.models.filter(m => !excludedModels.includes(m.id));
      const filteredCustom = custom.filter(m => !excludedModels.includes(m.id));

      if (filteredCustom.length === 0 && excludedModels.length === 0) return p;
      return { ...p, models: [...baseModels, ...filteredCustom] };
    });
  }, [customProviders, customModels]);
  const filteredProviders = useMemo(() => {
    let providers = allProviders;

    // Filter out disabled providers
    providers = providers.filter(p => !disabledProviders.has(p.id));

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      providers = providers.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.shortName.toLowerCase().includes(q) ||
        p.models.some(m => m.name.toLowerCase().includes(q))
      );
    }

    return providers;
  }, [allProviders, searchQuery, disabledProviders]);

  // Test connection
  const handleTest = useCallback((providerId: string, modelId: string) => {
    const provider = allProviders.find(p => p.id === providerId);
    if (!provider) return;
    const model = provider.models.find(m => m.id === modelId);
    if (!model) return;
    const dk = providerId + ":" + modelId;
    const key = apiKeys[providerId] || "";
    const url = customUrls[providerId] || provider.baseURL;

    if (providerId !== "ollama" && !key) { setDiagnostics(p => ({ ...p, [dk]: { providerId, modelName: model.name, status: "error", message: t("modelSettings", "noApiKey"), timestamp: Date.now() } })); return; }

    setDiagnostics(p => ({ ...p, [dk]: { providerId, modelName: model.name, status: "testing", message: t("modelSettings", "testSending"), timestamp: Date.now() } }));

    const start = performance.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);

    const setR = (r: Omit<DiagnosticResult, "providerId" | "modelName" | "timestamp">) => {
      setDiagnostics(p => ({ ...p, [dk]: { providerId, modelName: model.name, timestamp: Date.now(), ...r } }));
    };

    (async () => {
      try {
        let resp: Response;
        const msg = [{ role: "user", content: "Hi, respond with exactly: YANYUCLOUD_OK" }];
        if (providerId === "ollama") {
          const chatUrl = url || OLLAMA_BASE + "/api/chat";
          resp = await fetch(chatUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: model.id, messages: msg, stream: false }), signal: ctrl.signal });
        } else {
          // 浏览器直连：智谱端点已验证支持 CORS（预检 200 + ACAO 回显来源），
          // 生产（静态 Pages）无 dev 代理，统一直连目标端点
          resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + key,
            },
            body: JSON.stringify({ model: model.id, messages: msg, stream: false, max_tokens: 20, temperature: 0 }),
            signal: ctrl.signal
          });
        }
        clearTimeout(timer);
        const latency = Math.round(performance.now() - start);
        if (!resp.ok) {
          const errText = await resp.text().catch(() => "");
          let detail = ""; try { const j = JSON.parse(errText); detail = j.error?.message || j.message || errText.slice(0, 200); } catch { detail = errText.slice(0, 200); }
          const s = resp.status;
          const sm = s === 401 ? "API Key invalid (401)" : s === 404 ? (providerId === "ollama" ? "Model not found, run: ollama pull " + model.id : "Endpoint not found (404)") : s === 429 ? "Rate limited (429)" : "HTTP " + s;
          setR({ status: "error", message: sm + (detail ? ". " + detail : ""), latency });
          aiMetricsStore.recordError({ providerId, providerName: provider.name, modelId: model.id, modelName: model.name, latencyMs: latency, errorMessage: sm, httpStatus: s });
          return;
        }
        const data = await resp.json().catch(() => null);
        let reply = "";
        if (providerId === "ollama") reply = data?.message?.content || "";
        else reply = data?.choices?.[0]?.message?.content || data?.result || "";
        setR({ status: "success", message: t("modelSettings", "testOk"), latency, modelResponse: reply.slice(0, 100) });
        // 记录成功指标到 AI Metrics Store
        aiMetricsStore.recordSuccess({ providerId, modelId: model.id, modelName: model.name, latencyMs: latency, inputTokens: 10, outputTokens: Math.ceil((reply?.length || 10) / 4) });
        // Track model test performance
        trackModelTest(providerId, model.id, model.name, latency, true);
      } catch (err: Error | _NetworkError | unknown) {
        clearTimeout(timer);
        const latency = Math.round(performance.now() - start);
        const errorName = err instanceof Error ? err.name : 'Unknown';
        if (errorName === "AbortError") {
          setR({ status: "error", message: t("modelSettings", "testTimeout"), latency });
          aiMetricsStore.recordError({ providerId, providerName: provider.name, modelId: model.id, modelName: model.name, latencyMs: latency, errorMessage: "Timeout" });
          trackModelTest(providerId, model.id, model.name, latency, false);
          return;
        }
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setR({ status: "error", message: t("modelSettings", "testNetworkFail") + ": " + errorMessage.slice(0, 150), latency });
        aiMetricsStore.recordError({ providerId, providerName: provider.name, modelId: model.id, modelName: model.name, latencyMs: latency, errorMessage });
        trackModelTest(providerId, model.id, model.name, latency, false);
      }
    })();
  }, [allProviders, apiKeys, customUrls, t]);

  // Select model
  const handleSelect = useCallback((providerId: string, modelId: string) => {
    const switchStart = performance.now();
    const previousModel = activeModelId;

    const provider = allProviders.find(p => p.id === providerId);
    if (!provider) return;
    const model = provider.models.find(m => m.id === modelId);
    if (!model) return;
    const url = customUrls[providerId] || provider.baseURL;
    const key = apiKeys[providerId] || "";
    const pt: AIModel["provider"] = providerId === "openai" ? "openai" : providerId === "ollama" ? "ollama" : "custom";
    const existing = aiModels.find(m => (m.name === model.id || m.name === model.name) && m.endpoint === url);
    if (existing) { updateAIModel(existing.id, { apiKey: key, name: model.id }); activateAIModel(existing.id); }
    else { pendingRef.current = model.id; addAIModel({ name: model.id, provider: pt, endpoint: url, apiKey: key, isActive: false }); }

    // Track model switching performance
    const switchTimeMs = Math.round(performance.now() - switchStart);
    trackModelSwitch({
      fromModel: previousModel,
      toModel: model.id,
      toProvider: providerId,
      switchTimeMs,
      success: true,
    });

    setToast(model.name);
    setTimeout(() => setToast(null), 2500);
  }, [allProviders, customUrls, apiKeys, aiModels, activateAIModel, addAIModel, updateAIModel, activeModelId]);

  // Active model key
  const activeModelKey = useMemo(() => {
    if (!activeModelId) return null;
    const am = aiModels.find(m => m.id === activeModelId);
    if (!am) return null;
    for (const p of allProviders) {
      const url = customUrls[p.id] || p.baseURL;
      for (const m of p.models) { if ((am.name === m.id || am.name === m.name) && am.endpoint === url) return p.id + ":" + m.id; }
    }
    for (const p of allProviders) { for (const m of p.models) { if (am.name.toLowerCase() === m.name.toLowerCase() || am.name.toLowerCase() === m.id.toLowerCase()) return p.id + ":" + m.id; } }
    return null;
  }, [activeModelId, aiModels, allProviders, customUrls]);

  // Add custom provider
  const handleAddProvider = useCallback(() => {
    if (!newProv.name || !newProv.baseURL) return;
    const id = "custom-" + Date.now();
    setCustomProviders(p => [...p, { id, name: newProv.name, shortName: newProv.name.slice(0, 4), icon: Bot, color: "#ff79c6", bgColor: "rgba(255,121,198,0.06)", borderColor: "rgba(255,121,198,0.2)", description: "Custom OpenAI-compatible", baseURL: newProv.baseURL, apiKeyUrl: newProv.apiKeyUrl, apiKeyPlaceholder: "sk-...", openaiCompatible: true, docsUrl: "", models: [] }]);
    setNewProv({ name: "", baseURL: "", apiKeyUrl: "" });
    setAddingProvider(false);
    setExpandedProvider(id);
  }, [newProv]);

  // Add custom model to provider
  const handleAddModel = useCallback((providerId: string, modelId: string, modelName: string, description?: string) => {
    setCustomModels(prev => {
      const models = prev[providerId] || [];
      const newModel: ModelDef = {
        id: modelId,
        name: modelName,
        description: description || "Custom model",
      };
      const updated = { ...prev, [providerId]: [...models, newModel] };
      saveJ(SK.customModels, updated);
      return updated;
    });
  }, []);

  // Remove custom model from provider (supports both custom and preset models)
  const handleRemoveModel = useCallback((providerId: string, modelId: string) => {
    // Use exclusion list for all providers to avoid infinite loops
    const excludedModelsKey = `yyc3-excluded-models-${providerId}`;
    const excluded = loadJ<string[]>(excludedModelsKey, []);

    if (!excluded.includes(modelId)) {
      localStorage.setItem(excludedModelsKey, JSON.stringify([...excluded, modelId]));
    }

    // Clear diagnostics for removed model
    setDiagnostics(prev => {
      const newDiags = { ...prev };
      delete newDiags[`${providerId}:${modelId}`];
      return newDiags;
    });

    // Force re-render by updating a counter
    setCustomModels(prev => ({ ...prev }));
  }, []);

  // Edit custom model
  const handleEditModel = useCallback((providerId: string, modelId: string, updates: Partial<ModelDef>) => {
    setCustomModels(prev => {
      const models = prev[providerId] || [];
      const updated = models.map(m => m.id === modelId ? { ...m, ...updates } : m);
      const result = { ...prev, [providerId]: updated };
      saveJ(SK.customModels, result);
      return result;
    });
  }, []);

  // Ollama scan
  const handleScanOllama = useCallback(() => {
    setOllamaScanning(true);
    setOllamaModels([]);
    setOllamaConnected(false);
    setOllamaError(null);

    const detectStart = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // 直连 Ollama tags（静态站无代理；跨域需本机 Ollama 设置 OLLAMA_ORIGINS）
    const url = ollamaHost.replace(/\/+$/, "") + "/api/tags";

    fetch(url, {
      signal: controller.signal,
      mode: "cors",
    })
      .then(r => {
        clearTimeout(timeoutId);
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        return r.json();
      })
      .then(data => {
        const models: OllamaDetectedModel[] = (data.models || []).map((m: Record<string, unknown>): OllamaDetectedModel => ({
          name: (m.name as string) || (m.model as string),
          size: m.size ? ((m.size as number) / 1e9).toFixed(1) + " GB" : "N/A",
          status: "online" as const,
          quantization: (m.details as Record<string, unknown> | undefined)?.quantization_level as string ||
            (m.details as Record<string, unknown> | undefined)?.family as string || "N/A"
        }));
        setOllamaModels(models);
        setOllamaConnected(true);
        setOllamaScanning(false);
        setOllamaError(null);

        // Track Ollama detection performance
        const detectTimeMs = Math.round(performance.now() - detectStart);
        trackOllamaDetection({
          host: ollamaHost,
          modelCount: models.length,
          detectTimeMs,
          success: true,
        });
      })
      .catch((err: Error) => {
        clearTimeout(timeoutId);
        setOllamaScanning(false);
        setOllamaConnected(false);

        const isLocalhost = ollamaHost.includes('localhost') || ollamaHost.includes('127.0.0.1') || ollamaHost.includes('[::1]');
        let errorMessage = t("modelSettings", "ollamaConnectionFailed");

        if (err.name === 'AbortError') {
          errorMessage = t("modelSettings", "ollamaTimeout");
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = isLocalhost
            ? t("modelSettings", "ollamaNotRunning")
            : t("modelSettings", "ollamaCorsError") +
              `（OLLAMA_ORIGINS=${window.location.origin} ollama serve）`;
        } else if (err.message.includes('ECONNREFUSED') || err.message.includes('Network request failed')) {
          errorMessage = t("modelSettings", "ollamaNotRunning");
        } else if (err.message.includes('HTTP')) {
          errorMessage = `${t("modelSettings", "ollamaHttpError")}: ${err.message}`;
        }

        setOllamaError(errorMessage);
        logger.error('Ollama scan failed', { error: err, host: ollamaHost, isLocalhost });

        // Track Ollama detection failure
        const detectTimeMs = Math.round(performance.now() - detectStart);
        trackOllamaDetection({
          host: ollamaHost,
          modelCount: 0,
          detectTimeMs,
          success: false,
          error: errorMessage,
        });
      });
  }, [ollamaHost, t]);

  // Import Ollama model
  const handleImportOllamaModel = useCallback((model: OllamaDetectedModel) => {
    const importStart = performance.now();

    try {
      // Add to global AI models list
      addAIModel({
        name: model.name,
        provider: "ollama",
        endpoint: OLLAMA_BASE + "/api/chat",
        apiKey: "",
        isActive: false,
        isDetected: true
      });

      // Also add to Ollama provider's custom models list
      setCustomModels(prev => {
        const existingModels = prev["ollama"] || [];
        const alreadyExists = existingModels.some(m => m.id === model.name);

        if (alreadyExists) {
          setOllamaImportMessage({ type: 'error', message: `${model.name} 已存在` });
          setTimeout(() => setOllamaImportMessage(null), 3000);
          return prev;
        }

        const newModel: ModelDef = {
          id: model.name,
          name: model.name,
          description: `Ollama local · ${model.size}`,
        };

        const updated = { ...prev, "ollama": [...existingModels, newModel] };
        saveJ(SK.customModels, updated);

        setOllamaImportMessage({ type: 'success', message: `${model.name} 导入成功` });
        setTimeout(() => setOllamaImportMessage(null), 3000);

        // Track model import performance
        const importTimeMs = Math.round(performance.now() - importStart);
        trackModelImport(model.name, importTimeMs, true);

        return updated;
      });
    } catch (err) {
      setOllamaImportMessage({ type: 'error', message: `${model.name} ${t("modelSettings", "importFailed")}: ${err instanceof Error ? err.message : t("modelSettings", "unknownError")}` });
      setTimeout(() => setOllamaImportMessage(null), 3000);

      // Track model import failure
      const importTimeMs = Math.round(performance.now() - importStart);
      trackModelImport(model.name, importTimeMs, false);
    }
  }, [addAIModel, t]);

  // Run all diagnostics
  const handleDiagAll = useCallback(async () => {
    setDiagRunning(true);
    for (const p of allProviders) { for (const m of p.models) { handleTest(p.id, m.id); await new Promise(r => setTimeout(r, 300)); } }
    setTimeout(() => setDiagRunning(false), 2000);
  }, [allProviders, handleTest]);

  if (!modelSettingsOpen) return null;

  const totalModels = allProviders.reduce((s, p) => s + p.models.length, 0);
  const onlineCount = Object.values(diagnostics).filter(d => d.status === "success").length;
  const testedCount = Object.values(diagnostics).filter(d => d.status === "success" || d.status === "error").length;
  const avgLat = (() => { const ls = Object.values(diagnostics).filter(d => d.latency != null).map(d => d.latency!); return ls.length ? Math.round(ls.reduce((a, b) => a + b, 0) / ls.length) : 0; })();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.modal }}
      role="dialog"
      aria-modal="true"
      aria-label={t("modelSettings", "title")}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeModelSettings();
        if (e.key === 'Tab') {
          const focusableElements = document.querySelectorAll<HTMLElement>('[tabindex]:not([tabindex="-1"]), button, input, select, textarea');
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }}
    >
      <div className="absolute inset-0" style={{ background: tokens.overlayBg, backdropFilter: BLUR.lg }} onClick={closeModelSettings} />
      <div
        className="relative w-[920px] max-h-[88vh] rounded-xl flex flex-col overflow-hidden"
        style={{ background: tokens.panelBg, border: `1px solid ${tokens.cardBorder}`, boxShadow: isCyberpunk ? `0 0 60px ${tokens.primary}10, 0 0 120px ${tokens.primary}05, inset 0 0 40px ${tokens.primary}02` : tokens.shadowHover, borderRadius: tokens.borderRadius }}
        role="region"
        aria-label={t("modelSettings", "ariaModelList")}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${tokens.border}` }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.border}` }}>
            <Sparkles size={16} color={tokens.primary} style={{ filter: isCyberpunk ? `drop-shadow(0 0 4px ${tokens.primary})` : "none" }} />
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: tokens.fontDisplay, fontSize: "14px", color: tokens.primary, textShadow: isCyberpunk ? `0 0 8px ${tokens.primary}60` : "none" }}>{t("modelSettings", "title")}</div>
            <div style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>{t("modelSettings", "subtitle")}</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorder}` }}>
            <Search size={12} color={tokens.foregroundMuted} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-transparent text-[11px] outline-none w-36" style={{ fontFamily: tokens.fontMono, color: tokens.foreground, caretColor: tokens.primary }} />
          </div>
          <button
            onClick={() => { closeModelSettings(); panelActions.open('keyVault'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.secondary, background: `${tokens.secondary}1a`, border: `1px solid ${tokens.secondary}33` }}
            title="API Key 加密保险库（PBKDF2 + AES-256-GCM）"
          >
            <ShieldCheck size={11} />
            保险库
          </button>
          <button
            onClick={closeModelSettings}
            className="p-2 rounded-lg transition-all hover:opacity-80"
            style={{ border: `1px solid ${tokens.border}` }}
            aria-label={t("modelSettings", "ariaCloseDialog")}
          >
            <X size={14} color={tokens.primary} />
          </button>
        </div>

        {/* Tabs - adaptive height with minimum height to prevent content overlap */}
        <div
          className="flex items-center gap-1 px-5 py-3 overflow-x-auto shrink-0"
          style={{ borderBottom: `1px solid ${tokens.borderDim}`, minHeight: "48px" }}
          role="tablist"
          aria-label={t("modelSettings", "ariaTabNav")}
        >
          {([
            { key: "providers" as const, labelKey: "tabProviders", icon: Cloud },
            { key: "ollama" as const, labelKey: "tabOllama", icon: Server },
            { key: "mcp" as const, labelKey: "tabMCP", icon: Plug },
            { key: "diagnostics" as const, labelKey: "tabDiagnostics", icon: Activity },
            { key: "performance" as const, labelKey: "tabPerformance", icon: BarChart3 },
            { key: "theme" as const, labelKey: "tabTheme", icon: Palette },
          ]).map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 px-4 py-2.5 whitespace-nowrap transition-all"
              style={{
                fontFamily: tokens.fontMono, fontSize: "11px",
                color: activeTab === key ? tokens.primary : tokens.foregroundMuted,
                borderBottom: activeTab === key ? `2px solid ${tokens.primary}` : "2px solid transparent",
                background: activeTab === key ? tokens.primaryGlow : "transparent",
                borderRadius: "6px 6px 0 0",
              }}
              role="tab"
              aria-controls={`tabpanel-${key}`}
            >
              <Icon size={13} />{t("modelSettings", labelKey)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-5 min-h-0 neon-scrollbar"
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-label={activeTab === 'providers' ? t("modelSettings", "tabProviders") :
            activeTab === 'ollama' ? t("modelSettings", "tabOllama") :
              activeTab === 'mcp' ? t("modelSettings", "tabMCP") :
                activeTab === 'diagnostics' ? t("modelSettings", "tabDiagnostics") :
                  activeTab === 'performance' ? t("modelSettings", "tabPerformance") :
                    t("modelSettings", "tabTheme")}
        >
          {/* Providers Tab */}
          {activeTab === "providers" && (
            <div className="space-y-3">
              {/* Active model indicator */}
              {activeModelId && (() => {
                const am = aiModels.find(m => m.id === activeModelId);
                const mp = activeModelKey ? allProviders.find(p => activeModelKey.startsWith(p.id + ":")) : null;
                return (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-1" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow }}>
                    {mp ? <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: mp.bgColor, border: `1px solid ${mp.borderColor}` }}><mp.icon size={10} color={mp.color} /></div> : <CheckCircle2 size={14} color={tokens.primary} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary }}>{am?.name || "—"}</span>
                        {mp && <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>{mp.name}</span>}
                      </div>
                      <div className="truncate" style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>{am?.endpoint}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full shrink-0" style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary, background: tokens.primaryGlow, border: `1px solid ${tokens.border}` }}>{t("modelSettings", "currentUse")}</span>
                  </div>
                );
              })()}

              {filteredProviders.map(provider => {
                const pd: Record<string, DiagnosticResult> = {};
                provider.models.forEach(m => { const d = diagnostics[provider.id + ":" + m.id]; if (d) pd[m.id] = d; });
                const isCustom = !PROVIDERS.find(p => p.id === provider.id);
                return (
                  <ProviderCard key={provider.id} provider={provider} apiKey={apiKeys[provider.id] || ""} customUrl={customUrls[provider.id] || ""}
                    diags={pd} expanded={expandedProvider === provider.id} activeModelKey={activeModelKey}
                    onToggle={() => setExpandedProvider(p => p === provider.id ? null : provider.id)}
                    onApiKeyChange={k => updateApiKey(provider.id, k)}
                    onUrlChange={u => setCustomUrls(p => ({ ...p, [provider.id]: u }))}
                    onTestConnection={mId => handleTest(provider.id, mId)}
                    onSelectModel={mId => handleSelect(provider.id, mId)}
                    isCustom={isCustom}
                    onRemoveProvider={isCustom ? () => setCustomProviders(pr => pr.filter(x => x.id !== provider.id)) : undefined}
                    onDisableProvider={() => setDisabledProviders(s => new Set(s).add(provider.id))}
                    onEditProvider={() => {
                      // Copy provider to custom providers for editing
                      if (!isCustom) {
                        const customCopy: ProviderDef = {
                          ...provider,
                          id: provider.id + '-custom-' + Date.now(),
                          name: provider.name + ' ' + t("modelSettings", "customSuffix"),
                        };
                        setCustomProviders(pr => [...pr, customCopy]);
                        const inheritedKey = apiKeys[provider.id] || '';
                        if (inheritedKey) updateApiKey(customCopy.id, inheritedKey);
                        setCustomUrls(p => ({ ...p, [customCopy.id]: customUrls[provider.id] || '' }));
                        setExpandedProvider(customCopy.id);
                      }
                    }}
                    onAddModel={(mId, mName, desc) => handleAddModel(provider.id, mId, mName, desc)}
                    onRemoveModel={mId => handleRemoveModel(provider.id, mId)}
                    onEditModel={(mId, updates) => handleEditModel(provider.id, mId, updates)}
                    t={t} tk={tokens}
                  />
                );
              })}

              {/* Add custom provider */}
              {addingProvider ? (
                <div className="rounded-xl p-4 space-y-3" style={{ border: `1px dashed ${tokens.secondary}33`, background: `${tokens.secondary}05` }}>
                  <div style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.secondary }}>{t("modelSettings", "addCustomProvider")}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={newProv.name} onChange={e => setNewProv(p => ({ ...p, name: e.target.value }))} placeholder={t("modelSettings", "providerName")} className={cyInput} style={{ ...getCyInputStyle() }} />
                    <input value={newProv.apiKeyUrl} onChange={e => setNewProv(p => ({ ...p, apiKeyUrl: e.target.value }))} placeholder={t("modelSettings", "apiKeyLink")} className={cyInput} style={{ ...getCyInputStyle() }} />
                  </div>
                  <input value={newProv.baseURL} onChange={e => setNewProv(p => ({ ...p, baseURL: e.target.value }))} placeholder={t("modelSettings", "baseUrl")} className={cyInput} style={{ ...getCyInputStyle() }} />
                  <div className="flex gap-2">
                    <button onClick={handleAddProvider} disabled={!newProv.name || !newProv.baseURL} className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all disabled:opacity-30" style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.secondary, background: `${tokens.secondary}1a`, border: `1px solid ${tokens.secondary}33` }}><Plus size={10} />{t("modelSettings", "addProvider")}</button>
                    <button onClick={() => setAddingProvider(false)} className="px-4 py-2 rounded-lg" style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.foregroundMuted }}>{t("modelSettings", "cancel")}</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingProvider(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all hover:opacity-70" style={{ border: `1px dashed ${tokens.borderDim}`, color: tokens.foregroundMuted, fontFamily: tokens.fontMono, fontSize: "12px" }}>
                  <Plus size={14} />{t("modelSettings", "addProvider")}
                </button>
              )}

              {/* Tip */}
              <div className="px-4 py-2.5 rounded-xl flex items-start gap-2" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.borderDim}` }}>
                <Lightbulb size={12} color={tokens.primary} className="shrink-0 mt-0.5" style={{ opacity: 0.5 }} />
                <div style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>{t("modelSettings", "providerTip")}</div>
              </div>
            </div>
          )}

          {/* Ollama Tab */}
          {activeTab === "ollama" && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 space-y-3" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}`, borderRadius: tokens.borderRadius }}>
                <div className="flex items-center gap-2">
                  <Server size={14} color={tokens.warning} />
                  <span style={{ fontFamily: tokens.fontMono, fontSize: "12px", color: tokens.foreground }}>{t("modelSettings", "ollamaEndpoint")}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: ollamaConnected ? tokens.success : tokens.borderDim }} />
                    <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: ollamaConnected ? tokens.success : tokens.foregroundMuted }}>{ollamaConnected ? t("modelSettings", "connected") : t("modelSettings", "disconnected")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input value={ollamaHost} onChange={e => setOllamaHost(e.target.value)} className={`flex-1 ${cyInput}`} style={{ ...getCyInputStyle() }} aria-label={t("modelSettings", "ollamaEndpoint")} />
                  <button
                    onClick={handleScanOllama}
                    disabled={ollamaScanning}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                    style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.warning, background: `${tokens.warning}1a`, border: `1px solid ${tokens.warning}33` }}
                    aria-label={t("modelSettings", "ariaScanButton")}
                  >
                    <RefreshCw size={12} className={ollamaScanning ? "animate-spin" : ""} />{ollamaScanning ? t("modelSettings", "scanning") : t("modelSettings", "autoDetect")}
                  </button>
                </div>
                <div style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>{t("modelSettings", "ollamaHint")}</div>
                {ollamaError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: `${tokens.error}14`, border: `1px solid ${tokens.error}33` }}>
                    <AlertCircle size={14} color={tokens.error} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.error, fontWeight: 500 }}>{t("modelSettings", "connectionError")}</div>
                      <div style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted, marginTop: 4 }}>{ollamaError}</div>
                    </div>
                  </div>
                )}
              </div>
              {ollamaModels.length > 0 && (
                <div className="space-y-2">
                  <div style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted, letterSpacing: "1px" }}>{t("modelSettings", "detectedModels")} ({ollamaModels.length})</div>
                  {ollamaModels.map(model => {
                    const already = aiModels.some(m => m.name === model.name && m.provider === "ollama");
                    return (
                      <div key={model.name} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorder}`, borderRadius: tokens.borderRadius }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: model.status === "online" ? tokens.success : tokens.borderDim }} />
                        <div className="flex-1 min-w-0">
                          <div style={{ fontFamily: tokens.fontMono, fontSize: "12px", color: tokens.foreground }}>{model.name}</div>
                          <div style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>{model.size} \u00B7 {model.quantization}</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded" style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: model.status === "online" ? tokens.success : tokens.foregroundMuted, background: model.status === "online" ? `${tokens.success}14` : tokens.backgroundAlt }}>{model.status === "online" ? t("modelSettings", "online") : t("modelSettings", "offline")}</span>
                        {already ? (
                          <span className="flex items-center gap-1" style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}><Check size={10} />{t("modelSettings", "imported")}</span>
                        ) : (
                          <button
                            onClick={() => handleImportOllamaModel(model)}
                            disabled={model.status === "offline"}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all disabled:opacity-30"
                            style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.warning, background: `${tokens.warning}14`, border: `1px solid ${tokens.warning}33` }}
                            aria-label={`${t("modelSettings", "ariaImportButton")}: ${model.name}`}
                          >
                            <Plus size={10} />{t("modelSettings", "import")}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {ollamaImportMessage && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg"
                      style={{
                        background: ollamaImportMessage.type === 'success' ? `${tokens.success}14` : `${tokens.error}14`,
                        border: `1px solid ${ollamaImportMessage.type === 'success' ? `${tokens.success}33` : `${tokens.error}33`}`
                      }}
                      role="alert"
                      aria-live="assertive"
                    >
                      {ollamaImportMessage.type === 'success'
                        ? <CheckCircle2 size={14} color={tokens.success} />
                        : <XCircle size={14} color={tokens.error} />
                      }
                      <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: ollamaImportMessage.type === 'success' ? tokens.success : tokens.error }}>
                        {ollamaImportMessage.message}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {ollamaModels.length === 0 && !ollamaScanning && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: tokens.backgroundAlt, border: `1px solid ${tokens.borderDim}` }}>
                    <Server size={28} color={tokens.borderDim} />
                  </div>
                  <p style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.foregroundMuted }}>{t("modelSettings", "noOllamaModels")}</p>
                  <p style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted, opacity: 0.6, marginTop: 4 }}>{t("modelSettings", "noOllamaHint")}</p>
                </div>
              )}
            </div>
          )}

          {/* MCP Tab */}
          {activeTab === "mcp" && <MCPPanel t={t} />}

          {/* Diagnostics Tab */}
          {activeTab === "diagnostics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: t("modelSettings", "diagTotalModels"), value: String(totalModels), icon: Cpu, color: tokens.foreground },
                  { label: t("modelSettings", "diagTested"), value: String(testedCount), icon: Activity, color: tokens.primary },
                  { label: t("modelSettings", "diagOnline"), value: String(onlineCount), icon: Wifi, color: tokens.success },
                  { label: t("modelSettings", "diagAvgLatency"), value: avgLat ? avgLat + "ms" : "-", icon: Clock, color: tokens.warning },
                ].map(card => (
                  <div key={card.label} className="p-3 rounded-xl text-center" style={{ border: `1px solid ${tokens.borderDim}`, background: tokens.cardBg }}>
                    <card.icon size={14} color={card.color} className="mx-auto mb-1" />
                    <div style={{ fontFamily: tokens.fontMono, fontSize: "16px", color: card.color }}>{card.value}</div>
                    <div style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted, marginTop: 2 }}>{card.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleDiagAll}
                disabled={diagRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.border}`, fontFamily: tokens.fontMono, fontSize: "12px", color: tokens.primary }}
                aria-label={t("modelSettings", "ariaDiagnosticsPanel")}
              >
                {diagRunning ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                {diagRunning ? t("modelSettings", "diagRunning") : t("modelSettings", "diagRunAll")}
              </button>
              {allProviders.map(provider => {
                const pDiags = provider.models.map(m => ({ model: m, diag: diagnostics[provider.id + ":" + m.id] })).filter(d => d.diag);
                if (pDiags.length === 0) return null;
                return (
                  <div key={provider.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <provider.icon size={12} color={provider.color} />
                      <span style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.foreground }}>{provider.name}</span>
                      <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>{pDiags.filter(d => d.diag.status === "success").length}/{pDiags.length} online</span>
                    </div>
                    {pDiags.map(({ model, diag }) => {
                      const mKey = provider.id + ":" + model.id;
                      const isActive = activeModelKey === mKey;
                      return (
                        <div key={model.id} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all group" style={{
                          background: isActive ? tokens.primaryGlow : diag.status === "success" ? `${tokens.success}08` : diag.status === "error" ? `${tokens.error}08` : tokens.cardBg,
                          border: `1px solid ${isActive ? tokens.border : diag.status === "success" ? `${tokens.success}14` : diag.status === "error" ? `${tokens.error}14` : tokens.borderDim}`,
                        }}>
                          {isActive ? <CheckCircle2 size={12} color={tokens.primary} /> : diag.status === "success" ? <CheckCircle2 size={10} color={tokens.success} /> : diag.status === "error" ? <XCircle size={10} color={tokens.error} /> : <Loader2 size={10} color={tokens.primary} className="animate-spin" />}
                          <span className="flex-1" style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: isActive ? tokens.primary : tokens.foreground }}>{model.name}</span>
                          {isActive && <span className="px-1.5 py-0.5 rounded-full" style={{ fontFamily: tokens.fontMono, fontSize: "8px", color: tokens.primary, background: tokens.primaryGlow }}>{t("modelSettings", "currentUse")}</span>}
                          {diag.latency != null && <span style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: diag.status === "success" ? tokens.success : tokens.foregroundMuted }}>{diag.latency}ms</span>}
                          {diag.status === "error" && <span className="max-w-[180px] truncate" style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.error }}>{diag.message}</span>}
                          {diag.status === "success" && !isActive && (
                            <button onClick={() => handleSelect(provider.id, model.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all" style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.primary, border: `1px solid ${tokens.border}` }}>
                              <ArrowRight size={9} />{t("modelSettings", "diagSelectUse")}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {/* AI suggestions */}
              {Object.values(diagnostics).filter(d => d.status === "error").length > 0 && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: `${tokens.warning}08`, border: `1px solid ${tokens.warning}1a`, borderRadius: tokens.borderRadius }}>
                  <div className="flex items-center gap-2"><Lightbulb size={14} color={tokens.warning} /><span style={{ fontFamily: tokens.fontMono, fontSize: "12px", color: tokens.warning }}>{t("modelSettings", "diagSuggestions")}</span></div>
                  <div className="space-y-1.5 pl-6">
                    {Object.values(diagnostics).filter(d => d.status === "error").slice(0, 3).map((diag, i) => (
                      <div key={i} className="flex items-start gap-1.5" style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>
                        <Bug size={10} color={tokens.warning} className="shrink-0 mt-0.5" />
                        <span><strong style={{ color: tokens.warning }}>{diag.modelName}</strong>: {
                          diag.message.includes("401") ? "API Key invalid or expired" :
                            diag.message.includes("429") ? "Rate limited, try later" :
                              diag.message.includes("Network") || diag.message.includes("fetch") ? "Network error, check endpoint" :
                                diag.message.includes("timeout") || diag.message.includes("Timeout") ? "Connection timeout" :
                                  "Check configuration"
                        }</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-powered diagnostic report */}
              {Object.keys(diagnostics).length > 0 && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.border}`, borderRadius: tokens.borderRadius }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} color={tokens.primary} />
                      <span style={{ fontFamily: tokens.fontMono, fontSize: "12px", color: tokens.primary }}>
                        {t("modelSettings", "aiDiagTitle") || "AI Diagnostic Report"}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        const activeModel = getActiveModel();
                        if (!activeModel) {
                          setToast(t("modelSettings", "noActiveModel") || "No active model to generate report");
                          setTimeout(() => setToast(null), 3000);
                          return;
                        }
                        setAiDiagLoading(true);
                        setAiDiagReport(null);
                        try {
                          const diagData = Object.values(diagnostics).map(d => ({
                            model: d.modelName, provider: d.providerId,
                            status: d.status, latency: d.latency, error: d.status === "error" ? d.message : null,
                          }));
                          const prompt = `Analyze the following AI model diagnostic results and provide a brief, actionable report in ${t("modelSettings", "aiDiagLang") || "Chinese"}. Include: 1) Overall health summary, 2) Issues found, 3) Specific fix suggestions. Keep it concise.\n\nDiagnostic Data:\n${JSON.stringify(diagData, null, 2)}`;
                          const report = await sendToActiveModel(prompt, {
                            systemPrompt: t("modelSettings", "aiDiagSystemPrompt") || "You are a technical diagnostics assistant for YYC³ AI Code IDE. Provide clear, structured diagnostic reports.",
                          });
                          setAiDiagReport(report);
                        } catch (err: Error | unknown) {
                          const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
                          setAiDiagReport(`⚠ ${errorMessage}`);
                        }
                        setAiDiagLoading(false);
                      }}
                      disabled={aiDiagLoading || !getActiveModel()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
                      style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.primary, background: tokens.primaryGlow, border: `1px solid ${tokens.border}` }}
                      aria-label={t("modelSettings", "ariaGenerateReport")}
                    >
                      {aiDiagLoading ? <Loader2 size={10} className="animate-spin" /> : <Bot size={10} />}
                      {aiDiagLoading
                        ? (t("modelSettings", "aiDiagGenerating") || "Generating...")
                        : (t("modelSettings", "aiDiagGenerate") || "Generate AI Report")}
                    </button>
                  </div>
                  {!getActiveModel() && (
                    <p style={{ fontFamily: tokens.fontMono, fontSize: "9px", color: tokens.foregroundMuted }}>
                      {t("modelSettings", "aiDiagNoModel") || "Activate a model first to enable AI diagnostic reports"}
                    </p>
                  )}
                  {aiDiagReport && (
                    <div
                      className="rounded-lg p-3 mt-2"
                      style={{ background: tokens.inputBg, border: `1px solid ${tokens.borderDim}` }}
                      role="region"
                      aria-live="polite"
                      aria-label={t("modelSettings", "aiDiagTitle")}
                    >
                      <pre className="whitespace-pre-wrap" style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foreground, lineHeight: "1.6" }}>
                        {aiDiagReport}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <PerformancePanel t={t} tk={tokens} />
          )}

          {/* Theme Tab */}
          {activeTab === "theme" && (
            <ThemePreview
              currentTheme={themeId}
              onSelect={(id) => { setTheme(id); }}
              autoDetect={autoDetect}
              onAutoDetectChange={setAutoDetect}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${tokens.borderDim}`, background: tokens.cardBg }}>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.foregroundMuted }}>{allProviders.length} providers \u00B7 {totalModels} models</span>
            {onlineCount > 0 && <span style={{ fontFamily: tokens.fontMono, fontSize: "10px", color: tokens.success }}>{onlineCount} online</span>}
          </div>
          <button onClick={closeModelSettings} className="px-4 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ fontFamily: tokens.fontMono, fontSize: "11px", color: tokens.primary, background: tokens.primaryGlow, border: `1px solid ${tokens.border}` }}>{t("modelSettings", "done")}</button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-sm"
            style={{ background: tokens.primaryGlow, border: `1px solid ${tokens.border}`, boxShadow: tokens.shadow }}
            role="status"
            aria-live="assertive"
          >
            <CheckCircle2 size={14} color={tokens.primary} />
            <span style={{ fontFamily: tokens.fontMono, fontSize: "12px", color: tokens.primary }}>{t("modelSettings", "switchedTo")} <strong>{toast}</strong></span>
          </div>
        )}
      </div>
    </div >
  );
}
