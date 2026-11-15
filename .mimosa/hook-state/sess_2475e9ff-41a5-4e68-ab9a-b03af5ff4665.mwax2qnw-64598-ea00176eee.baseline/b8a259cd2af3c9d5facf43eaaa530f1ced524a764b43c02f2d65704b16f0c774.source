/**
 * @file AIAssistantPanel.tsx
 * @description AI辅助面板，提供模型管理、推理历史和性能统计
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,ai,webgpu,inference,panel
 */

import { useState, useMemo } from 'react'
import {
  X, Cpu, Zap, Clock, CheckCircle2,
  Download, Trash2, Play, BarChart3, Activity,
  HardDrive, Database, RefreshCw,
} from 'lucide-react'
import { useWebGPUInference } from '../hooks/useWebGPUInference'
import { useThemeStore, Z_INDEX, BLUR } from '../store/theme-store'
import { formatSize } from './ui/utils'

/**
 * AI辅助面板属性
 */
export interface AIAssistantPanelProps {
  /** 是否可见 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
}

/**
 * AI辅助面板组件
 *
 * 提供WebGPU AI推理的完整管理界面，包括：
 * - 模型加载/卸载
 * - 推理执行
 * - 性能统计
 * - 推理历史
 *
 * @example
 * ```tsx
 * function App() {
 *   const [visible, setVisible] = useState(false)
 *
 *   return (
 *     <div>
 *       <button onClick={() => setVisible(true)}>
 *         打开AI面板
 *       </button>
 *       <AIAssistantPanel
 *         visible={visible}
 *         onClose={() => setVisible(false)}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
export function AIAssistantPanel({ visible, onClose }: AIAssistantPanelProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()

  // WebGPU推理Hook
  const {
    models,
    activeModel,
    loadedModels,
    isLoadingModel,
    isInferencing,
    webGPUSupported,
    engineType,
    stats,
    loadModel,
    unloadModel,
    unloadAllModels,
    setActiveModel,
    infer,
    clearCache,
    getCacheStats,
  } = useWebGPUInference({
    autoInitialize: true,
  })

  // 状态
  const [activeTab, setActiveTab] = useState<'models' | 'infer' | 'stats' | 'cache'>('models')
  const [testInput, setTestInput] = useState('function helloWorld() {\n  return ')

  // 按类型分组模型 - 必须在条件返回之前调用
  const modelsByType = useMemo(() => {
    const groups: Record<string, typeof models> = {}
    models.forEach((model) => {
      if (!groups[model.type]) {
        groups[model.type] = []
      }
      groups[model.type].push(model)
    })
    return groups
  }, [models])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[5vh]"
      style={{ zIndex: Z_INDEX.topModal + 40, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 900, maxHeight: '85vh',
          background: tk.panelBg, border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: isCyberpunk ? `0 0 40px ${tk.primaryGlow}, 0 0 80px ${tk.primaryGlow}` : tk.shadowHover,
          animation: 'modalIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: tk.border }}>
          <div className="flex items-center gap-2.5">
            <Zap size={16} color={tk.primary} />
            <span style={{ fontFamily: tk.fontDisplay, fontSize: '13px', color: tk.primary, letterSpacing: '2px' }}>
              AI ASSISTANT
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: `${webGPUSupported ? tk.success : tk.warning}15` }}>
              <Cpu size={10} color={webGPUSupported ? tk.success : tk.warning} />
              <span style={{ fontFamily: tk.fontMono, fontSize: '8px', color: webGPUSupported ? tk.success : tk.warning }}>
                {engineType.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-70" style={{ color: tk.foregroundMuted }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 border-b shrink-0" style={{ borderColor: tk.border }}>
          {(['models', 'infer', 'stats', 'cache'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded text-xs transition-all"
              style={{
                fontFamily: tk.fontMono,
                fontSize: '10px',
                letterSpacing: '1px',
                background: activeTab === tab ? `${tk.primary}15` : 'transparent',
                color: activeTab === tab ? tk.primary : tk.foregroundMuted,
                border: activeTab === tab ? `1px solid ${tk.primary}30` : '1px solid transparent',
              }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto neon-scrollbar p-5">
          {/* Models Tab */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                  AVAILABLE MODELS
                </h3>
                {loadedModels.length > 0 && (
                  <button
                    onClick={unloadAllModels}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:opacity-70"
                    style={{ background: `${tk.warning}15`, color: tk.warning, fontFamily: tk.fontMono }}
                  >
                    <Trash2 size={10} />
                    Unload All
                  </button>
                )}
              </div>

              {Object.entries(modelsByType).map(([type, typeModels]) => (
                <div key={type}>
                  <h4 style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginTop: '8px', marginBottom: '4px' }}>
                    {type.toUpperCase()} MODELS
                  </h4>
                  <div className="space-y-2">
                    {typeModels.map((model) => (
                      <div
                        key={model.id}
                        className="p-3 rounded-lg"
                        style={{
                          background: activeModel?.id === model.id ? `${tk.primary}10` : tk.cardBg,
                          border: `1px solid ${activeModel?.id === model.id ? tk.primary : tk.cardBorder}`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.foreground, fontWeight: 'bold' }}>
                                {model.name}
                              </span>
                              {model.loaded && (
                                <CheckCircle2 size={12} color={tk.success} />
                              )}
                              {activeModel?.id === model.id && (
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: `${tk.primary}20`, color: tk.primary, fontFamily: tk.fontMono }}>
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, lineHeight: 1.4 }}>
                              {model.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                              <span>Size: {formatSize(model.size)}</span>
                              <span>Engine: {model.engine.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {model.loaded ? (
                              <button
                                onClick={() => unloadModel(model.id)}
                                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                                style={{ background: `${tk.warning}15`, color: tk.warning, fontFamily: tk.fontMono }}
                              >
                                <Trash2 size={10} />
                                Unload
                              </button>
                            ) : (
                              <button
                                onClick={() => loadModel(model.id)}
                                disabled={isLoadingModel}
                                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70 disabled:opacity-50"
                                style={{ background: `${tk.primary}15`, color: tk.primary, fontFamily: tk.fontMono }}
                              >
                                <Download size={10} />
                                {isLoadingModel ? 'Loading...' : 'Load'}
                              </button>
                            )}
                            {!activeModel && model.loaded && (
                              <button
                                onClick={() => setActiveModel(model.id)}
                                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-all hover:opacity-70"
                                style={{ background: `${tk.success}15`, color: tk.success, fontFamily: tk.fontMono }}
                              >
                                <Play size={10} />
                                Activate
                              </button>
                            )}
                          </div>
                        </div>
                        {model.loadProgress > 0 && model.loadProgress < 100 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1" style={{ fontFamily: tk.fontMono, fontSize: '8px', color: tk.foregroundMuted }}>
                              <span>Loading...</span>
                              <span>{model.loadProgress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-1 rounded" style={{ background: tk.borderDim }}>
                              <div
                                className="h-full rounded"
                                style={{
                                  width: `${model.loadProgress}%`,
                                  background: tk.primary,
                                  transition: 'width 0.2s ease',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Infer Tab */}
          {activeTab === 'infer' && (
            <div className="space-y-4">
              <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                TEST INFERENCE
              </h3>

              <div>
                <label style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, display: 'block', marginBottom: '4px' }}>
                  Active Model: {activeModel?.name || 'None (select a model first)'}
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  disabled={!activeModel || isInferencing}
                  placeholder="Enter code or text for AI completion..."
                  className="w-full p-3 rounded-lg text-xs font-mono resize-none"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '11px',
                    minHeight: '120px',
                    background: tk.cardBg,
                    border: `1px solid ${tk.cardBorder}`,
                    color: tk.foreground,
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={() => activeModel && infer(testInput)}
                disabled={!activeModel || isInferencing}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                style={{
                  fontFamily: tk.fontMono,
                  background: isInferencing ? `${tk.foregroundMuted}20` : `${tk.primary}15`,
                  color: isInferencing ? tk.foregroundMuted : tk.primary,
                  border: `1px solid ${tk.primary}30`,
                }}
              >
                {isInferencing ? (
                  <>
                    <Activity size={14} className="animate-spin" />
                    Inferring...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Run Inference
                  </>
                )}
              </button>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                PERFORMANCE STATS
              </h3>

              <div className="grid grid-cols-4 gap-3">
                <StatCard
                  icon={Zap}
                  label="Total Inferences"
                  value={stats.totalInferences}
                  color={tk.primary}
                />
                <StatCard
                  icon={Clock}
                  label="Avg Time"
                  value={`${stats.avgInferenceTime.toFixed(0)}ms`}
                  color={tk.success}
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Success Rate"
                  value={`${stats.successRate.toFixed(1)}%`}
                  color={tk.warning}
                />
                <StatCard
                  icon={BarChart3}
                  label="Engine"
                  value={engineType.toUpperCase()}
                  color={tk.error}
                />
              </div>

              <div className="p-4 rounded-lg" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                    SYSTEM INFO
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2" style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>WebGPU Support:</span>
                    <span className="ml-2" style={{ color: webGPUSupported ? tk.success : tk.warning }}>
                      {webGPUSupported ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>Active Model:</span>
                    <span className="ml-2" style={{ color: activeModel ? tk.primary : tk.foregroundMuted }}>
                      {activeModel?.name || 'None'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>Loaded Models:</span>
                    <span className="ml-2" style={{ color: tk.primary }}>
                      {loadedModels.length} / {models.length}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: tk.foregroundMuted }}>Engine Type:</span>
                    <span className="ml-2" style={{ color: tk.primary }}>
                      {engineType.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cache Tab */}
          {activeTab === 'cache' && (
            <div className="space-y-4">
              <h3 style={{ fontFamily: tk.fontDisplay, fontSize: '11px', color: tk.primary, letterSpacing: '2px' }}>
                CACHE MANAGEMENT
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Database}
                  label="Cache Size"
                  value={`${(getCacheStats().size / 1024 / 1024).toFixed(1)} MB`}
                  color={tk.primary}
                />
                <StatCard
                  icon={HardDrive}
                  label="Cache Usage"
                  value={`${getCacheStats().usage.toFixed(1)}%`}
                  color={getCacheStats().usage > 80 ? tk.error : tk.success}
                />
              </div>

              <div className="p-4 rounded-lg" style={{ background: tk.cardBg, border: `1px solid ${tk.cardBorder}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Database size={12} color={tk.primary} />
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                    INDEXEDDB CACHE
                  </span>
                </div>
                <div className="space-y-3">
                  {/* Cache progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1" style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                      <span>Storage Usage</span>
                      <span>{(getCacheStats().size / 1024 / 1024).toFixed(1)} / {(getCacheStats().max / 1024 / 1024).toFixed(0)} MB</span>
                    </div>
                    <div className="w-full h-2 rounded" style={{ background: tk.borderDim }}>
                      <div
                        className="h-full rounded transition-all duration-300"
                        style={{
                          width: `${getCacheStats().usage}%`,
                          background: getCacheStats().usage > 80 ? tk.error : getCacheStats().usage > 50 ? tk.warning : tk.success,
                        }}
                      />
                    </div>
                  </div>

                  {/* Cache info */}
                  <div className="grid grid-cols-2 gap-2" style={{ fontFamily: tk.fontMono, fontSize: '9px' }}>
                    <div>
                      <span style={{ color: tk.foregroundMuted }}>Database Name:</span>
                      <span className="ml-2" style={{ color: tk.primary }}>
                        yyc3-webgpu-cache
                      </span>
                    </div>
                    <div>
                      <span style={{ color: tk.foregroundMuted }}>Max Cache Size:</span>
                      <span className="ml-2" style={{ color: tk.primary }}>
                        500 MB
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        loadedModels.forEach((m) => loadModel(m.id))
                      }}
                      disabled={isLoadingModel || loadedModels.length === 0}
                      className="flex items-center gap-1 px-3 py-2 rounded text-xs transition-all hover:opacity-70 disabled:opacity-50 flex-1"
                      style={{
                        fontFamily: tk.fontMono,
                        background: `${tk.success}15`,
                        color: tk.success,
                        border: `1px solid ${tk.success}30`,
                      }}
                    >
                      <RefreshCw size={10} />
                      Reload All Models
                    </button>
                    <button
                      onClick={clearCache}
                      className="flex items-center gap-1 px-3 py-2 rounded text-xs transition-all hover:opacity-70 flex-1"
                      style={{
                        fontFamily: tk.fontMono,
                        background: `${tk.error}15`,
                        color: tk.error,
                        border: `1px solid ${tk.error}30`,
                      }}
                    >
                      <Trash2 size={10} />
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 统计卡片组件
 */
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  const { tokens: tk } = useThemeStore()

  return (
    <div className="p-3 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <Icon size={16} color={color} className="mb-1" />
      <div style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontFamily: tk.fontMono, fontSize: '16px', color, fontWeight: 'bold' }}>
        {value}
      </div>
    </div>
  )
}
