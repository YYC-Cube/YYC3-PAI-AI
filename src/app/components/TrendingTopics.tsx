/**
 * @file TrendingTopics.tsx
 * @description C1: 热点选题推荐 — 发现热门话题，快速开始创作
 * 支持话题热度追踪、分类筛选、一键发送到AI写作
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2026-06-03
 * @status active
 * @tags [self-media],[trending],[topics]
 */

'use client'

import {
  BarChart3, Clock, Flame, RefreshCw, Search, Send, Sparkles, TrendingUp, X
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSelfMediaStore } from '../store/self-media-store'
import { BLUR, Z_INDEX, useThemeStore } from '../store/theme-store'

// ── Types ──

export interface TrendingTopic {
  id: string
  title: string
  heat: number // 0-100
  category: string
  platform: string
  trend: 'up' | 'down' | 'stable'
  sentiment: 'positive' | 'neutral' | 'negative'
  description?: string
  source?: string
}

export interface TrendingTopicsProps {
  visible: boolean
  onClose: () => void
}

// ── Mock Data ──

const MOCK_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'tech', name: '科技' },
  { id: 'ai', name: 'AI' },
  { id: 'life', name: '生活' },
  { id: 'business', name: '商业' },
  { id: 'culture', name: '文化' },
  { id: 'education', name: '教育' },
]

const MOCK_TOPICS: TrendingTopic[] = [
  { id: 't1', title: 'GPT-5 发布：多模态能力全面升级，开发者怎么看？', heat: 98, category: 'ai', platform: '知乎', trend: 'up', sentiment: 'positive', description: 'OpenAI 最新一代模型的多模态能力引发行业热议', source: '知乎热榜' },
  { id: 't2', title: '2026年最值得学习的编程语言排行榜', heat: 92, category: 'tech', platform: '公众号', trend: 'up', sentiment: 'neutral', description: 'Rust 持续上升，Python 依旧强势', source: '掘金热榜' },
  { id: 't3', title: '小红书爆款笔记的「流量密码」全解析', heat: 95, category: 'business', platform: '小红书', trend: 'up', sentiment: 'positive', source: '小红书热搜' },
  { id: 't4', title: 'AI 编程助手全面对比：Cursor vs Copilot vs Trae', heat: 89, category: 'ai', platform: 'B站', trend: 'up', sentiment: 'neutral', description: '深度评测三大AI编程工具的实际体验', source: 'B站热门' },
  { id: 't5', title: '远程办公两年后，为什么大厂开始要求「回办公室」？', heat: 85, category: 'business', platform: '知乎', trend: 'down', sentiment: 'negative', source: '知乎热榜' },
  { id: 't6', title: '自媒体的「内容矩阵」策略：如何在5个平台同步增长', heat: 82, category: 'business', platform: '公众号', trend: 'up', sentiment: 'positive', source: '36氪' },
  { id: 't7', title: '从零开始学 Stable Diffusion：AI 绘画入门完全指南', heat: 78, category: 'ai', platform: '小红书', trend: 'stable', sentiment: 'positive', source: '小红书热搜' },
  { id: 't8', title: '2026年高考志愿填报：计算机还值得选吗？', heat: 90, category: 'education', platform: '知乎', trend: 'up', sentiment: 'neutral', source: '知乎热榜' },
  { id: 't9', title: '打工人的「副业刚需」：自媒体月入过万的真实路径', heat: 80, category: 'life', platform: '公众号', trend: 'stable', sentiment: 'positive', source: '微信热门' },
  { id: 't10', title: '苹果 Vision Pro 2 发布：空间计算的下一步', heat: 76, category: 'tech', platform: 'B站', trend: 'down', sentiment: 'neutral', source: 'B站热门' },
  { id: 't11', title: '「躺平」还是「内卷」：Z世代的职场观正在改变', heat: 73, category: 'culture', platform: '知乎', trend: 'stable', sentiment: 'neutral', source: '知乎热榜' },
  { id: 't12', title: 'AI 时代的「数据主权」：个人数据保护的困境与出路', heat: 70, category: 'ai', platform: '公众号', trend: 'up', sentiment: 'negative', source: '虎嗅' },
  { id: 't13', title: '小红书「素人博主」成长攻略：从0到1万粉丝', heat: 86, category: 'business', platform: '小红书', trend: 'up', sentiment: 'positive', source: '小红书热搜' },
  { id: 't14', title: 'Web3 之后是什么？AI+区块链的新叙事', heat: 65, category: 'tech', platform: 'Twitter', trend: 'down', sentiment: 'neutral', source: 'Twitter趋势' },
  { id: 't15', title: '每天15分钟：一个普通人的AI工具学习计划', heat: 74, category: 'education', platform: '小红书', trend: 'up', sentiment: 'positive', source: '小红书热搜' },
]

// ── Helpers ──

function getHeatColor(heat: number): string {
  if (heat >= 90) return '#ef4444'
  if (heat >= 80) return '#f97316'
  if (heat >= 70) return '#eab308'
  return '#6b7280'
}

function getSentimentLabel(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return '正面'
    case 'negative': return '负面'
    default: return '中性'
  }
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return '#059669'
    case 'negative': return '#dc2626'
    default: return '#6b7280'
  }
}

// ── Main Component ──

export function TrendingTopics({ visible, onClose }: TrendingTopicsProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { panelActions } = useSelfMediaStore()

  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null)
  // 真实数据模式：配置 VITE_TRENDING_API 后启用（返回 {topics:[{id,title,category,heat,description}]}）
  const [liveTopics, setLiveTopics] = useState<TrendingTopic[] | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Filtered topics
  const filteredTopics = useMemo(() => {
    let list = liveTopics ?? MOCK_TOPICS
    if (activeCategory !== 'all') {
      list = list.filter(t => t.category === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    // Sort by heat descending
    return [...list].sort((a, b) => b.heat - a.heat)
  }, [activeCategory, searchQuery, liveTopics])

  // 刷新：配置了真实数据源则拉取（失败诚实提示）；未配置则明确告知离线
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setFetchError(null)
    const api = import.meta.env.VITE_TRENDING_API as string | undefined
    if (!api) {
      setFetchError('未配置真实热点数据源（VITE_TRENDING_API）——当前展示离线示例，不代表实时热点。')
      setRefreshing(false)
      return
    }
    try {
      const resp = await fetch(api)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      if (Array.isArray(data?.topics) && data.topics.length) {
        setLiveTopics(data.topics as TrendingTopic[])
      } else {
        throw new Error('响应缺少 topics 数组')
      }
    } catch (e) {
      setFetchError(`拉取失败：${e instanceof Error ? e.message : String(e)}（继续展示离线示例）`)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Send topic to AI writing
  const handleWriteTopic = useCallback((topic: TrendingTopic) => {
    panelActions?.openAIWriting({
      topic: topic.title,
      mode: 'title',
    })
    onClose()
  }, [panelActions, onClose])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: tk.overlayBg,
          backdropFilter: BLUR.lg,
          WebkitBackdropFilter: BLUR.lg,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '780px',
          maxWidth: '94vw',
          maxHeight: '85vh',
          background: tk.panelBg,
          border: `1px solid ${tk.border}`,
          borderRadius: tk.borderRadius,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 20px 60px ${tk.shadow}`,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid ${tk.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={16} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: tk.fontDisplay }}>
              热点选题
            </span>
            <span style={{ fontSize: '11px', color: tk.foregroundMuted }}>
              发现热门话题，快速开始创作
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: 'transparent',
                border: `1px solid ${tk.border}`,
                borderRadius: '6px',
                color: tk.foregroundMuted,
                fontSize: '10px',
                cursor: 'pointer',
                opacity: refreshing ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                background: 'transparent',
                border: 'none',
                color: tk.foregroundMuted,
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Search & Category ── */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: `1px solid ${tk.borderDim}`,
          }}
        >
          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: tk.background,
              border: `1px solid ${tk.border}`,
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          >
            <Search size={14} style={{ color: tk.foregroundMuted }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索热门话题..."
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: tk.foreground,
                fontSize: '12px',
                outline: 'none',
                fontFamily: tk.fontBody,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: tk.foregroundMuted, cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Categories */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {MOCK_CATEGORIES.map(cat => {
              const count = cat.id === 'all'
                ? MOCK_TOPICS.length
                : MOCK_TOPICS.filter(t => t.category === cat.id).length
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    background: isActive ? tk.primaryDim : 'transparent',
                    border: `1px solid ${isActive ? tk.primary : tk.border}`,
                    borderRadius: '14px',
                    color: isActive ? tk.primary : tk.foregroundMuted,
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {cat.name} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Topic List ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 16px' }}>
          {filteredTopics.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px',
              color: tk.foregroundMuted,
            }}>
              <Search size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <span style={{ fontSize: '13px' }}>未找到匹配的话题</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredTopics.map((topic, index) => {
                const isSelected = selectedTopic?.id === topic.id
                const heatColor = getHeatColor(topic.heat)
                const heatBarWidth = `${topic.heat}%`

                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopic(isSelected ? null : topic)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSelected
                        ? (isCyberpunk ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)')
                        : 'transparent',
                      border: `1px solid ${isSelected ? heatColor + '30' : tk.borderDim}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = isCyberpunk ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Index */}
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: index < 3 ? heatColor : tk.foregroundMuted,
                        minWidth: '20px',
                        textAlign: 'center',
                        marginTop: '1px',
                        fontFamily: tk.fontMono,
                      }}
                    >
                      {index + 1}
                    </span>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: tk.foreground,
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {topic.title}
                        </span>
                        {/* Trend icon */}
                        {topic.trend === 'up' && <TrendingUp size={11} style={{ color: '#059669', flexShrink: 0 }} />}
                        {topic.trend === 'down' && <TrendingUp size={11} style={{ color: '#dc2626', flexShrink: 0, transform: 'rotate(180deg)' }} />}
                      </div>

                      {/* Meta info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Heat bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '60px',
                            height: '4px',
                            background: tk.borderDim,
                            borderRadius: '2px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: heatBarWidth,
                              height: '100%',
                              background: heatColor,
                              borderRadius: '2px',
                              transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{ fontSize: '10px', color: heatColor, fontWeight: 600, fontFamily: tk.fontMono }}>
                            {topic.heat}
                          </span>
                        </div>

                        <span style={{ fontSize: '9px', color: tk.foregroundMuted }}>·</span>

                        {/* Sentiment */}
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          background: getSentimentColor(topic.sentiment) + '15',
                          color: getSentimentColor(topic.sentiment),
                        }}>
                          {getSentimentLabel(topic.sentiment)}
                        </span>

                        <span style={{ fontSize: '9px', color: tk.foregroundMuted }}>·</span>

                        {/* Platform */}
                        <span style={{ fontSize: '9px', color: tk.foregroundMuted }}>
                          {topic.platform}
                        </span>

                        {topic.source && (
                          <>
                            <span style={{ fontSize: '9px', color: tk.foregroundMuted }}>·</span>
                            <span style={{ fontSize: '9px', color: tk.foregroundMuted }}>
                              {topic.source}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Expanded detail */}
                      {isSelected && topic.description && (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px 10px',
                          background: tk.background,
                          borderRadius: '6px',
                          fontSize: '10px',
                          color: tk.foregroundMuted,
                          lineHeight: '1.5',
                        }}>
                          {topic.description}
                        </div>
                      )}

                      {/* Expanded actions */}
                      {isSelected && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleWriteTopic(topic) }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: tk.primary,
                              border: 'none',
                              borderRadius: '6px',
                              color: tk.primaryForeground,
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            <Sparkles size={10} />
                            开始写作
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); panelActions?.openContentPreview({ content: `# ${topic.title}\n\n${topic.description || ''}` }) }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: 'transparent',
                              border: `1px solid ${tk.border}`,
                              borderRadius: '6px',
                              color: tk.foregroundMuted,
                              fontSize: '10px',
                              cursor: 'pointer',
                            }}
                          >
                            <BarChart3 size={10} />
                            预览
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // 先打开AI写作，再发送到发布队列
                              panelActions?.openAIWriting({ topic: topic.title, mode: 'title' })
                              setTimeout(() => {
                                panelActions?.openPublishQueue({ content: `# ${topic.title}\n\n${topic.description || ''}`, title: topic.title })
                              }, 300)
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              background: tk.primary + '20',
                              border: `1px solid ${tk.primary}50`,
                              borderRadius: '6px',
                              color: tk.primary,
                              fontSize: '10px',
                              cursor: 'pointer',
                            }}
                          >
                            <Send size={10} />
                            写作并发布
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '8px 20px',
            borderTop: `1px solid ${tk.borderDim}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: tk.foregroundMuted,
          }}
        >
          <span>
            共 {(liveTopics ?? MOCK_TOPICS).length} 个热点话题 · {liveTopics ? '实时数据' : '离线示例（配置 VITE_TRENDING_API 启用实时）'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} />
            <span>{liveTopics ? '手动刷新更新' : '离线数据'}</span>
          </span>
        </div>
        {fetchError && (
          <div style={{ padding: '8px 16px', fontFamily: tk.fontMono, fontSize: '10px', color: tk.error, borderTop: `1px solid ${tk.borderDim}` }}>
            {fetchError}
          </div>
        )}
      </div>
    </div>
  )
}
