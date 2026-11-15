/**
 * @file LocalModelDashboard.tsx
 * @description 本地模型监控面板 — 可视化所有节点状态与模型分布
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2026-06-03
 * @status stable
 */

import {
  Activity,
  AlertTriangle,
  Cpu,
  Database,
  HardDrive,
  Loader2,
  Network,
  RefreshCw,
  Server,
  Wifi,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { BLUR, Z_INDEX, useThemeStore, type ThemeTokens } from '../store/theme-store'
import { createLogger } from '../utils/logger'

import {
  findModelsByCapability,
  loadNodeState,
  saveNodeState,
  scanAllNodes,
  type ModelCapability,
  type ModelNode,
} from '../utils/local-model-infra'

const logger = createLogger('LocalModelDashboard')

interface LocalModelDashboardProps {
  onClose: () => void
}

const CAPABILITY_LABELS: Record<ModelCapability, string> = {
  chat: '对话',
  reasoning: '推理',
  vision: '视觉',
  embedding: '嵌入',
  reranker: '重排序',
  'image-gen': '图像生成',
  'video-gen': '视频生成',
  code: '代码',
  audio: '音频',
  finetune: '微调',
}

const CAPABILITY_COLORS: Record<ModelCapability, string> = {
  chat: '#22c55e',
  reasoning: '#a855f7',
  vision: '#f59e0b',
  embedding: '#3b82f6',
  reranker: '#8b5cf6',
  'image-gen': '#ec4899',
  'video-gen': '#ef4444',
  code: '#06b6d4',
  audio: '#14b8a6',
  finetune: '#a855f7',
}

export function LocalModelDashboard({ onClose }: LocalModelDashboardProps) {
  const { tokens } = useThemeStore()
  const [nodes, setNodes] = useState<ModelNode[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'routing'>('overview')

  const isDark = tokens.id === 'cyberpunk' || tokens.background === '#0a0a0a'

  const loadNodes = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const cached = loadNodeState()
      if (cached) setNodes(cached)
      const fresh = await scanAllNodes()
      setNodes(fresh)
      saveNodeState(fresh)
    } catch (err) {
      setError(err instanceof Error ? err.message : '扫描失败')
      logger.error('Failed to scan nodes', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNodes() }, [loadNodes])

  const handleRefresh = useCallback(async () => {
    setScanning(true)
    await loadNodes(false)
    setScanning(false)
  }, [loadNodes])

  const onlineCount = nodes.filter(n => n.status === 'online').length
  const totalModels = nodes.reduce((s, n) => s + (n.models?.length ?? 0), 0)
  const modelCapabilities = new Set<ModelCapability>()
  for (const node of nodes) {
    if (!node.models) continue
    for (const m of node.models) {
      for (const cap of m.capabilities) modelCapabilities.add(cap)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: Z_INDEX.modal,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
          backdropFilter: BLUR.lg, WebkitBackdropFilter: BLUR.lg,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'relative',
        width: '720px', maxWidth: '90vw',
        maxHeight: '80vh', overflow: 'hidden',
        backgroundColor: tokens.background,
        border: `1px solid ${tokens.border}`,
        borderRadius: '12px',
        display: 'flex', flexDirection: 'column',
        boxShadow: isDark
          ? '0 25px 50px rgba(0,0,0,0.5)'
          : '0 25px 50px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${tokens.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: tokens.primary + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={18} color={tokens.primary} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>本地模型基础设施</div>
              <div style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
                {loading ? '扫描中...' : `${onlineCount}/${nodes.length} 节点在线 · ${totalModels} 模型 · ${modelCapabilities.size} 种能力`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleRefresh}
              disabled={scanning}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: 6,
                backgroundColor: tokens.primary + '15',
                border: `1px solid ${tokens.border}`,
                color: tokens.foreground, cursor: 'pointer',
                fontSize: '11px', fontWeight: 500, opacity: scanning ? 0.6 : 1,
              }}
            >
              <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 6,
                border: 'none', cursor: 'pointer',
                backgroundColor: 'transparent', color: tokens.foregroundMuted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: `1px solid ${tokens.border}`,
          padding: '0 20px',
        }}>
          {(['overview', 'routing'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                backgroundColor: 'transparent',
                color: activeTab === tab ? tokens.primary : tokens.foregroundMuted,
                fontSize: '12px', fontWeight: activeTab === tab ? 600 : 400,
                borderBottom: activeTab === tab ? `2px solid ${tokens.primary}` : '2px solid transparent',
              }}
            >
              {tab === 'overview' ? '节点概览' : '路由诊断'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 8 }}>
              <Loader2 size={20} className="animate-spin" />
              <span style={{ color: tokens.foregroundMuted, fontSize: '13px' }}>扫描本地节点...</span>
            </div>
          ) : error ? (
            <div style={{
              padding: '20px', borderRadius: 8,
              backgroundColor: '#ef444410', border: '1px solid #ef444430',
              color: '#ef4444', fontSize: '13px',
            }}>
              <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              {error}
            </div>
          ) : activeTab === 'overview' ? (
            <OverviewTab nodes={nodes} tokens={tokens} isDark={isDark} />
          ) : (
            <RoutingTab nodes={nodes} tokens={tokens} />
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 概览标签页 =====
function OverviewTab({ nodes, tokens, isDark }: {
  nodes: ModelNode[]
  tokens: ThemeTokens
  isDark: boolean
}) {
  if (nodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: tokens.foregroundMuted, fontSize: '13px' }}>
        未发现任何节点
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {nodes.map(node => (
        <NodeCard key={node.id} node={node} tokens={tokens} isDark={isDark} />
      ))}
    </div>
  )
}

function NodeCard({ node, tokens, isDark }: {
  node: ModelNode
  tokens: ThemeTokens
  isDark: boolean
}) {
  const isOnline = node.status === 'online'
  const typeIcon = node.type === 'local' ? <HardDrive size={14} /> :
    node.type === 'dgx' ? <Cpu size={14} /> :
      node.type === 'nas' ? <Database size={14} /> : <Server size={14} />
  const typeLabel = node.type === 'local' ? '本机' :
    node.type === 'dgx' ? 'DGX Spark' :
      node.type === 'nas' ? 'NAS' : '云端'

  return (
    <div style={{
      borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${isOnline ? tokens.border : '#ef444430'}`,
      backgroundColor: isOnline
        ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
        : (isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.04)'),
    }}>
      {/* Node header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 14px',
        borderBottom: `1px solid ${tokens.border}`,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          backgroundColor: isOnline ? '#22c55e' : '#ef4444',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tokens.foregroundMuted, fontSize: '11px' }}>
          {typeIcon}
          <span>{typeLabel}</span>
        </div>
        <div style={{ fontWeight: 600, fontSize: '13px', flex: 1 }}>{node.name}</div>
        <div style={{ fontSize: '11px', color: tokens.foregroundMuted }}>
          {node.host}:{node.port}
        </div>
        {isOnline && node.latencyMs !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '11px', color: node.latencyMs < 100 ? '#22c55e' : node.latencyMs < 300 ? '#f59e0b' : '#ef4444',
          }}>
            <Wifi size={11} />
            {node.latencyMs}ms
          </div>
        )}
      </div>

      {/* SSH & 路径信息 */}
      {(node.ssh || node.modelPaths || node.description) && (
        <div style={{
          padding: '8px 14px',
          borderBottom: `1px solid ${tokens.borderDim}`,
          fontSize: '10px',
          fontFamily: tokens.fontMono,
          color: tokens.foregroundMuted,
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
        }}>
          {node.description && (
            <div style={{ opacity: 0.7 }}>📋 {node.description}</div>
          )}
          {node.ssh && (
            <div>🔗 ssh {node.ssh.user}@{node.host} -p {node.ssh.port}</div>
          )}
          {node.modelPaths && node.modelPaths.length > 0 && (
            <div>
              📁 {node.modelPaths.map((p, i) => (
                <span key={i}>{i > 0 && ', '}{p}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Models */}
      {node.models && node.models.length > 0 ? (
        <div style={{ padding: '8px 14px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '6px',
          }}>
            {node.models.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 8px', borderRadius: 6,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                fontSize: '11px',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: m.status === 'online' ? '#22c55e' : '#ef4444',
                }} />
                <span style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </span>
                <span style={{ color: tokens.foregroundMuted, fontSize: '10px' }}>{m.size}</span>
                {m.isFinetuned && (
                  <span style={{
                    display: 'inline-block', padding: '1px 5px', borderRadius: 3,
                    fontSize: '8px', fontWeight: 700,
                    backgroundColor: '#a855f720', color: '#a855f7',
                  }}>
                    微调
                  </span>
                )}
                <div style={{ display: 'flex', gap: 2 }}>
                  {m.capabilities.slice(0, 3).map(cap => (
                    <span key={cap} style={{
                      display: 'inline-block', padding: '1px 5px', borderRadius: 3,
                      fontSize: '9px', fontWeight: 500,
                      backgroundColor: CAPABILITY_COLORS[cap] + '20',
                      color: CAPABILITY_COLORS[cap],
                    }}>
                      {CAPABILITY_LABELS[cap] || cap}
                    </span>
                  ))}
                  {m.capabilities.length > 3 && (
                    <span style={{ fontSize: '9px', color: tokens.foregroundMuted }}>
                      +{m.capabilities.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 14px', fontSize: '11px', color: tokens.foregroundMuted }}>
          {isOnline ? '该节点暂无模型' : '节点离线'}
        </div>
      )}
    </div>
  )
}

// ===== 路由诊断标签页 =====
const DIAG_CAPABILITIES: ModelCapability[] = ['chat', 'reasoning', 'vision', 'embedding', 'image-gen', 'code', 'video-gen']

function RoutingTab({ nodes, tokens }: { nodes: ModelNode[]; tokens: ThemeTokens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '12px', color: tokens.foregroundMuted, marginBottom: 4 }}>
        按能力查询可用模型路由
      </div>
      {DIAG_CAPABILITIES.map(cap => {
        const candidates = findModelsByCapability(nodes, cap)
        return (
          <div key={cap} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: 6,
            border: `1px solid ${tokens.border}`,
            opacity: candidates.length > 0 ? 1 : 0.5,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: CAPABILITY_COLORS[cap] + '20',
            }}>
              <Activity size={14} color={CAPABILITY_COLORS[cap]} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {CAPABILITY_LABELS[cap]}
                <span style={{
                  display: 'inline-block', padding: '0 5px', borderRadius: 3,
                  fontSize: '10px', fontWeight: 600,
                  backgroundColor: candidates.length > 0 ? '#22c55e20' : '#ef444420',
                  color: candidates.length > 0 ? '#22c55e' : '#ef4444',
                }}>
                  {candidates.length > 0 ? `${candidates.length} 可用` : '不可用'}
                </span>
              </div>
              {candidates.length > 0 && (
                <div style={{ fontSize: '10px', color: tokens.foregroundMuted, marginTop: 2 }}>
                  {candidates.map((c, i) => (
                    <span key={i}>
                      {i > 0 && ' → '}
                      <span style={{ color: c.node.type === 'local' ? '#22c55e' : '#a855f7' }}>
                        {c.model.name}
                      </span>
                      <span>@{c.node.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Network size={14} color={tokens.foregroundMuted} />
          </div>
        )
      })}
    </div>
  )
}
