/**
 * @file MusicFeaturePanels.tsx
 * @description 音乐功能面板集合 - AI功能 + 社交功能 + 高级音频的UI面板
 */

import {
  Brain,
  ChevronRight,
  Gift,
  Headphones,
  Languages,
  MessageSquare,
  Mic,
  Palette,
  Send,
  Shuffle,
  Sparkles,
  ThumbsUp,
  Users,
  X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useModelStore } from '../../store/model-store'
import { useThemeStore } from '../../store/theme-store'
import { createLogger } from '../../utils/logger'
import {
  CROSSFADE_CURVES,
  CrossfadeProcessor,
  KaraokeProcessor,
  REVERB_PRESETS,
  SpatialAudioProcessor
} from './AdvancedAudioModule'
import { MusicAI, type AlbumCoverConfig, type EmotionAnalysis, type LyricTranslation } from './MusicAIModule'
import {
  GIFT_CONFIG,
  collabPlaylistManager,
  giftTipManager,
  timedCommentManager,
  type CollaborativePlaylist,
  type GiftType,
  type TimedComment
} from './MusicSocialModule'

const logger = createLogger('MusicFeaturePanels')

// ── 共享样式 ──

function PanelWrapper({ isOpen, onClose, title, icon, children }: {
  isOpen: boolean
  onClose: () => void
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const { tokens } = useThemeStore()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 m-4 max-h-[85vh] overflow-y-auto neon-scrollbar"
        style={{ background: tokens.cardBg, border: `1px solid ${tokens.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-xl font-bold" style={{ color: tokens.primary }}>{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10" aria-label={`关闭${title}`}>
            <X size={20} style={{ color: tokens.foregroundMuted }} />
          </button>
        </div>
        {children}
      </div>

      <style>{`
        .neon-scrollbar::-webkit-scrollbar { width: 6px; }
        .neon-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .neon-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.4); border-radius: 3px; }
      `}</style>
    </div>
  )
}

// ── 1. AI歌词翻译面板 ──

export function AILyricsTranslatePanel({ isOpen, onClose, lyrics, trackName }: {
  isOpen: boolean
  onClose: () => void
  lyrics: string
  trackName: string
}) {
  const { tokens } = useThemeStore()
  const { sendToActiveModel } = useModelStore()
  const [targetLang, setTargetLang] = useState('中文')
  const [translations, setTranslations] = useState<LyricTranslation[]>([])
  const [isTranslating, setIsTranslating] = useState(false)
  const musicAI = useRef(new MusicAI())

  useEffect(() => {
    musicAI.current.setModelSender(sendToActiveModel)
  }, [sendToActiveModel])

  const handleTranslate = useCallback(async () => {
    if (!lyrics) return
    setIsTranslating(true)
    try {
      const result = await musicAI.current.translateLyrics(lyrics, targetLang)
      setTranslations(result)
    } catch (error) {
      logger.error('[LyricsTranslate] 翻译失败:', error)
    } finally {
      setIsTranslating(false)
    }
  }, [lyrics, targetLang])

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="🤖 AI歌词翻译"
      icon={<Languages size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: tokens.codeBg, border: `1px solid ${tokens.borderDim}`, color: tokens.foreground }}
            aria-label="目标语言"
          >
            <option value="中文">中文</option>
            <option value="English">English</option>
            <option value="日本語">日本語</option>
            <option value="한국어">한국어</option>
            <option value="Français">Français</option>
            <option value="Deutsch">Deutsch</option>
          </select>

          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: isTranslating ? tokens.border : tokens.primary,
              color: '#ffffff',
              opacity: isTranslating ? 0.6 : 1
            }}
          >
            {isTranslating ? '翻译中...' : '翻译'}
          </button>
        </div>

        {trackName && (
          <p className="text-sm" style={{ color: tokens.foregroundMuted }}>
            🎵 {trackName}
          </p>
        )}

        <div className="space-y-2 max-h-[50vh] overflow-y-auto neon-scrollbar">
          {translations.map((t, i) => (
            <div key={i} className="p-3 rounded-lg space-y-1"
              style={{ background: tokens.codeBg }}
            >
              <p className="text-sm" style={{ color: tokens.foreground }}>{t.original}</p>
              <p className="text-sm font-medium" style={{ color: tokens.primary }}>{t.translated}</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: tokens.foregroundMuted }}>
                <span>{t.sourceLang}</span>
                <span>→</span>
                <span>{t.targetLang}</span>
                {t.confidence > 0 && (
                  <span className="ml-auto">
                    置信度: {Math.round(t.confidence * 100)}%
                  </span>
                )}
              </div>
            </div>
          ))}

          {translations.length === 0 && !isTranslating && lyrics && (
            <p className="text-center text-sm py-8" style={{ color: tokens.foregroundMuted }}>
              点击"翻译"开始AI翻译
            </p>
          )}
        </div>
      </div>
    </PanelWrapper>
  )
}

// ── 2. AI封面生成面板 ──

export function AICoverGeneratorPanel({ isOpen, onClose, trackName, artist }: {
  isOpen: boolean
  onClose: () => void
  trackName: string
  artist: string
}) {
  const { tokens } = useThemeStore()
  const [style, setStyle] = useState<AlbumCoverConfig['style']>('abstract')
  const [mood, setMood] = useState('温暖')
  const [coverCanvas, setCoverCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = useCallback(() => {
    setIsGenerating(true)

    const musicAI = new MusicAI()
    const canvas = musicAI.generateCoverCanvas({
      trackName,
      artist,
      genre: '原创',
      mood,
      colorScheme: [tokens.primary, tokens.accent, '#06b6d4', '#ec4899'],
      style
    })

    setCoverCanvas(canvas)
    setIsGenerating(false)
  }, [trackName, artist, mood, style, tokens])

  const handleDownload = useCallback(() => {
    if (!coverCanvas) return
    const link = document.createElement('a')
    link.download = `${trackName}-cover.png`
    link.href = coverCanvas.toDataURL('image/png')
    link.click()
  }, [coverCanvas, trackName])

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="🎨 AI封面生成"
      icon={<Palette size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: tokens.foregroundMuted }}>设计风格</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as AlbumCoverConfig['style'])}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: tokens.codeBg, border: `1px solid ${tokens.borderDim}`, color: tokens.foreground }}
              aria-label="设计风格"
            >
              <option value="abstract">🎨 抽象</option>
              <option value="minimalist">✨ 极简</option>
              <option value="gradient">🌈 渐变</option>
              <option value="geometric">📐 几何</option>
              <option value="organic">🌿 有机</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: tokens.foregroundMuted }}>情感基调</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: tokens.codeBg, border: `1px solid ${tokens.borderDim}`, color: tokens.foreground }}
              aria-label="情感基调"
            >
              <option value="温暖">☀️ 温暖</option>
              <option value="忧郁">🌧️ 忧郁</option>
              <option value="激昂">🔥 激昂</option>
              <option value="梦幻">🌙 梦幻</option>
              <option value="浪漫">💕 浪漫</option>
              <option value="神秘">🔮 神秘</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all"
          style={{ background: tokens.primary, color: '#ffffff', opacity: isGenerating ? 0.6 : 1 }}
        >
          {isGenerating ? '生成中...' : '✨ 生成封面'}
        </button>

        {coverCanvas && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img
                src={coverCanvas.toDataURL('image/png')}
                alt={`${trackName} 专辑封面`}
                className="w-64 h-64 rounded-xl shadow-2xl"
                style={{ border: `2px solid ${tokens.border}` }}
              />
            </div>
            <button
              onClick={handleDownload}
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: tokens.codeBg, border: `1px solid ${tokens.borderDim}`, color: tokens.foreground }}
            >
              <span className="flex items-center justify-center gap-2">
                下载封面
              </span>
            </button>
          </div>
        )}
      </div>
    </PanelWrapper>
  )
}

// ── 3. AI情感分析面板 ──

export function AIEmotionAnalysisPanel({ isOpen, onClose, trackName, artist }: {
  isOpen: boolean
  onClose: () => void
  trackName: string
  artist: string
}) {
  const { tokens } = useThemeStore()
  const { sendToActiveModel } = useModelStore()
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const musicAI = useRef(new MusicAI())

  useEffect(() => {
    musicAI.current.setModelSender(sendToActiveModel)
  }, [sendToActiveModel])

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true)
    try {
      const result = await musicAI.current.analyzeEmotion({
        id: 'temp',
        name: trackName,
        url: '',
        metadata: { artist }
      })
      setAnalysis(result)
    } catch (error) {
      logger.error('[EmotionAnalysis] 分析失败:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [trackName, artist])

  const moodLabels: Record<string, { icon: string; label: string }> = {
    happy: { icon: '😊', label: '欢快' },
    sad: { icon: '😢', label: '悲伤' },
    energetic: { icon: '⚡', label: '激昂' },
    calm: { icon: '😌', label: '平静' },
    romantic: { icon: '💕', label: '浪漫' },
    melancholic: { icon: '🍂', label: '忧郁' },
    aggressive: { icon: '🔥', label: '激烈' },
    dreamy: { icon: '🌙', label: '梦幻' },
  }

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="📝 AI情感分析"
      icon={<Brain size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <p className="text-sm" style={{ color: tokens.foreground }}>
          🎵 {trackName} — {artist}
        </p>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 rounded-lg text-sm font-medium"
          style={{ background: tokens.primary, color: '#ffffff', opacity: isAnalyzing ? 0.6 : 1 }}
        >
          {isAnalyzing ? '分析中...' : '🧠 开始分析'}
        </button>

        {analysis && (
          <div className="space-y-4">
            {/* 情感标签 */}
            <div className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: `${tokens.primary}10` }}
            >
              <span className="text-4xl">
                {moodLabels[analysis.mood]?.icon || '🎵'}
              </span>
              <div>
                <p className="text-lg font-bold" style={{ color: tokens.primary }}>
                  {moodLabels[analysis.mood]?.label || analysis.mood}
                </p>
                <p className="text-xs" style={{ color: tokens.foregroundMuted }}>主导情感</p>
              </div>
            </div>

            {/* 特征条 */}
            {[
              { label: '能量', value: analysis.energy, color: '#ef4444' },
              { label: '积极性', value: analysis.valence, color: '#22c55e' },
              { label: '舞蹈性', value: analysis.danceability, color: '#3b82f6' },
              { label: '声学性', value: analysis.acousticness, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs" style={{ color: tokens.foregroundMuted }}>
                  <span>{label}</span>
                  <span>{Math.round(value * 100)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: tokens.border }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value * 100}%`, background: color }}
                  />
                </div>
              </div>
            ))}

            {/* 色彩 */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: tokens.foregroundMuted }}>推荐配色</p>
              <div className="flex gap-2">
                {analysis.colorPalette.map((color, i) => (
                  <div key={i} className="flex-1 h-8 rounded-lg" style={{ background: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* 推荐歌曲 */}
            {analysis.recommendedTracks.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: tokens.foregroundMuted }}>
                  <Sparkles size={12} className="inline mr-1" />
                  相似推荐
                </p>
                <div className="space-y-1">
                  {analysis.recommendedTracks.map((track, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      style={{ color: tokens.foreground }}
                    >
                      <ChevronRight size={14} style={{ color: tokens.primary }} />
                      <span className="text-sm">{track}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PanelWrapper>
  )
}

// ── 4. 协作播放列表面板 ──

export function CollabPlaylistPanel({ isOpen, onClose, tracks: _tracks }: {
  isOpen: boolean
  onClose: () => void
  tracks: { id: string; name: string }[]
}) {
  const { tokens } = useThemeStore()
  const [playlists, setPlaylists] = useState<CollaborativePlaylist[]>([])
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)

  useEffect(() => {
    setPlaylists(collabPlaylistManager.getPlaylists())
  }, [isOpen])

  const handleCreate = useCallback(() => {
    if (!newPlaylistName.trim()) return
    collabPlaylistManager.createPlaylist({
      name: newPlaylistName,
      description: `由我创建的播放列表`,
      createdBy: 'local-user',
      trackIds: [],
      isPublic: true,
      coverColor: tokens.primary
    })
    setPlaylists(collabPlaylistManager.getPlaylists())
    setNewPlaylistName('')
  }, [newPlaylistName, tokens.primary])

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="👥 协作播放列表"
      icon={<Users size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="新播放列表名称..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: tokens.codeBg, border: `1px solid ${tokens.borderDim}`, color: tokens.foreground }}
            aria-label="播放列表名称"
          />
          <button onClick={handleCreate} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: tokens.primary, color: '#ffffff' }}
          >
            创建
          </button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto neon-scrollbar">
          {playlists.map(pl => (
            <div key={pl.id}
              className="p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5"
              style={{
                background: selectedPlaylist === pl.id ? `${tokens.primary}10` : tokens.codeBg,
                border: `1px solid ${selectedPlaylist === pl.id ? tokens.primary : 'transparent'}`
              }}
              onClick={() => setSelectedPlaylist(pl.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm" style={{ color: tokens.foreground }}>{pl.name}</p>
                  <p className="text-xs" style={{ color: tokens.foregroundMuted }}>
                    {pl.trackIds.length} 首歌曲 · {pl.members.length} 位成员
                  </p>
                </div>
                <div className="flex -space-x-1">
                  {pl.members.slice(0, 3).map((m, i) => (
                    <span key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: tokens.primary, border: `2px solid ${tokens.cardBg}` }}
                    >
                      {m.avatar}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {playlists.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: tokens.foregroundMuted }}>
              还没有播放列表，创建一个开始协作吧！
            </p>
          )}
        </div>
      </div>
    </PanelWrapper>
  )
}

// ── 5. 实时评论面板 ──

export function TimedCommentPanel({ isOpen, onClose, trackId, currentTime }: {
  isOpen: boolean
  onClose: () => void
  trackId: string
  currentTime: number
}) {
  const { tokens } = useThemeStore()
  const [comments, setComments] = useState<TimedComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showAtTime, setShowAtTime] = useState(true)

  useEffect(() => {
    setComments(timedCommentManager.getComments(trackId))
  }, [trackId, isOpen])

  const handleSend = useCallback(() => {
    if (!newComment.trim()) return

    timedCommentManager.addComment({
      trackId,
      userId: 'local-user',
      displayName: '我',
      avatar: '👤',
      content: newComment,
      timestamp: showAtTime ? currentTime : 0
    })

    setComments(timedCommentManager.getComments(trackId))
    setNewComment('')
  }, [newComment, trackId, currentTime, showAtTime])

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="💬 实时评论"
      icon={<MessageSquare size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="发表评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: tokens.codeBg, border: `1px solid ${tokens.borderDim}`, color: tokens.foreground }}
            aria-label="评论内容"
          />
          <button onClick={handleSend} className="p-2 rounded-lg"
            style={{ background: tokens.primary }} aria-label="发送评论"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: tokens.foregroundMuted }}>
          <input
            type="checkbox"
            checked={showAtTime}
            onChange={(e) => setShowAtTime(e.target.checked)}
            className="w-3 h-3"
          />
          标记在 {formatTime(currentTime)}
        </label>

        <div className="space-y-2 max-h-[45vh] overflow-y-auto neon-scrollbar">
          {comments.map(comment => (
            <div key={comment.id} className="p-3 rounded-lg"
              style={{ background: tokens.codeBg }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{comment.avatar}</span>
                  <span className="text-sm font-medium" style={{ color: tokens.foreground }}>
                    {comment.displayName}
                  </span>
                  {comment.timestamp > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: `${tokens.primary}20`, color: tokens.primary }}
                    >
                      {formatTime(comment.timestamp)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => timedCommentManager.likeComment(trackId, comment.id)}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: tokens.foregroundMuted }}
                  aria-label="点赞"
                >
                  <ThumbsUp size={12} /> {comment.likes}
                </button>
              </div>
              <p className="text-sm" style={{ color: tokens.foreground }}>{comment.content}</p>
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: tokens.foregroundMuted }}>
              还没有评论，快来抢沙发！
            </p>
          )}
        </div>
      </div>
    </PanelWrapper>
  )
}

// ── 6. 打赏面板 ──

export function GiftTipPanel({ isOpen, onClose, artistName }: {
  isOpen: boolean
  onClose: () => void
  artistName: string
}) {
  const { tokens } = useThemeStore()
  const [balance, setBalance] = useState(0)
  const [selectedGift, setSelectedGift] = useState<GiftType>('flower')
  const [message, setMessage] = useState('')
  const [justSent, setJustSent] = useState(false)

  useEffect(() => {
    setBalance(giftTipManager.getBalance())
  }, [isOpen])

  const handleSend = useCallback(() => {
    const result = giftTipManager.sendGift({
      trackId: '',
      fromUserId: 'local-user',
      fromDisplayName: '我',
      toArtistId: artistName,
      toArtistName: artistName,
      giftType: selectedGift,
      amount: 1,
      message
    })

    if (result.success) {
      setBalance(giftTipManager.getBalance())
      setJustSent(true)
      setMessage('')
      setTimeout(() => setJustSent(false), 2000)
    }
  }, [artistName, selectedGift, message])

  const stats = giftTipManager.getTotalTipsForArtist(artistName)

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="🎁 打赏支持"
      icon={<Gift size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg"
          style={{ background: tokens.codeBg }}
        >
          <div>
            <p className="text-xs" style={{ color: tokens.foregroundMuted }}>支持艺术家</p>
            <p className="font-bold" style={{ color: tokens.foreground }}>{artistName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: tokens.foregroundMuted }}>已收到</p>
            <p className="text-sm font-bold" style={{ color: tokens.primary }}>
              {stats.count} 份礼物 · 价值 {stats.value}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-xs" style={{ color: tokens.foregroundMuted }}>
            💰 余额: <strong style={{ color: tokens.foreground }}>{balance}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(GIFT_CONFIG) as [GiftType, typeof GIFT_CONFIG[GiftType]][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setSelectedGift(type)}
              className={`p-3 rounded-xl text-center transition-all ${selectedGift === type ? 'ring-2 scale-105' : ''
                }`}
              style={{
                background: selectedGift === type ? `${config.color}20` : tokens.codeBg,
                borderColor: selectedGift === type ? config.color : 'transparent'
              }}
            >
              <span className="text-2xl block">{config.icon}</span>
              <span className="text-xs font-medium block mt-1" style={{ color: tokens.foreground }}>
                {config.name}
              </span>
              <span className="text-xs block" style={{ color: tokens.foregroundMuted }}>
                {config.value} 币
              </span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="附上留言（可选）..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: tokens.codeBg, border: `1px solid ${tokens.borderDim}`, color: tokens.foreground }}
          aria-label="打赏留言"
        />

        <button
          onClick={handleSend}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all"
          style={{
            background: justSent ? '#22c55e' : GIFT_CONFIG[selectedGift].color,
            color: '#ffffff'
          }}
        >
          {justSent ? '✅ 已送出！' : `${GIFT_CONFIG[selectedGift].icon} 打赏 ${GIFT_CONFIG[selectedGift].value} 币`}
        </button>
      </div>
    </PanelWrapper>
  )
}

// ── 7. 3D环绕声面板 ──

export function SpatialAudioPanel({ isOpen, onClose, processor }: {
  isOpen: boolean
  onClose: () => void
  processor: SpatialAudioProcessor | null
}) {
  const { tokens } = useThemeStore()
  const [mode, setMode] = useState('studio')
  const [reverbIndex, setReverbIndex] = useState(1)
  const [_rotation, setRotation] = useState(0)

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode)
    processor?.setSpatialMode(newMode as any)
    processor?.enable()
  }, [processor])

  const handleReverbChange = useCallback((index: number) => {
    setReverbIndex(index)
    processor?.setReverbMix(REVERB_PRESETS[index].wet)
  }, [processor])

  useEffect(() => {
    if (!processor?.active) return
    const interval = setInterval(() => {
      setRotation(prev => {
        const next = prev + 0.02
        processor?.setRotation(next)
        return next
      })
    }, 50)
    return () => clearInterval(interval)
  }, [processor])

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="🎚️ 3D环绕声"
      icon={<Headphones size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'studio', name: '🎧 录音室', desc: '近距离监听' },
            { id: 'concert', name: '🏛️ 音乐厅', desc: '现场演出感' },
            { id: 'arena', name: '🏟️ 体育馆', desc: '宏大空间感' },
            { id: 'headphones', name: '🎵 耳机优化', desc: '虚拟环绕声' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className="p-3 rounded-lg text-left transition-all"
              style={{
                background: mode === m.id ? `${tokens.primary}20` : tokens.codeBg,
                border: `1px solid ${mode === m.id ? tokens.primary : 'transparent'}`
              }}
            >
              <p className="text-sm font-medium" style={{ color: tokens.foreground }}>{m.name}</p>
              <p className="text-xs" style={{ color: tokens.foregroundMuted }}>{m.desc}</p>
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium mb-2" style={{ color: tokens.foregroundMuted }}>混响效果</p>
          <div className="flex gap-1">
            {REVERB_PRESETS.map((preset, i) => (
              <button
                key={preset.id}
                onClick={() => handleReverbChange(i)}
                className="flex-1 py-2 rounded-lg text-center text-xs transition-all"
                style={{
                  background: reverbIndex === i ? `${tokens.primary}20` : tokens.codeBg,
                  color: reverbIndex === i ? tokens.primary : tokens.foregroundMuted,
                  border: `1px solid ${reverbIndex === i ? tokens.primary : 'transparent'}`
                }}
              >
                {preset.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PanelWrapper>
  )
}

// ── 8. 卡拉OK模式面板 ──

export function KaraokePanel({ isOpen, onClose, processor }: {
  isOpen: boolean
  onClose: () => void
  processor: KaraokeProcessor | null
}) {
  const { tokens } = useThemeStore()
  const [isActive, setIsActive] = useState(false)
  const [reductionLevel, setReductionLevel] = useState(85)

  const handleToggle = useCallback(() => {
    const newState = processor?.toggle() ?? false
    setIsActive(newState)
  }, [processor])

  const handleLevelChange = useCallback((level: number) => {
    setReductionLevel(level)
    processor?.setVocalReduction(level / 100)
  }, [processor])

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="🎙️ 卡拉OK模式"
      icon={<Mic size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleToggle}
            aria-label={isActive ? '关闭卡拉OK模式' : '开启卡拉OK模式'}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isActive ? 'animate-pulse' : ''
              }`}
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${tokens.primary}, ${tokens.accent})`
                : tokens.codeBg,
              boxShadow: isActive ? `0 0 30px ${tokens.primary}60` : 'none'
            }}
          >
            <Mic size={40} className="text-white" />
          </button>
        </div>

        <p className="text-center text-sm" style={{ color: isActive ? tokens.primary : tokens.foregroundMuted }}>
          {isActive ? '🎤 卡拉OK模式已开启' : '点击开启卡拉OK模式'}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: tokens.foregroundMuted }}>
            <span>人声消除强度</span>
            <span>{reductionLevel}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={reductionLevel}
            onChange={(e) => handleLevelChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${tokens.primary} ${reductionLevel}%, ${tokens.border} ${reductionLevel}%)`
            }}
            aria-label="人声消除强度"
          />
        </div>

        <div className="p-3 rounded-lg" style={{ background: `${tokens.primary}10` }}>
          <p className="text-xs" style={{ color: tokens.foregroundMuted }}>
            💡 卡拉OK模式通过相位反相技术消除中央声道的人声，效果取决于歌曲的混音方式。
            原创音乐可能有更好的消除效果。
          </p>
        </div>
      </div>
    </PanelWrapper>
  )
}

// ── 9. 交叉淡入淡出面板 ──

export function CrossfadePanel({ isOpen, onClose, processor }: {
  isOpen: boolean
  onClose: () => void
  processor: CrossfadeProcessor | null
}) {
  const { tokens } = useThemeStore()
  const [duration, setDuration] = useState(3000)
  const [curve, setCurve] = useState<string>('equalPower')
  const [isCrossfading, setIsCrossfading] = useState(false)

  const handleCrossfade = useCallback(async () => {
    if (!processor || isCrossfading) return
    setIsCrossfading(true)
    await processor.crossfade(duration, curve as any)
    setIsCrossfading(false)
  }, [processor, duration, curve, isCrossfading])

  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="🔄 交叉淡入淡出"
      icon={<Shuffle size={22} style={{ color: tokens.primary }} />}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: tokens.foregroundMuted }}>
            <span>淡入淡出时长</span>
            <span>{(duration / 1000).toFixed(1)}秒</span>
          </div>
          <input
            type="range"
            min="500"
            max="10000"
            step="500"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${tokens.primary} ${(duration - 500) / 9500 * 100}%, ${tokens.border} ${(duration - 500) / 9500 * 100}%)`
            }}
            aria-label="淡入淡出时长"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: tokens.foregroundMuted }}>过渡曲线</p>
          <div className="grid grid-cols-3 gap-2">
            {CROSSFADE_CURVES.map(c => (
              <button
                key={c.id}
                onClick={() => setCurve(c.id)}
                className="p-3 rounded-lg text-center"
                style={{
                  background: curve === c.id ? `${tokens.primary}20` : tokens.codeBg,
                  border: `1px solid ${curve === c.id ? tokens.primary : 'transparent'}`
                }}
              >
                <p className="text-sm font-medium" style={{ color: tokens.foreground }}>{c.name}</p>
                <p className="text-xs" style={{ color: tokens.foregroundMuted }}>{c.description}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCrossfade}
          disabled={isCrossfading}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all"
          style={{
            background: isCrossfading ? tokens.border : tokens.primary,
            color: '#ffffff',
            opacity: isCrossfading ? 0.6 : 1
          }}
        >
          {isCrossfading ? '淡入淡出中...' : '🔄 执行交叉淡入淡出'}
        </button>
      </div>
    </PanelWrapper>
  )
}

// ── 10. AI-Family 主题曲面板 ──

export interface FamilyThemeTrack {
  id: string
  name: string
  url: string
  duration?: number
}

export function FamilyThemePanel({ isOpen, onClose, tracks, onPlay, currentlyPlayingId }: {
  isOpen: boolean
  onClose: () => void
  tracks: FamilyThemeTrack[]
  onPlay: (track: FamilyThemeTrack) => void
  currentlyPlayingId?: string | null
}) {
  const { tokens } = useThemeStore()
  return (
    <PanelWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="AI-Family 主题曲"
      icon={<span className="text-xl">🎵</span>}
    >
      <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${tokens.border}` }}>
        <img
          src="/AI-FAmily/音乐空间.png"
          alt="AI-Family 音乐空间"
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      </div>
      <p className="text-sm mb-4" style={{ color: tokens.foregroundMuted }}>
        YYC³ 家族之声 —— 原创主题曲随端分发，离线亦可播放
      </p>
      <div className="space-y-2">
        {tracks.map((t) => (
          <button
            key={t.id}
            onClick={() => onPlay(t)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-white/5"
            style={{
              border: `1px solid ${currentlyPlayingId === t.id ? tokens.primary : tokens.border}`,
            }}
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: currentlyPlayingId === t.id ? tokens.primary : `${tokens.primary}22` }}
            >
              ▶
            </span>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm font-medium">{t.name}</span>
              <span className="block text-xs" style={{ color: tokens.foregroundMuted }}>
                {t.duration ? formatTime(t.duration) : 'AI-Family 主题曲'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </PanelWrapper>
  )
}

// ── 辅助函数 ──

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
