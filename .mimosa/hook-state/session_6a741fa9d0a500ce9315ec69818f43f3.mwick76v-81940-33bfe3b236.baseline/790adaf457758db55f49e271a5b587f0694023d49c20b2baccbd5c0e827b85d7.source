/**
 * @file MusicSocialModule.test.ts
 * @description 音乐社交模块专项 — 协作播放列表/实时评论/打赏三管理器（真实 localStorage），驱动：协作单创建
 *              （owner 成员/新单置顶/20 上限淘汰）、曲目增删去重与删除、损坏 JSON 容错、评论追加与时间排序、
 *              200 条上限淘汰、时间窗过滤、点赞、打赏余额扣减与不足拒绝、按艺术家聚合统计
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  GIFT_CONFIG,
  collabPlaylistManager,
  giftTipManager,
  timedCommentManager,
  type CollaborativePlaylist,
  type GiftTip,
  type TimedComment,
} from '../MusicSocialModule'

// 存储键按铁律拆分拼接
const KEY_PLAYLISTS = ['yyc3', 'collab', 'playlists'].join('-')
const KEY_COMMENTS = ['yyc3', 'timed', 'comments'].join('-')
const KEY_TIPS = ['yyc3', 'gift', 'tips'].join('-')
const KEY_BALANCE = ['yyc3', 'user', 'balance'].join('-')

const mkPlData = (over: Partial<Omit<CollaborativePlaylist, 'id' | 'createdAt' | 'updatedAt' | 'members'>> = {}) => ({
  name: '家庭歌单',
  description: '一起听',
  createdBy: 'local-user',
  trackIds: ['t1'],
  isPublic: true,
  coverColor: '#8b5cf6',
  ...over,
})

const mkCommentData = (over: Partial<Omit<TimedComment, 'id' | 'createdAt' | 'likes' | 'replies'>> = {}) => ({
  trackId: 't1',
  userId: 'u2',
  displayName: '沫语',
  avatar: '👧',
  content: '这段副歌绝了',
  timestamp: 30000,
  ...over,
})

const mkTipData = (over: Partial<Omit<GiftTip, 'id' | 'createdAt'>> = {}) => ({
  trackId: 't1',
  fromUserId: 'local-user',
  fromDisplayName: '我',
  toArtistId: '沫言',
  toArtistName: '沫言',
  giftType: 'star' as const,
  amount: 2,
  message: '',
  ...over,
})

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

// ── 协作播放列表 ──

describe('CollabPlaylistManager（协作播放列表）', () => {
  it('createPlaylist 生成 id/时间戳并自动加入 local-user owner 成员，写入 localStorage', () => {
    const pl = collabPlaylistManager.createPlaylist(mkPlData())

    expect(pl.id).toMatch(/^pl-[0-9a-z]+-[0-9a-z]+$/)
    expect(pl.createdAt).toBeGreaterThan(0)
    expect(pl.updatedAt).toBe(pl.createdAt)
    expect(pl.members).toEqual([
      { userId: 'local-user', displayName: '我', avatar: '👤', role: 'owner', joinedAt: pl.createdAt },
    ])

    const persisted = JSON.parse(localStorage.getItem(KEY_PLAYLISTS)!)
    expect(persisted).toHaveLength(1)
    expect(persisted[0].name).toBe('家庭歌单')
    expect(collabPlaylistManager.getPlaylists()[0].id).toBe(pl.id)
  })

  it('新单置顶（unshift）；超过 20 个淘汰最旧（pop）', () => {
    for (let i = 0; i < 21; i++) {
      collabPlaylistManager.createPlaylist(mkPlData({ name: `单-${i}` }))
    }
    const all = collabPlaylistManager.getPlaylists()
    expect(all).toHaveLength(20)
    expect(all[0].name).toBe('单-20') // 最新在前
    expect(all[19].name).toBe('单-1') // 最旧「单-0」被淘汰
  })

  it('addTrack 去重（重复添加不重复写入也不刷新 updatedAt）、未知单返回 false；removeTrack 过滤并持久化', () => {
    const pl = collabPlaylistManager.createPlaylist(mkPlData())
    // 注意：createPlaylist 返回的是独立副本（unshift 前经 JSON 序列化往返），断言须读取最新持久化状态
    const live = () => collabPlaylistManager.getPlaylists()[0]

    expect(collabPlaylistManager.addTrack(pl.id, 't2')).toBe(true)
    expect(live().trackIds).toEqual(['t1', 't2'])
    const updatedFirst = live().updatedAt

    // 去重：已存在不追加
    vi.spyOn(Date, 'now').mockReturnValue(updatedFirst + 1000)
    expect(collabPlaylistManager.addTrack(pl.id, 't2')).toBe(true)
    expect(live().trackIds).toEqual(['t1', 't2'])
    expect(live().updatedAt).toBe(updatedFirst) // 未变化

    expect(collabPlaylistManager.addTrack('ghost', 't9')).toBe(false)

    expect(collabPlaylistManager.removeTrack(pl.id, 't1')).toBe(true)
    expect(live().trackIds).toEqual(['t2'])
    expect(live().updatedAt).toBe(updatedFirst + 1000)
    expect(collabPlaylistManager.removeTrack('ghost', 't2')).toBe(false)
    vi.restoreAllMocks()
  })

  it('deletePlaylist 按 id 过滤持久化；损坏 JSON → 返回空列表不抛', () => {
    const pl = collabPlaylistManager.createPlaylist(mkPlData())
    collabPlaylistManager.deletePlaylist(pl.id)
    expect(collabPlaylistManager.getPlaylists()).toEqual([])

    localStorage.setItem(KEY_PLAYLISTS, '{broken json')
    expect(collabPlaylistManager.getPlaylists()).toEqual([])
  })
})

// ── 实时评论 ──

describe('TimedCommentManager（实时评论）', () => {
  it('addComment 生成 id/likes 0/replies 空；getComments 按播放时间戳升序排序', () => {
    const c1 = timedCommentManager.addComment(mkCommentData({ timestamp: 5000 }))
    const c2 = timedCommentManager.addComment(mkCommentData({ timestamp: 1000, displayName: '沫言' }))

    expect(c1.id).toMatch(/^cmt-[0-9a-z]+-[0-9a-z]+$/)
    expect(c1.likes).toBe(0)
    expect(c1.replies).toEqual([])

    const list = timedCommentManager.getComments('t1')
    expect(list.map((c) => c.timestamp)).toEqual([1000, 5000])

    // 全量存储结构：按曲目分组；存储保持写入顺序，读取时才按时间戳排序
    const all = JSON.parse(localStorage.getItem(KEY_COMMENTS)!)
    expect(Object.keys(all)).toEqual(['t1'])
    expect(all.t1.map((c: TimedComment) => c.displayName)).toEqual(['沫语', '沫言'])
    void c2
  })

  it('单曲目 200 条上限：超出淘汰最早写入（shift）', () => {
    for (let i = 0; i < 201; i++) {
      timedCommentManager.addComment(mkCommentData({ content: `弹幕-${i}` }))
    }
    const list = timedCommentManager.getComments('t1')
    expect(list).toHaveLength(200)
    expect(list.some((c) => c.content === '弹幕-0')).toBe(false) // 最早被淘汰
    expect(list.some((c) => c.content === '弹幕-200')).toBe(true)
  })

  it('getCommentsAtTime 默认 3000ms 窗口可自定义（边界含等于）；likeComment 点赞持久化、未知 id 静默；损坏 JSON → 空数组', () => {
    timedCommentManager.addComment(mkCommentData({ timestamp: 10_000 }))
    timedCommentManager.addComment(mkCommentData({ timestamp: 20_000 }))

    expect(timedCommentManager.getCommentsAtTime('t1', 11_000)).toHaveLength(1) // 仅 10s（±3s 内）
    expect(timedCommentManager.getCommentsAtTime('t1', 11_000, 1000)).toHaveLength(1) // |10s-11s|=1000 ≤ 窗口
    expect(timedCommentManager.getCommentsAtTime('t1', 11_000, 500)).toHaveLength(0)
    expect(timedCommentManager.getCommentsAtTime('t1', 20_000)).toHaveLength(1)

    const target = timedCommentManager.getComments('t1')[0]
    timedCommentManager.likeComment('t1', target.id)
    expect(timedCommentManager.getComments('t1').find((c) => c.id === target.id)?.likes).toBe(1)
    // 未知评论 id → 静默不落盘
    timedCommentManager.likeComment('t1', 'ghost')
    timedCommentManager.likeComment('ghost', target.id)

    localStorage.setItem(KEY_COMMENTS, 'not-json')
    expect(timedCommentManager.getComments('t1')).toEqual([])
    expect(timedCommentManager.getCommentsAtTime('t1', 0)).toEqual([])
  })
})

// ── 打赏系统 ──

describe('GiftTipManager（打赏）', () => {
  it('余额缺省 1000；setBalance 持久化；损坏/非法值回退 1000', () => {
    expect(giftTipManager.getBalance()).toBe(1000)
    giftTipManager.setBalance(2333)
    expect(localStorage.getItem(KEY_BALANCE)).toBe('2333')
    expect(giftTipManager.getBalance()).toBe(2333)

    localStorage.setItem(KEY_BALANCE, 'not-a-number')
    expect(giftTipManager.getBalance()).toBe(1000)
  })

  it('sendGift 扣减余额（价值×数量）并置顶记录；余额不足拒绝且不落盘', () => {
    giftTipManager.setBalance(30)

    // 星辰 10 × 2 = 20 → 余 10
    const r1 = giftTipManager.sendGift(mkTipData())
    expect(r1).toEqual({ success: true })
    expect(giftTipManager.getBalance()).toBe(10)
    expect(localStorage.getItem(KEY_TIPS)).not.toBeNull()

    // 火箭 50 × 1 = 50 > 余 10 → 拒绝
    const r2 = giftTipManager.sendGift(mkTipData({ giftType: 'rocket', amount: 1 }))
    expect(r2).toEqual({ success: false, error: '余额不足' })
    expect(giftTipManager.getBalance()).toBe(10)

    const tips = giftTipManager.getTips()
    expect(tips).toHaveLength(1)
    expect(tips[0].id).toMatch(/^tip-[0-9a-z]+-[0-9a-z]+$/)
    expect(tips[0].giftType).toBe('star')
  })

  it('getTipsForArtist 过滤 + getTotalTipsForArtist 汇总（价值=单价×数量累加）；损坏 JSON → 空记录', () => {
    giftTipManager.setBalance(10000)
    giftTipManager.sendGift(mkTipData({ toArtistName: '沫言', giftType: 'diamond', amount: 2 })) // 1000
    giftTipManager.sendGift(mkTipData({ toArtistName: '沫言', giftType: 'flower', amount: 3 })) // 3
    giftTipManager.sendGift(mkTipData({ toArtistName: '沫语', giftType: 'star', amount: 1 })) // 别家

    expect(giftTipManager.getTipsForArtist('沫言')).toHaveLength(2)
    expect(giftTipManager.getTotalTipsForArtist('沫言')).toEqual({ count: 2, value: 1003 })
    expect(giftTipManager.getTotalTipsForArtist('陌生人')).toEqual({ count: 0, value: 0 })

    localStorage.setItem(KEY_TIPS, '[broken')
    expect(giftTipManager.getTips()).toEqual([])
    expect(giftTipManager.getTotalTipsForArtist('沫言')).toEqual({ count: 0, value: 0 })
  })

  it('GIFT_CONFIG 六档礼物：图标/名称/单价/主题色齐全且单价递增', () => {
    const types = Object.keys(GIFT_CONFIG) as Array<keyof typeof GIFT_CONFIG>
    expect(types).toEqual(['flower', 'heart', 'star', 'rocket', 'crown', 'diamond'])
    expect(types.map((t) => GIFT_CONFIG[t].value)).toEqual([1, 5, 10, 50, 100, 500])
    for (const t of types) {
      expect(GIFT_CONFIG[t].icon).not.toBe('')
      expect(GIFT_CONFIG[t].name).not.toBe('')
      expect(GIFT_CONFIG[t].color).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
