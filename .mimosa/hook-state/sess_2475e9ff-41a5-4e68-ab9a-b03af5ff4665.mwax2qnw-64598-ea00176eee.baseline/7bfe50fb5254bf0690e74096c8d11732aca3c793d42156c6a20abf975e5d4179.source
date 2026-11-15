/**
 * @file MusicSocialModule.ts
 * @description 音乐社交功能模块 - 协作播放列表 + 实时评论 + 打赏系统
 */

// ── 类型定义 ──

export interface CollaborativePlaylist {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: number
  updatedAt: number
  trackIds: string[]
  members: PlaylistMember[]
  isPublic: boolean
  coverColor: string
}

export interface PlaylistMember {
  userId: string
  displayName: string
  avatar: string
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: number
}

export interface TimedComment {
  id: string
  trackId: string
  userId: string
  displayName: string
  avatar: string
  content: string
  timestamp: number
  createdAt: number
  likes: number
  replies: TimedComment[]
}

export interface GiftTip {
  id: string
  trackId: string
  fromUserId: string
  fromDisplayName: string
  toArtistId: string
  toArtistName: string
  giftType: GiftType
  amount: number
  message: string
  createdAt: number
}

export type GiftType = 'flower' | 'heart' | 'star' | 'rocket' | 'crown' | 'diamond'

export const GIFT_CONFIG: Record<GiftType, { icon: string; name: string; value: number; color: string }> = {
  flower: { icon: '🌸', name: '鲜花', value: 1, color: '#f472b6' },
  heart: { icon: '❤️', name: '爱心', value: 5, color: '#ef4444' },
  star: { icon: '⭐', name: '星辰', value: 10, color: '#fbbf24' },
  rocket: { icon: '🚀', name: '火箭', value: 50, color: '#3b82f6' },
  crown: { icon: '👑', name: '皇冠', value: 100, color: '#a855f7' },
  diamond: { icon: '💎', name: '钻石', value: 500, color: '#06b6d4' },
}

// ── 协作播放列表管理器 ──

class CollabPlaylistManager {
  private storageKey = 'yyc3-collab-playlists'
  private maxPlaylists = 20

  createPlaylist(data: Omit<CollaborativePlaylist, 'id' | 'createdAt' | 'updatedAt' | 'members'>): CollaborativePlaylist {
    const playlist: CollaborativePlaylist = {
      ...data,
      id: `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      members: [{
        userId: 'local-user',
        displayName: '我',
        avatar: '👤',
        role: 'owner',
        joinedAt: Date.now()
      }]
    }

    const playlists = this.getPlaylists()
    playlists.unshift(playlist)

    if (playlists.length > this.maxPlaylists) {
      playlists.pop()
    }

    localStorage.setItem(this.storageKey, JSON.stringify(playlists))
    return playlist
  }

  getPlaylists(): CollaborativePlaylist[] {
    try {
      const raw = localStorage.getItem(this.storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  addTrack(playlistId: string, trackId: string): boolean {
    const playlists = this.getPlaylists()
    const playlist = playlists.find(p => p.id === playlistId)

    if (!playlist) return false

    if (!playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId)
      playlist.updatedAt = Date.now()
      localStorage.setItem(this.storageKey, JSON.stringify(playlists))
    }

    return true
  }

  removeTrack(playlistId: string, trackId: string): boolean {
    const playlists = this.getPlaylists()
    const playlist = playlists.find(p => p.id === playlistId)

    if (!playlist) return false

    playlist.trackIds = playlist.trackIds.filter(id => id !== trackId)
    playlist.updatedAt = Date.now()
    localStorage.setItem(this.storageKey, JSON.stringify(playlists))
    return true
  }

  deletePlaylist(playlistId: string): void {
    const playlists = this.getPlaylists().filter(p => p.id !== playlistId)
    localStorage.setItem(this.storageKey, JSON.stringify(playlists))
  }
}

// ── 实时评论管理器 ──

class TimedCommentManager {
  private storageKey = 'yyc3-timed-comments'
  private maxCommentsPerTrack = 200

  addComment(data: Omit<TimedComment, 'id' | 'createdAt' | 'likes' | 'replies'>): TimedComment {
    const comment: TimedComment = {
      ...data,
      id: `cmt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      likes: 0,
      replies: []
    }

    const comments = this.getComments(data.trackId)
    comments.push(comment)

    if (comments.length > this.maxCommentsPerTrack) {
      comments.shift()
    }

    this.saveComments(data.trackId, comments)
    return comment
  }

  getComments(trackId: string): TimedComment[] {
    try {
      const allComments = this.getAllComments()
      return (allComments[trackId] || [])
        .sort((a: TimedComment, b: TimedComment) => a.timestamp - b.timestamp)
    } catch {
      return []
    }
  }

  getCommentsAtTime(trackId: string, currentTime: number, windowMs: number = 3000): TimedComment[] {
    return this.getComments(trackId).filter(
      c => Math.abs(c.timestamp - currentTime) <= windowMs
    )
  }

  likeComment(trackId: string, commentId: string): void {
    const comments = this.getComments(trackId)
    const comment = comments.find(c => c.id === commentId)
    if (comment) {
      comment.likes++
      this.saveComments(trackId, comments)
    }
  }

  private getAllComments(): Record<string, TimedComment[]> {
    try {
      const raw = localStorage.getItem(this.storageKey)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  private saveComments(trackId: string, comments: TimedComment[]): void {
    const all = this.getAllComments()
    all[trackId] = comments
    localStorage.setItem(this.storageKey, JSON.stringify(all))
  }
}

// ── 打赏管理器 ──

class GiftTipManager {
  private storageKey = 'yyc3-gift-tips'
  private balanceKey = 'yyc3-user-balance'

  getBalance(): number {
    try {
      return Number(localStorage.getItem(this.balanceKey)) || 1000
    } catch {
      return 1000
    }
  }

  setBalance(amount: number): void {
    localStorage.setItem(this.balanceKey, String(amount))
  }

  sendGift(data: Omit<GiftTip, 'id' | 'createdAt'>): { success: boolean; error?: string } {
    const giftConfig = GIFT_CONFIG[data.giftType]
    const cost = giftConfig.value * data.amount
    const balance = this.getBalance()

    if (balance < cost) {
      return { success: false, error: '余额不足' }
    }

    const tip: GiftTip = {
      ...data,
      id: `tip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now()
    }

    this.setBalance(balance - cost)

    const tips = this.getTips()
    tips.unshift(tip)
    localStorage.setItem(this.storageKey, JSON.stringify(tips))

    return { success: true }
  }

  getTips(): GiftTip[] {
    try {
      const raw = localStorage.getItem(this.storageKey)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  getTipsForArtist(artistName: string): GiftTip[] {
    return this.getTips().filter(t => t.toArtistName === artistName)
  }

  getTotalTipsForArtist(artistName: string): { count: number; value: number } {
    const tips = this.getTipsForArtist(artistName)
    return {
      count: tips.length,
      value: tips.reduce((sum, tip) => {
        return sum + GIFT_CONFIG[tip.giftType].value * tip.amount
      }, 0)
    }
  }
}

export const collabPlaylistManager = new CollabPlaylistManager()
export const timedCommentManager = new TimedCommentManager()
export const giftTipManager = new GiftTipManager()
