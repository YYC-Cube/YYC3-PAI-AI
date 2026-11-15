/**
 * @file ImageGenPanel.tsx
 * @description 图像生成面板 — AI驱动的图像Prompt生成/管理/预览
 * 支持多风格Prompt生成、历史记录管理、一键复制导出
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2026-06-03
 * @status active
 * @tags [component],[ai],[image-gen],[panel]
 */

import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  FileImage,
  History,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModelStore } from '../store/model-store'
import { loadProviderKey } from '../utils/key-storage'
import { BLUR, Z_INDEX, useThemeStore, type ThemeTokens } from '../store/theme-store'

// ── Types ──

export interface ImageGenPanelProps {
  visible: boolean
  onClose: () => void
}

export type ImageStyle =
  | 'realistic'
  | 'anime'
  | 'cyberpunk'
  | 'watercolor'
  | 'oil-painting'
  | 'sketch'
  | 'pixel-art'
  | '3d-render'
  | 'fantasy'
  | 'minimalist'

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9'

export interface ImageGenRecord {
  id: string
  prompt: string
  enhancedPrompt: string
  style: ImageStyle
  aspectRatio: AspectRatio
  negativePrompt?: string
  createdAt: number
  modelName: string
}

// ── Constants ──

const STYLES: { value: ImageStyle; label: string; description: string }[] = [
  { value: 'realistic', label: '写实摄影', description: '照片级真实感，光影细节丰富' },
  { value: 'anime', label: '日系动漫', description: '赛璐珞风格，线条干净色彩鲜明' },
  { value: 'cyberpunk', label: '赛博朋克', description: '霓虹光影，高对比度未来城市' },
  { value: 'watercolor', label: '水彩', description: '柔和水墨效果，自然晕染' },
  { value: 'oil-painting', label: '油画', description: '厚重笔触，古典艺术质感' },
  { value: 'sketch', label: '素描', description: '线条勾勒，黑白灰阶' },
  { value: 'pixel-art', label: '像素艺术', description: '复古游戏风格，像素级细节' },
  { value: '3d-render', label: '3D渲染', description: '三维建模渲染，材质光影真实' },
  { value: 'fantasy', label: '奇幻', description: '魔法光效，超现实场景' },
  { value: 'minimalist', label: '极简', description: '少即是多，简洁构图留白' },
]

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9']

const LS_HISTORY = 'yyc3_imagegen_history'

const SYSTEM_PROMPT = `你是一位专业的AI图像Prompt工程师。你的任务是将用户的简单描述转化为详细、高质量的图像生成提示词。

要求：
1. 保持原意的同时丰富细节（光影、构图、色彩、质感）
2. 自动匹配适合的风格描述词
3. 输出格式为 JSON：
{
  "enhancedPrompt": "扩充后的详细Prompt（英文）",
  "negativePrompt": "负面提示词（英文，避免的内容）",
  "styleKeywords": ["关键词1", "关键词2"],
  "composition": "构图建议",
  "lighting": "光线描述",
  "colorPalette": "色彩方案"
}

仅输出 JSON，不要额外说明。`

// ── Helpers ──

function genId(): string {
  return 'img_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function loadHistory(): ImageGenRecord[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(records: ImageGenRecord[]) {
  try {
    localStorage.setItem(LS_HISTORY, JSON.stringify(records.slice(0, 100)))
  } catch {
    /* quota exceeded — silently truncate */
  }
}

// ── Component ──

export function ImageGenPanel({ visible, onClose }: ImageGenPanelProps) {
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const { sendToActiveModel, getActiveModel } = useModelStore()

  // ── State ──
  const [rawPrompt, setRawPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('realistic')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    enhancedPrompt: string
    negativePrompt: string
    styleKeywords: string[]
    composition: string
    lighting: string
    colorPalette: string
  } | null>(null)
  const [history, setHistory] = useState<ImageGenRecord[]>(loadHistory)
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customNegative, setCustomNegative] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  // ── 真实图像生成（智谱 CogView）：复用 provider Key，浏览器直连 ──
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Auto-focus on input ──
  useEffect(() => {
    if (visible && activeTab === 'generate') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [visible, activeTab])

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    const trimmed = rawPrompt.trim()
    if (!trimmed) return

    const activeModel = getActiveModel()
    if (!activeModel) {
      setError('请先在模型设置中激活一个AI模型')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const styleInfo = STYLES.find(s => s.value === selectedStyle)
      const message = `生成图像Prompt：\n
原始描述：${trimmed}
风格：${styleInfo?.label} (${selectedStyle})
宽高比：${aspectRatio}
${customNegative ? `额外负面词：${customNegative}` : ''}

请输出包含 enhancedPrompt, negativePrompt, styleKeywords, composition, lighting, colorPalette 的 JSON。`

      const response = await sendToActiveModel(message, {
        systemPrompt: SYSTEM_PROMPT,
      })

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI响应格式异常，未能提取JSON')

      const parsed = JSON.parse(jsonMatch[0])

      const resultData = {
        enhancedPrompt: parsed.enhancedPrompt || parsed.prompt || '',
        negativePrompt: parsed.negativePrompt || '',
        styleKeywords: Array.isArray(parsed.styleKeywords) ? parsed.styleKeywords : [],
        composition: parsed.composition || '',
        lighting: parsed.lighting || '',
        colorPalette: parsed.colorPalette || '',
      }

      setResult(resultData)

      // Save to history
      const record: ImageGenRecord = {
        id: genId(),
        prompt: trimmed,
        enhancedPrompt: resultData.enhancedPrompt,
        style: selectedStyle,
        aspectRatio,
        negativePrompt: resultData.negativePrompt,
        createdAt: Date.now(),
        modelName: activeModel.name,
      }

      setHistory(prev => {
        const updated = [record, ...prev]
        saveHistory(updated)
        return updated
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成失败，请检查模型连接'
      setError(msg)
    } finally {
      setIsGenerating(false)
    }
  }, [rawPrompt, selectedStyle, aspectRatio, customNegative, sendToActiveModel, getActiveModel])

  // ── Copy to clipboard ──
  /** 真实图像生成：智谱 CogView-3（复用 zhipu provider Key，浏览器 CORS 直连已验证） */
  const handleGenerateImage = useCallback(async (prompt?: string) => {
    const finalPrompt = (prompt ?? result?.enhancedPrompt ?? rawPrompt).trim()
    if (!finalPrompt) return
    const key = await loadProviderKey('zhipu')
    if (!key) {
      setImageError('需要智谱 API Key（模型设置 → Z.ai 智谱 → 填入 Key）才能调用 CogView 图像生成')
      return
    }
    setImageBusy(true)
    setImageError(null)
    setImageUrl(null)
    try {
      const resp = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'cogview-3-plus', prompt: finalPrompt, size: '1024x1024' }),
      })
      const data = await resp.json().catch(() => null)
      if (!resp.ok) {
        throw new Error(data?.error?.message || `HTTP ${resp.status}`)
      }
      const url = data?.data?.[0]?.url as string | undefined
      if (!url) throw new Error('响应中没有图像 URL')
      setImageUrl(url)
    } catch (e) {
      setImageError(`图像生成失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setImageBusy(false)
    }
  }, [rawPrompt, result])

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }, [])

  // ── Clear history ──
  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  // ── Delete single record ──
  const deleteRecord = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(r => r.id !== id)
      saveHistory(updated)
      return updated
    })
  }, [])

  // ── Apply history item ──
  const applyRecord = useCallback((record: ImageGenRecord) => {
    setRawPrompt(record.prompt)
    setSelectedStyle(record.style)
    setAspectRatio(record.aspectRatio)
    if (record.negativePrompt) setCustomNegative(record.negativePrompt)
    setActiveTab('generate')
  }, [])

  // ── Filtered history ──
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history
    const q = searchQuery.toLowerCase()
    return history.filter(
      r =>
        r.prompt.toLowerCase().includes(q) ||
        r.enhancedPrompt.toLowerCase().includes(q) ||
        r.style.toLowerCase().includes(q)
    )
  }, [history, searchQuery])

  if (!visible) return null

  // ── Shared styles ──
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '480px',
    height: '100vh',
    background: isCyberpunk ? 'rgba(10, 10, 10, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: BLUR.lg,
    WebkitBackdropFilter: BLUR.lg,
    borderLeft: `1px solid ${tk.borderDim}`,
    zIndex: Z_INDEX.assistPanel,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: tk.fontBody,
    color: tk.foreground,
    boxShadow: isCyberpunk
      ? '-4px 0 24px rgba(0, 240, 255, 0.08)'
      : '-4px 0 24px rgba(0, 0, 0, 0.06)',
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: isCyberpunk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${tk.borderDim}`,
    borderRadius: '8px',
    color: tk.foreground,
    fontFamily: tk.fontBody,
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: tk.fontBody,
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    padding: '4px 10px',
    fontSize: '10px',
    background: active
      ? tk.primary
      : isCyberpunk
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.04)',
    color: active ? tk.background : tk.foregroundMuted,
    border: `1px solid ${active ? tk.primary : tk.borderDim}`,
  })

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: Z_INDEX.overlay,
    background: 'rgba(0,0,0,0.2)',
  }

  return (
    <>
      {/* Backdrop */}
      <div style={overlayStyle} onClick={onClose} />

      {/* Panel */}
      <div style={panelStyle}>
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${tk.borderDim}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ImageIcon size={18} color={tk.primary} />
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: tk.fontMono }}>
              图像生成
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              ...btnBase,
              padding: '6px',
              background: 'transparent',
              color: tk.foregroundMuted,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${tk.borderDim}`,
            padding: '0 20px',
          }}
        >
          {[
            { key: 'generate', label: '生成', icon: Sparkles },
            { key: 'history', label: '历史', icon: History },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                ...btnBase,
                padding: '10px 16px',
                background: 'transparent',
                color: activeTab === tab.key ? tk.primary : tk.foregroundMuted,
                borderRadius: 0,
                borderBottom: activeTab === tab.key
                  ? `2px solid ${tk.primary}`
                  : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.key === 'history' && history.length > 0 && (
                <span
                  style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: '99px',
                    background: tk.primary + '22',
                    color: tk.primary,
                  }}
                >
                  {history.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {activeTab === 'generate' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Style selector */}
              <div>
                <label
                  style={{
                    fontSize: '10px',
                    color: tk.foregroundMuted,
                    fontFamily: tk.fontMono,
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  风格
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {STYLES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSelectedStyle(s.value)}
                      style={chipStyle(selectedStyle === s.value)}
                      title={s.description}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect ratio */}
              <div>
                <label
                  style={{
                    fontSize: '10px',
                    color: tk.foregroundMuted,
                    fontFamily: tk.fontMono,
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  宽高比
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {ASPECT_RATIOS.map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      style={{
                        ...chipStyle(aspectRatio === ratio),
                        flex: 1,
                      }}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt input */}
              <div>
                <label
                  style={{
                    fontSize: '10px',
                    color: tk.foregroundMuted,
                    fontFamily: tk.fontMono,
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  描述画面
                </label>
                <textarea
                  ref={inputRef}
                  value={rawPrompt}
                  onChange={e => setRawPrompt(e.target.value)}
                  placeholder="输入你想要的画面描述，例如：一只赛博朋克风格的机械猫在霓虹雨中漫步..."
                  rows={4}
                  style={{
                    ...inputBase,
                    padding: '12px',
                    resize: 'vertical',
                    minHeight: '80px',
                  }}
                />
              </div>

              {/* Advanced options toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={() => setShowAdvanced(v => !v)}
                  style={{
                    ...btnBase,
                    padding: '4px 8px',
                    background: 'transparent',
                    color: tk.foregroundMuted,
                    fontSize: '10px',
                  }}
                >
                  <Settings2 size={12} />
                  高级选项
                  {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {showAdvanced && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: isCyberpunk ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${tk.borderDim}`,
                  }}
                >
                  <label
                    style={{
                      fontSize: '10px',
                      color: tk.foregroundMuted,
                      fontFamily: tk.fontMono,
                      marginBottom: '6px',
                      display: 'block',
                    }}
                  >
                    负面提示词（不希望出现的内容）
                  </label>
                  <textarea
                    value={customNegative}
                    onChange={e => setCustomNegative(e.target.value)}
                    placeholder="deformed, blurry, low quality, extra limbs..."
                    rows={2}
                    style={{
                      ...inputBase,
                      padding: '8px',
                      resize: 'vertical',
                      minHeight: '40px',
                      fontSize: '11px',
                    }}
                  />
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !rawPrompt.trim()}
                style={{
                  ...btnBase,
                  width: '100%',
                  padding: '12px',
                  background: isGenerating
                    ? tk.primaryDim
                    : !rawPrompt.trim()
                      ? (isCyberpunk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                      : tk.primary,
                  color: isGenerating || !rawPrompt.trim() ? tk.foregroundMuted : tk.background,
                  cursor: isGenerating || !rawPrompt.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    AI 正在生成...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    生成增强 Prompt
                  </>
                )}
              </button>

              {/* 真实图像生成（CogView）：增强完成后可用原始/增强 Prompt 直接出图 */}
              <button
                onClick={() => handleGenerateImage()}
                disabled={imageBusy || !rawPrompt.trim()}
                style={{
                  ...btnBase,
                  width: '100%',
                  padding: '12px',
                  background: imageBusy ? tk.primaryDim : !rawPrompt.trim() ? 'rgba(127,127,127,0.08)' : tk.secondary,
                  color: imageBusy || !rawPrompt.trim() ? tk.foregroundMuted : tk.background,
                  cursor: imageBusy || !rawPrompt.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                {imageBusy ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    CogView 绘图中...
                  </>
                ) : (
                  <>
                    <ImageIcon size={14} />
                    生成图像（CogView · 真实 API）
                  </>
                )}
              </button>

              {/* 图像结果 / 错误 */}
              {imageError && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)', color: '#ff3333', fontFamily: tk.fontMono, fontSize: '11px' }}>
                  {imageError}
                </div>
              )}
              {imageUrl && (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${tk.border}` }}>
                  <img src={imageUrl} alt="CogView 生成结果" style={{ display: 'block', width: '100%' }} />
                  <div className="flex items-center justify-between px-3 py-2" style={{ background: tk.backgroundAlt }}>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.foregroundMuted }}>CogView-3-Plus · 1024×1024</span>
                    <a href={imageUrl} target="_blank" rel="noreferrer" style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.secondary }}>
                      打开原图 ↗
                    </a>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 50, 50, 0.08)',
                    border: '1px solid rgba(255, 50, 50, 0.2)',
                    color: '#ff3333',
                    fontSize: '11px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Result */}
              {result && (
                <div
                  style={{
                    borderRadius: '8px',
                    border: `1px solid ${tk.primary}33`,
                    overflow: 'hidden',
                  }}
                >
                  {/* Enhanced Prompt */}
                  <div
                    style={{
                      padding: '14px',
                      background: isCyberpunk ? 'rgba(0,240,255,0.03)' : 'rgba(0,240,255,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          fontFamily: tk.fontMono,
                          color: tk.primary,
                        }}
                      >
                        ENHANCED PROMPT
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.enhancedPrompt, 'enhanced')}
                        style={{
                          ...btnBase,
                          padding: '4px 8px',
                          background: 'transparent',
                          color: copiedId === 'enhanced' ? tk.primary : tk.foregroundMuted,
                          fontSize: '10px',
                        }}
                      >
                        {copiedId === 'enhanced' ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedId === 'enhanced' ? '已复制' : '复制'}
                      </button>
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        lineHeight: '1.7',
                        color: tk.foreground,
                        whiteSpace: 'pre-wrap',
                        fontFamily: tk.fontMono,
                        background: isCyberpunk
                          ? 'rgba(0,0,0,0.3)'
                          : 'rgba(255,255,255,0.5)',
                        padding: '10px',
                        borderRadius: '6px',
                      }}
                    >
                      {result.enhancedPrompt}
                    </p>
                  </div>

                  {/* Details */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1px',
                      background: tk.borderDim,
                    }}
                  >
                    {result.negativePrompt && (
                      <DetailBlock
                        label="NEGATIVE PROMPT"
                        value={result.negativePrompt}
                        isCyberpunk={isCyberpunk}
                        tk={tk}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    )}
                    {result.composition && (
                      <DetailBlock
                        label="构图"
                        value={result.composition}
                        isCyberpunk={isCyberpunk}
                        tk={tk}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    )}
                    {result.lighting && (
                      <DetailBlock
                        label="光线"
                        value={result.lighting}
                        isCyberpunk={isCyberpunk}
                        tk={tk}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    )}
                    {result.colorPalette && (
                      <DetailBlock
                        label="色彩方案"
                        value={result.colorPalette}
                        isCyberpunk={isCyberpunk}
                        tk={tk}
                        onCopy={copyToClipboard}
                        copiedId={copiedId}
                      />
                    )}
                    {result.styleKeywords.length > 0 && (
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          padding: '12px',
                          background: isCyberpunk ? 'rgba(10,10,10,0.6)' : 'rgba(255,255,255,0.8)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '9px',
                            color: tk.foregroundMuted,
                            fontFamily: tk.fontMono,
                            display: 'block',
                            marginBottom: '6px',
                          }}
                        >
                          KEYWORDS
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {result.styleKeywords.map((kw, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                background: tk.primary + '15',
                                color: tk.primary,
                                border: `1px solid ${tk.primary}22`,
                              }}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full copy */}
                  <div
                    style={{
                      padding: '10px',
                      borderTop: `1px solid ${tk.borderDim}`,
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${result.enhancedPrompt}\n\n--负面提示词--\n${result.negativePrompt}\n\n--构图--\n${result.composition}\n--光线--\n${result.lighting}\n--色彩--\n${result.colorPalette}`,
                          'full'
                        )
                      }
                      style={{
                        ...btnBase,
                        flex: 1,
                        background: isCyberpunk
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.04)',
                        color: tk.foreground,
                        fontSize: '10px',
                      }}
                    >
                      {copiedId === 'full' ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedId === 'full' ? '已复制全部' : '复制全部'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── History Tab ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={12}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: tk.foregroundMuted,
                  }}
                />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索历史Prompt..."
                  style={{
                    ...inputBase,
                    padding: '8px 12px 8px 30px',
                    fontSize: '11px',
                  }}
                />
              </div>

              {filteredHistory.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: tk.foregroundMuted,
                  }}
                >
                  <FileImage size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ fontSize: '12px', fontFamily: tk.fontMono }}>
                    {searchQuery ? '未找到匹配记录' : '暂无生成历史'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setActiveTab('generate')}
                      style={{
                        ...btnBase,
                        marginTop: '12px',
                        background: tk.primary,
                        color: tk.background,
                        fontSize: '11px',
                      }}
                    >
                      <Sparkles size={12} />
                      开始生成
                    </button>
                  )}
                </div>
              )}

              {filteredHistory.map(record => (
                <div
                  key={record.id}
                  style={{
                    borderRadius: '8px',
                    border: `1px solid ${tk.borderDim}`,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = tk.primary + '44'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = tk.borderDim
                  }}
                >
                  <div
                    style={{
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '11px',
                          color: tk.foreground,
                          lineHeight: '1.5',
                          marginBottom: '6px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}
                      >
                        {record.prompt}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: tk.primary + '15',
                            color: tk.primary,
                          }}
                        >
                          {STYLES.find(s => s.value === record.style)?.label || record.style}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            color: tk.foregroundMuted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          <Clock size={10} />
                          {new Date(record.createdAt).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => applyRecord(record)}
                        title="使用此Prompt"
                        style={{
                          ...btnBase,
                          padding: '6px',
                          background: 'transparent',
                          color: tk.foregroundMuted,
                        }}
                      >
                        <RefreshCw size={12} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(record.enhancedPrompt, record.id)}
                        title="复制增强Prompt"
                        style={{
                          ...btnBase,
                          padding: '6px',
                          background: 'transparent',
                          color: copiedId === record.id ? tk.primary : tk.foregroundMuted,
                        }}
                      >
                        {copiedId === record.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        title="删除"
                        style={{
                          ...btnBase,
                          padding: '6px',
                          background: 'transparent',
                          color: '#ff4444',
                          opacity: 0.6,
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    ...btnBase,
                    width: '100%',
                    background: 'transparent',
                    color: tk.foregroundMuted,
                    fontSize: '10px',
                    border: `1px solid ${tk.borderDim}`,
                  }}
                >
                  <Trash2 size={12} />
                  清空历史记录
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: `1px solid ${tk.borderDim}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '9px',
              color: tk.foregroundMuted,
              fontFamily: tk.fontMono,
            }}
          >
            ImageGen v1.0
          </span>
          <a
            href="https://glm-5.zhipu.ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '9px',
              color: tk.primary,
              fontFamily: tk.fontMono,
              textDecoration: 'none',
              opacity: 0.7,
            }}
          >
            由AI驱动
          </a>
        </div>
      </div>

      {/* Spin animation keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

// ── Detail Block Subcomponent ──

function DetailBlock({
  label,
  value,
  isCyberpunk,
  tk,
  onCopy,
  copiedId,
}: {
  label: string
  value: string
  isCyberpunk: boolean
  tk: ThemeTokens
  onCopy: (text: string, id: string) => void
  copiedId: string | null
}) {
  const blockId = `detail_${label}`
  return (
    <div
      style={{
        padding: '12px',
        background: isCyberpunk ? 'rgba(10,10,10,0.6)' : 'rgba(255,255,255,0.8)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            color: tk.foregroundMuted,
            fontFamily: tk.fontMono,
          }}
        >
          {label}
        </span>
        <button
          onClick={() => onCopy(value, blockId)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: copiedId === blockId ? tk.primary : tk.foregroundMuted,
            padding: '2px',
            display: 'flex',
          }}
        >
          {copiedId === blockId ? <Check size={10} /> : <Copy size={10} />}
        </button>
      </div>
      <p
        style={{
          fontSize: '11px',
          lineHeight: '1.5',
          color: tk.foreground,
        }}
      >
        {value}
      </p>
    </div>
  )
}
