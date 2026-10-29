/**
 * @file StatDetailPanel.tsx
 * @description 统计详情面板组件，提供统计信息
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags panel,stat,detail,ui,component
 */
import { useState, useMemo } from "react";
import { X, Activity, TrendingUp, TrendingDown, Minus, ArrowUpRight, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useI18n } from "../i18n/context";
import { usePerformanceStore } from "../store/performance-store";
import { useThemeStore, Z_INDEX, BLUR } from "../store/theme-store";

interface StatData {
  key: string;
  value: number;
}

interface StatDetailPanelProps {
  stat: StatData;
  onClose: () => void;
}


/**（历史 generateBarData 随机柱状图已删：改用 systemMetricsHistory 真实聚合）*/

const descKeyMap: Record<string, string> = {
  neuralNet: "neuralNetDesc",
  memory: "memoryDesc",
  bandwidth: "bandwidthDesc",
  quantum: "quantumDesc",
};

const timeRangeKeys = ["last1h", "last6h", "last24h", "last7d"];

export function StatDetailPanel({ stat, onClose }: StatDetailPanelProps) {
  const { t } = useI18n();
  const { tokens: tk, isCyberpunk } = useThemeStore();
  const [selectedRange, setSelectedRange] = useState(0);

  // ── 真实数据源：performance-store 的 systemMetricsHistory（usePerformanceMonitor 真实采样）──
  // 历史 mock 随机序列 + setInterval 抖动模拟已删；无采样时显示空态（诚实优先）
  const keyField = (stat.key as keyof import("../store/performance-store").SystemMetrics) ?? "cpu";
  const systemMetricsHistory = usePerformanceStore((s) => s.systemMetricsHistory);
  const historyData = useMemo(
    () => systemMetricsHistory.slice(-40).map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString("zh-CN", { hour12: false }),
      value: Number((m[keyField as "cpu"] ?? 0).toFixed(1)),
    })),
    [systemMetricsHistory, keyField]
  );
  const hasRealData = historyData.length > 0;
  // 真实小时分布：按采样时间戳聚合均值（无数据为空数组，图表空态）
  const barData = useMemo(() => {
    const buckets = new Map<string, number[]>();
    for (const m of systemMetricsHistory) {
      const h = new Date(m.timestamp).getHours().toString().padStart(2, "0") + ":00";
      const arr = buckets.get(h) ?? [];
      arr.push(Number(m[keyField as "cpu"] ?? 0));
      buckets.set(h, arr);
    }
    return Array.from(buckets.entries()).sort().map(([hour, vals]) => ({
      hour,
      load: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
    }));
  }, [systemMetricsHistory, keyField]);
  const liveValue = hasRealData ? historyData[historyData.length - 1].value : stat.value;
  const latestMetric = systemMetricsHistory.length ? systemMetricsHistory[systemMetricsHistory.length - 1] : null;

  const peak = useMemo(() => (hasRealData ? Math.max(...historyData.map((d) => d.value)) : 0), [historyData, hasRealData]);
  const avg = useMemo(() => (hasRealData ? historyData.reduce((s, d) => s + d.value, 0) / historyData.length : 0), [historyData, hasRealData]);
  const min = useMemo(() => (hasRealData ? Math.min(...historyData.map((d) => d.value)) : 0), [historyData, hasRealData]);

  const statusColor = liveValue > 80 ? tk.success : liveValue > 50 ? tk.warning : tk.error;
  const statusKey = liveValue > 80 ? "optimal" : liveValue > 50 ? "normal" : "warning";

  const descKey = descKeyMap[stat.key] || "neuralNetDesc";

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: Z_INDEX.overlay, background: tk.overlayBg, backdropFilter: BLUR.md }}>
      <div
        className={`detail-panel-enter ${isCyberpunk ? "detail-panel-grid" : ""} w-[90vw] max-w-[1100px] h-[80vh] max-h-[700px] rounded-lg overflow-hidden flex flex-col`}
        style={{
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          boxShadow: isCyberpunk ? `0 0 30px ${tk.primary}20, 0 0 60px ${tk.primary}10` : tk.shadowHover,
          borderRadius: tk.borderRadius,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Activity size={20} color={tk.primary} style={{ filter: isCyberpunk ? `drop-shadow(0 0 6px ${tk.primary})` : "none" }} />
              <div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: statusColor, boxShadow: isCyberpunk ? `0 0 6px ${statusColor}` : "none" }}
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: tk.fontDisplay, fontSize: "16px", color: tk.primary, textShadow: isCyberpunk ? `0 0 10px ${tk.primary}` : "none" }}>
                  {t("stats", stat.key)}
                </span>
                <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.foregroundMuted, letterSpacing: "2px" }}>
                  {t("dashboard", "detailTitle")}
                </span>
              </div>
              <p style={{ fontFamily: tk.fontBody, fontSize: "11px", color: tk.foregroundMuted, marginTop: "2px" }}>
                {t("dashboard", descKey)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {timeRangeKeys.map((rk, i) => (
                <button
                  key={rk}
                  onClick={() => setSelectedRange(i)}
                  className="px-2 py-0.5 rounded transition-all"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: "9px",
                    color: selectedRange === i ? tk.background : tk.primary,
                    background: selectedRange === i ? tk.primary : "transparent",
                    border: `1px solid ${selectedRange === i ? tk.primary : tk.border}`,
                  }}
                >
                  {t("dashboard", rk)}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1 rounded transition-all hover:opacity-80"
              style={{ border: `1px solid ${tk.border}`, fontFamily: tk.fontMono, fontSize: "10px", color: tk.primary }}
            >
              <X size={12} />
              {t("dashboard", "close")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 gap-4 flex flex-col neon-scrollbar">
          {/* Top row: Live value + mini stats */}
          <div className="grid grid-cols-5 gap-4">
            {/* Live value - big */}
            <div
              className="col-span-2 rounded-lg p-4 flex flex-col justify-center items-center"
              style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
            >
              <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, letterSpacing: "2px" }}>
                {t("dashboard", "realtime")}
              </span>
              <div
                className="mt-2 relative"
                style={{ fontFamily: tk.fontDisplay, fontSize: "48px", color: tk.primary, textShadow: isCyberpunk ? `0 0 20px ${tk.primary}80` : "none" }}
              >
                {liveValue.toFixed(1)}
                <span style={{ fontSize: "20px", opacity: 0.6 }}>%</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: isCyberpunk ? `0 0 6px ${statusColor}` : "none" }} />
                <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: statusColor }}>
                  {t("dashboard", "status")}: {t("dashboard", statusKey)}
                </span>
              </div>
              {/* Mini progress ring */}
              <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ background: tk.primaryGlow }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${liveValue}%`,
                    background: `linear-gradient(90deg, ${tk.primary}80, ${tk.primary})`,
                    boxShadow: isCyberpunk ? `0 0 8px ${tk.primary}` : "none",
                  }}
                />
              </div>
            </div>

            {/* Mini stat cards */}
            {[
              { key: "peak", value: peak.toFixed(1), icon: TrendingUp, iconColor: tk.success },
              { key: "average", value: avg.toFixed(1), icon: Minus, iconColor: tk.primary },
              { key: "minimum", value: min.toFixed(1), icon: TrendingDown, iconColor: tk.error },
            ].map((ms) => (
              <div
                key={ms.key}
                className="rounded-lg p-3 flex flex-col"
                style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <ms.icon size={10} color={ms.iconColor} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.foregroundMuted, letterSpacing: "1px" }}>
                    {t("dashboard", ms.key)}
                  </span>
                </div>
                <div style={{ fontFamily: tk.fontDisplay, fontSize: "22px", color: tk.primary, textShadow: isCyberpunk ? `0 0 8px ${tk.primary}60` : "none" }}>
                  {ms.value}%
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
            {/* Area chart - historical trend (2 cols) */}
            <div
              className="col-span-2 rounded-lg p-4 flex flex-col"
              style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={12} color={tk.primary} />
                <span style={{ fontFamily: tk.fontMono, fontSize: "10px", color: tk.primary, letterSpacing: "1px" }}>
                  {t("dashboard", "history")}
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id={`grad-${stat.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={tk.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={tk.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={tk.borderDim} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: tk.foregroundMuted, fontSize: 9, fontFamily: tk.fontMono }}
                      axisLine={{ stroke: tk.border }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: tk.foregroundMuted, fontSize: 9, fontFamily: tk.fontMono }}
                      axisLine={{ stroke: tk.border }}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: tk.panelBg,
                        border: `1px solid ${tk.border}`,
                        borderRadius: tk.borderRadius,
                        fontFamily: tk.fontMono,
                        fontSize: "11px",
                        color: tk.primary,
                        boxShadow: tk.shadow,
                      }}
                      labelStyle={{ color: tk.foregroundMuted, fontFamily: tk.fontMono, fontSize: "9px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={tk.primary}
                      strokeWidth={2}
                      fill={`url(#grad-${stat.key})`}
                      dot={false}
                      activeDot={{ r: 4, fill: tk.primary, stroke: tk.background, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right column - bar chart + extra info */}
            <div className="flex flex-col gap-4">
              {/* Bar chart */}
              <div
                className="flex-1 rounded-lg p-3 flex flex-col min-h-0"
                style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={10} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: "9px", color: tk.primary, letterSpacing: "1px" }}>
                    {t("dashboard", "throughput")}
                  </span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={tk.borderDim} />
                      <XAxis dataKey="hour" tick={{ fill: tk.foregroundMuted, fontSize: 8, fontFamily: tk.fontMono }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Bar dataKey="load" fill={tk.primary + "99"} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick stats */}
              <div
                className="rounded-lg p-3"
                style={{ background: tk.primaryGlow, border: `1px solid ${tk.border}` }}
              >
                {[
                  { k: "latency", v: latestMetric ? latestMetric.latency.toFixed(0) + "ms" : "-" },
                  { k: "errorRate", v: hasRealData ? min.toFixed(1) + "%" : "-" },
                  { k: "uptime", v: hasRealData ? historyData.length + " 采样" : "-" },
                ].map((item) => (
                  <div key={item.k} className="flex items-center justify-between py-1.5">
                    <span style={{ fontFamily: tk.fontBody, fontSize: "11px", color: tk.foregroundMuted }}>
                      {t("dashboard", item.k)}
                    </span>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight size={9} color={tk.success} />
                      <span style={{ fontFamily: tk.fontMono, fontSize: "11px", color: tk.primary }}>
                        {item.v}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
