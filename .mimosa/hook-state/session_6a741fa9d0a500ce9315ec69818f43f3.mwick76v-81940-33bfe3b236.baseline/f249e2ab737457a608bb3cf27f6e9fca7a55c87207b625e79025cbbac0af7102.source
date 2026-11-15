/**
 * @file PerformancePanel.tsx
 * @description AI 性能/成本/错误统计面板（自 ModelSettings.tsx 拆出 · 二期）
 */

import { Activity, AlertTriangle, ArrowRight, Bug, CheckCircle2, Clock, Shield, Sparkles, Trash2, XCircle, Zap } from "lucide-react";
import type { TranslationSection } from "../i18n/context";
import type { AggregatedMetrics, CostSummary, ErrorStats } from "../store/ai-metrics-store";
import { getErrorTypeLabel, useAIMetrics } from "../store/ai-metrics-store";
import type { ThemeTokens } from "../store/theme-store";

export function PerformancePanel({ t, tk }: { t: (section: TranslationSection, key: string) => string; tk: ThemeTokens }) {
  const { getAggregatedMetrics, getErrorStats, getCostSummaries, getTotalCost, getRecentErrors, getBestProvider, clearAll } = useAIMetrics();

  const metrics: AggregatedMetrics[] = getAggregatedMetrics();
  const errorStats: ErrorStats[] = getErrorStats();
  const costSummaries: CostSummary[] = getCostSummaries();
  const totalCost = getTotalCost();
  const recentErrors = getRecentErrors(10);
  const bestProvider = getBestProvider();
  const locale = (t("common", "online") === "在线" ? "zh" : "en") as "zh" | "en";

  const hasData = metrics.length > 0 || errorStats.length > 0 || costSummaries.length > 0;

  return (
    <div className="space-y-4">
      {/* 概览卡片 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t("modelSettings", "perfTotalRequests"), value: String(metrics.reduce((s, m) => s + m.totalRequests, 0)), icon: Activity, color: tk.primary },
          { label: t("modelSettings", "perfAvgLatency"), value: metrics.length ? Math.round(metrics.reduce((s, m) => s + m.avgLatencyMs, 0) / metrics.length) + "ms" : "-", icon: Clock, color: tk.warning },
          { label: t("modelSettings", "perfSuccessRate"), value: metrics.length ? (metrics.reduce((s, m) => s + m.successRate, 0) / metrics.length * 100).toFixed(1) + "%" : "-", icon: CheckCircle2, color: tk.success },
          { label: t("modelSettings", "perfTotalCost"), value: totalCost.usd > 0 ? "$" + totalCost.usd.toFixed(4) : totalCost.cny > 0 ? "¥" + totalCost.cny.toFixed(4) : "-", icon: Zap, color: tk.secondary },
        ].map(card => (
          <div key={card.label} className="p-3 rounded-xl text-center" style={{ border: `1px solid ${tk.borderDim}`, background: tk.cardBg, borderRadius: tk.borderRadius }}>
            <card.icon size={14} color={card.color} className="mx-auto mb-1" />
            <div style={{ fontFamily: tk.fontMono, fontSize: "16px", color: card.color }}>{card.value}</div>
            <div style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* 智能推荐 */}
      {bestProvider && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: `${tk.success}0d`, border: `1px solid ${tk.success}1a`, borderRadius: tk.borderRadius }}>
          <Sparkles size={12} color={tk.success} />
          <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.success }}>
            {t("modelSettings", "perfSmartPick")}:
          </span>
          <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>
            {bestProvider.modelId}
          </span>
          <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
            ({t("modelSettings", "perfScore")}: {(bestProvider.score * 100).toFixed(0)})
          </span>
        </div>
      )}

      {/* Provider 健康看板 */}
      {metrics.length > 0 && (() => {
        const providerMap = new Map<string, AggregatedMetrics[]>();
        metrics.forEach(m => {
          if (!providerMap.has(m.providerId)) providerMap.set(m.providerId, []);
          providerMap.get(m.providerId)!.push(m);
        });
        return (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.cardBorder}`, borderRadius: tk.borderRadius }}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: tk.cardBg, borderBottom: `1px solid ${tk.borderDim}` }}>
              <Shield size={12} color={tk.primary} />
              <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>{t("modelSettings", "perfProviderHealth")}</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {Array.from(providerMap.entries()).map(([pid, pMetrics]) => {
                const avgSuccess = pMetrics.reduce((s, m) => s + m.successRate, 0) / pMetrics.length;
                const avgLatency = Math.round(pMetrics.reduce((s, m) => s + m.avgLatencyMs, 0) / pMetrics.length);
                const totalReqs = pMetrics.reduce((s, m) => s + m.totalRequests, 0);
                const totalErrs = pMetrics.reduce((s, m) => s + m.errorCount, 0);
                const statusColor = avgSuccess >= 0.95 ? tk.success : avgSuccess >= 0.8 ? tk.warning : tk.error;
                const statusLabel = avgSuccess >= 0.95 ? t("modelSettings", "perfHealthy") : avgSuccess >= 0.8 ? t("modelSettings", "perfWarning") : t("modelSettings", "perfError");
                const isBest = bestProvider?.providerId === pid;
                return (
                  <div key={pid} className="p-3 rounded-lg" style={{ border: `1px solid ${isBest ? tk.success + "44" : tk.borderDim}`, background: isBest ? `${tk.success}06` : tk.cardBg }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: `0 0 4px ${statusColor}` }} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>{pid}</span>
                      {isBest && (
                        <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: "7px", color: tk.success, background: `${tk.success}15`, border: `1px solid ${tk.success}33` }}>
                          ★ BEST
                        </span>
                      )}
                      <span className="ml-auto px-1.5 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: "8px", color: statusColor, background: `${statusColor}12`, border: `1px solid ${statusColor}22` }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>
                        {t("modelSettings", "perfSuccessLabel")}: <span style={{ color: statusColor }}>{(avgSuccess * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>
                        {t("modelSettings", "perfLatencyLabel")}: <span style={{ color: avgLatency < 1000 ? tk.success : avgLatency < 3000 ? tk.warning : tk.error }}>{avgLatency}ms</span>
                      </div>
                      <div style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>
                        {t("modelSettings", "perfReqsLabel")}: <span style={{ color: tk.foreground }}>{totalReqs}</span>
                      </div>
                      <div style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>
                        {t("modelSettings", "perfErrorsLabel")}: <span style={{ color: totalErrs > 0 ? tk.error : tk.foregroundMuted }}>{totalErrs}</span>
                      </div>
                    </div>
                    {avgSuccess < 0.95 && (
                      <div className="flex items-center gap-1 mt-2 pt-1.5" style={{ borderTop: `1px solid ${tk.borderDim}` }}>
                        <ArrowRight size={8} color={tk.warning} />
                        <span style={{ fontFamily: tk.fontMono, fontSize: "7px", color: tk.warning }}>
                          {t("modelSettings", "perfFallbackReady")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 性能指标表格 */}
      {metrics.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.cardBorder}`, borderRadius: tk.borderRadius }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: tk.cardBg, borderBottom: `1px solid ${tk.borderDim}` }}>
            <Activity size={12} color={tk.primary} />
            <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>{t("modelSettings", "perfMetrics")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: tk.fontMono, fontSize: "10px" }}>
              <thead>
                <tr style={{ background: tk.backgroundAlt }}>
                  {[
                    t("modelSettings", "perfModelCol"),
                    t("modelSettings", "perfRequestsCol"),
                    t("modelSettings", "perfAvgLatencyCol"),
                    "P95",
                    t("modelSettings", "perfThroughput"),
                    t("modelSettings", "perfSuccessLabel"),
                    t("modelSettings", "perfErrorsLabel"),
                  ].map(h => (
                    <th key={h} className="px-3 py-2 text-left" style={{ color: tk.foregroundMuted, borderBottom: `1px solid ${tk.borderDim}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={`${m.providerId}:${m.modelId}`} className="transition-all hover:opacity-80" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
                    <td className="px-3 py-2" style={{ color: tk.foreground }}>{m.modelName}</td>
                    <td className="px-3 py-2" style={{ color: tk.primary }}>{m.totalRequests}</td>
                    <td className="px-3 py-2" style={{ color: m.avgLatencyMs > 3000 ? tk.error : m.avgLatencyMs > 1500 ? tk.warning : tk.success }}>{m.avgLatencyMs}ms</td>
                    <td className="px-3 py-2" style={{ color: tk.foregroundMuted }}>{m.p95LatencyMs}ms</td>
                    <td className="px-3 py-2" style={{ color: tk.primary }}>{m.throughput.toFixed(1)} t/s</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded" style={{ background: m.successRate >= 0.9 ? `${tk.success}14` : m.successRate >= 0.5 ? `${tk.warning}14` : `${tk.error}14`, color: m.successRate >= 0.9 ? tk.success : m.successRate >= 0.5 ? tk.warning : tk.error }}>
                        {(m.successRate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-3 py-2" style={{ color: m.errorCount > 0 ? tk.error : tk.foregroundMuted }}>{m.errorCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 错误分析 */}
      {errorStats.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.error}1a`, borderRadius: tk.borderRadius }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: `${tk.error}08`, borderBottom: `1px solid ${tk.error}14` }}>
            <AlertTriangle size={12} color={tk.error} />
            <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.error }}>{t("modelSettings", "perfErrorAnalysis")}</span>
          </div>
          <div className="p-3 space-y-2">
            {errorStats.map(es => (
              <div key={es.errorType} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: tk.cardBg, border: `1px solid ${tk.borderDim}` }}>
                <span className="px-1.5 py-0.5 rounded shrink-0" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.error, background: `${tk.error}14` }}>
                  {getErrorTypeLabel(es.errorType, locale)}
                </span>
                <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foreground }}>×{es.count}</span>
                <span className="flex-1 truncate" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
                  {es.affectedModels.join(", ")}
                </span>
                <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
                  {es.topSuggestion}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近错误详情 */}
      {recentErrors.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.borderDim}`, borderRadius: tk.borderRadius }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: tk.cardBg, borderBottom: `1px solid ${tk.borderDim}` }}>
            <Bug size={12} color={tk.warning} />
            <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>{t("modelSettings", "perfRecentErrors")}</span>
          </div>
          <div className="max-h-48 overflow-y-auto neon-scrollbar">
            {recentErrors.map(err => (
              <div key={err.id} className="flex items-start gap-2 px-4 py-2" style={{ borderBottom: `1px solid ${tk.borderDim}` }}>
                <XCircle size={10} color={tk.error} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foreground }}>{err.modelName}</span>
                    <span className="px-1 py-0.5 rounded" style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.error, background: `${tk.error}14` }}>
                      {getErrorTypeLabel(err.errorType, locale)}
                    </span>
                    <span className="ml-auto" style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="truncate" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, marginTop: 1 }}>
                    {err.errorMessage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成本报告 */}
      {costSummaries.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tk.secondary}1a`, borderRadius: tk.borderRadius }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: `${tk.secondary}08`, borderBottom: `1px solid ${tk.secondary}14` }}>
            <Zap size={12} color={tk.secondary} />
            <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.secondary }}>{t("modelSettings", "perfCostReport")}</span>
            <div className="ml-auto flex items-center gap-3" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
              {totalCost.usd > 0 && <span>USD ${totalCost.usd.toFixed(4)}</span>}
              {totalCost.cny > 0 && <span>CNY ¥{totalCost.cny.toFixed(4)}</span>}
            </div>
          </div>
          {(() => {
            const totalCostSum = costSummaries.reduce((s, c) => s + c.totalCost, 0) || 0.001;
            const COST_COLORS = [tk.primary, tk.secondary, tk.success, tk.warning, tk.error, '#8b5cf6'];
            const totalTokens = costSummaries.reduce((s, cs) => s + cs.totalInputTokens + cs.totalOutputTokens, 0);
            return (
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{t("modelSettings", "perfTokenUsage")}</span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foreground }}>{totalTokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex rounded overflow-hidden h-2 mb-2" style={{ background: tk.backgroundAlt }}>
                  {costSummaries.map((cs, i) => {
                    const pct = (cs.totalCost / totalCostSum) * 100;
                    return pct > 0 ? (
                      <div key={cs.providerId} style={{ width: `${pct}%`, background: COST_COLORS[i % COST_COLORS.length], minWidth: 2, transition: "width 0.3s" }} title={`${cs.providerName}: ${pct.toFixed(1)}%`} />
                    ) : null;
                  })}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                  {costSummaries.map((cs, i) => (
                    <div key={cs.providerId} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm" style={{ background: COST_COLORS[i % COST_COLORS.length] }} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: "8px", color: tk.foregroundMuted }}>{cs.providerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="p-3 pt-0 space-y-2">
            {costSummaries.map(cs => (
              <div key={cs.providerId} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${tk.borderDim}` }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: tk.cardBg }}>
                  <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foreground }}>{cs.providerName}</span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>{cs.requestCount} {t("modelSettings", "perfRequests")}</span>
                  <span className="ml-auto" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.secondary }}>
                    {cs.currency === "CNY" ? "¥" : "$"}{cs.totalCost.toFixed(4)}
                  </span>
                </div>
                {cs.models.map(model => (
                  <div key={model.modelId} className="flex items-center gap-2 px-3 py-1.5" style={{ borderTop: `1px solid ${tk.borderDim}` }}>
                    <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, paddingLeft: 12 }}>{model.modelName}</span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
                      ↑{model.inputTokens.toLocaleString()} ↓{model.outputTokens.toLocaleString()}
                    </span>
                    <span className="ml-auto" style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted }}>
                      {cs.currency === "CNY" ? "¥" : "$"}{model.cost.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 清除数据 & 空状态 */}
      {hasData ? (
        <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80 mx-auto" style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foregroundMuted, border: `1px solid ${tk.borderDim}` }}>
          <Trash2 size={10} />{t("modelSettings", "perfClearAll")}
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: tk.backgroundAlt, border: `1px solid ${tk.borderDim}` }}>
            <Activity size={28} color={tk.borderDim} />
          </div>
          <p style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.foregroundMuted }}>{t("modelSettings", "perfNoData")}</p>
          <p style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, opacity: 0.6, marginTop: 4 }}>{t("modelSettings", "perfNoDataHint")}</p>
        </div>
      )}
    </div>
  );
}
