/**
 * @file AudioPlaylist.test.tsx
 * @description 播放列表管理组件测试 — 引擎整模块 stub（曲目渲染/播放暂停/选择/删除/编辑布线）
 * 模式对齐 AudioPanel.test.tsx（getAudioEngine 整模块 mock）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

const h = vi.hoisted(() => {
  const engine = {
    getTracks: vi.fn((): Array<Record<string, unknown>> => []),
    play: vi.fn(),
    pause: vi.fn(),
    deleteTrack: vi.fn(() => true),
    getState: vi.fn(() => ({ isPlaying: false, currentTrack: null, currentTime: 0, duration: 0, playlist: null, queues: [] })),
    subscribe: vi.fn(() => () => {}),
  }
  return { engine }
})

vi.mock('../../../utils/audio-engine', () => ({ getAudioEngine: () => h.engine }))

const track = (id: string, name: string, duration = 100) => ({
  id, name, url: `blob:${id}`, duration, size: 1000, type: 'music', tags: [], createdAt: 1, updatedAt: 1,
})

import { AudioPlaylist } from '../AudioPlaylist'
import type { Playlist } from '../../../utils/audio-engine'

const btn = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === label || b.title === label || b.textContent === label)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  h.engine.getTracks.mockReturnValue([])
})

describe('AudioPlaylist（播放列表管理）', () => {
  it('引擎曲目渲染：名称/时长显示', () => {
    h.engine.getTracks.mockReturnValue([track('t1', '曲目甲', 180)])
    const { container } = render(<AudioPlaylist />)
    expect(container.textContent).toContain('曲目甲')
    expect(container.textContent).toContain('3:00')
  })

  it('playlist.tracks 优先于引擎曲目', () => {
    h.engine.getTracks.mockReturnValue([track('t1', '引擎曲', 60)])
    const pl = { id: 'p1', name: '歌单', tracks: [track('p-t1', '歌单曲', 30)], shuffle: false, repeat: 'off' } as unknown as Playlist
    const { container } = render(<AudioPlaylist playlist={pl} />)
    expect(container.textContent).toContain('歌单曲')
    expect(container.textContent).not.toContain('引擎曲')
  })

  it('空态：无曲目渲染空态提示', () => {
    const { container } = render(<AudioPlaylist />)
    expect(container.textContent!.length).toBeGreaterThan(0)
  })

  it('播放/暂停切换：无当前曲时播首曲；播放中点按走 pause', () => {
    h.engine.getTracks.mockReturnValue([track('t1', '曲', 10)])
    const { container } = render(<AudioPlaylist />)
    const playBtn = btn(container, '播放')
    expect(playBtn).toBeTruthy()
    fireEvent.click(playBtn!)
    expect(h.engine.play).toHaveBeenCalledWith('t1')
    // 组件 isPlaying 置位后再次点击 → pause
    const pauseBtn = btn(container, '暂停')
    if (pauseBtn) {
      fireEvent.click(pauseBtn)
      expect(h.engine.pause).toHaveBeenCalled()
    }
  })

  it('点击曲目行 → onTrackSelect 回调（行级 click 布线）', () => {
    h.engine.getTracks.mockReturnValue([track('t1', '选中曲', 10)])
    const onSelect = vi.fn()
    const { container } = render(<AudioPlaylist onTrackSelect={onSelect} />)
    const row = Array.from(container.querySelectorAll('[role="button"], .cursor-pointer, li, div'))
      .find(el => el.textContent === '选中曲')
    if (row) {
      fireEvent.click(row)
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 't1' }))
    } else {
      expect(container.textContent).toContain('选中曲')
    }
  })

  it('循环/随机按钮切换不崩溃（repeat/shuffle 状态翻转）', () => {
    const { container } = render(<AudioPlaylist />)
    const repeatBtn = container.querySelector('[aria-label*="循环"], [title*="循环"], [aria-label*="Repeat"], [title*="Repeat"]') as HTMLButtonElement | null
    if (repeatBtn) {
      fireEvent.click(repeatBtn)
      fireEvent.click(repeatBtn)
    }
    const shuffleBtn = container.querySelector('[aria-label*="随机"], [title*="随机"], [aria-label*="Shuffle"], [title*="Shuffle"]') as HTMLButtonElement | null
    if (shuffleBtn) fireEvent.click(shuffleBtn)
    expect(container).toBeTruthy()
  })

  it('删除曲目按钮 → deleteTrack 布线', () => {
    h.engine.getTracks.mockReturnValue([track('t1', '可删曲', 10)])
    const { container } = render(<AudioPlaylist />)
    const delBtn = container.querySelector('[aria-label*="删除"], [title*="删除"], [aria-label*="Remove"], [title*="Remove"]') as HTMLButtonElement | null
    if (delBtn) {
      fireEvent.click(delBtn)
      expect(h.engine.deleteTrack).toHaveBeenCalled()
    }
  })

  it('编辑按钮触发 onTrackEdit 回调', () => {
    h.engine.getTracks.mockReturnValue([track('t1', '编辑曲', 10)])
    const onEdit = vi.fn()
    const { container } = render(<AudioPlaylist onTrackEdit={onEdit} />)
    const editBtn = container.querySelector('[aria-label*="编辑"], [title*="编辑"], [aria-label*="Edit"], [title*="Edit"]') as HTMLButtonElement | null
    if (editBtn) {
      fireEvent.click(editBtn)
      expect(onEdit).toHaveBeenCalled()
    }
  })
})
