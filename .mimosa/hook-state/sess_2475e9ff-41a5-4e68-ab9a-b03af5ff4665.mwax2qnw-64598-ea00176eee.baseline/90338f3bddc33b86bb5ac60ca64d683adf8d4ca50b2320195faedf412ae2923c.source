/**
 * @file round12-services.test.ts
 * @description 第十二轮 service 专项 — DataSyncOrchestrator / DataPortabilityManager / MonacoPreloader
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { DataEntry, DataLocation } from '../../store/unified-data-store'

// ===== 公共夹具 =====

const entry = (id: string, over: Partial<DataEntry> = {}): DataEntry => ({
  id,
  type: 'settings',
  location: 'local',
  status: 'synced',
  size: 100,
  lastModified: Date.now(),
  encrypted: false,
  synced: false,
  ...over,
})

/** 内存存储适配器（对齐 StorageAdapter 契约） */
function makeAdapter(location: DataLocation, data: DataEntry[]) {
  const store = new Map(data.map(e => [e.id, { ...e }]))
  return {
    location,
    read: async (id: string) => store.get(id) ?? null,
    write: async (e: DataEntry) => { store.set(e.id, { ...e }) },
    delete: async (id: string) => { store.delete(id) },
    list: async () => [...store.values()].map(e => ({ ...e, location })),
    exists: async (id: string) => store.has(id),
    getMetadata: async (id: string) => {
      const e = store.get(id)
      return e ? { size: e.size, lastModified: e.lastModified } : null
    },
  }
}

// ===== DataSyncOrchestrator =====

import { DataSyncOrchestrator, type SyncEvent } from '../data-sync-orchestrator'

describe('DataSyncOrchestrator', () => {
  it('默认配置合并 + 自定义覆盖', () => {
    const o = new DataSyncOrchestrator({ syncInterval: 5000, conflictResolution: 'manual' })
    void o
    const d = new DataSyncOrchestrator()
    void d
    // 构造无异常即配置校验通过（内部 config 私有）
  })

  it('syncAll：多适配器聚合 → 批处理 → completed + 进度事件流', async () => {
    const source = makeAdapter('local', [entry('a'), entry('b'), entry('c')])
    const target = makeAdapter('indexeddb', [])
    const o = new DataSyncOrchestrator({ batchSize: 2 })
    o.registerAdapter(source)
    o.registerAdapter(target)

    const events: SyncEvent[] = []
    o.addEventListener(e => events.push(e))

    const job = await o.syncAll()
    expect(job.status).toBe('completed')
    expect(job.totalItems).toBe(3)
    expect(job.processedItems).toBe(3)
    expect(job.progress).toBe(100)
    // 事件序列：start → progress* → complete
    const types = events.map(e => e.type)
    expect(types[0]).toBe('start')
    expect(types).toContain('progress')
    expect(types[types.length - 1]).toBe('complete')
    // 目标适配器收到写入
    expect(await target.exists('a')).toBe(true)
    expect(await target.exists('c')).toBe(true)
  })

  it('事件监听器可退订', async () => {
    const o = new DataSyncOrchestrator()
    const seen: SyncEvent[] = []
    const off = o.addEventListener(e => seen.push(e))
    off()
    await o.syncAll()
    expect(seen).toHaveLength(0)
  })

  it('同步错误计入 job.errors（适配器抛错，error 字段）', async () => {
    const bad = { ...makeAdapter('local', []), list: async () => { throw new Error('list boom') } }
    const o = new DataSyncOrchestrator()
    o.registerAdapter(bad as never)
    const job = await o.syncAll()
    expect(job.status).toBe('failed')
    expect(job.errors.length).toBeGreaterThan(0)
    expect(String(job.errors[0].error)).toContain('list boom')
  })

  it('startAutoSync/stopAutoSync 定时器生命周期', () => {
    vi.useFakeTimers()
    try {
      const o = new DataSyncOrchestrator({ syncInterval: 1000 })
      const spy = vi.spyOn(o, 'syncAll').mockResolvedValue({} as never)
      o.startAutoSync()
      act(() => { vi.advanceTimersByTime(2500) })
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2)
      o.stopAutoSync()
      const count = spy.mock.calls.length
      act(() => { vi.advanceTimersByTime(5000) })
      expect(spy.mock.calls.length).toBe(count)
    } finally {
      vi.useRealTimers()
    }
  })
})

// ===== DataPortabilityManager =====

import { dataPortabilityManager } from '../data-portability-manager'

describe('DataPortabilityManager 导出', () => {
  const entries = [
    entry('e1', { type: 'settings' }),
    entry('e2', { type: 'models', encrypted: true }),
    entry('e3', { type: 'notes' }),
  ]

  it('JSON 导出：类型筛选 + 剔除加密项 + 元数据/校验和/文件名', async () => {
    const r = await dataPortabilityManager.exportData(entries, {
      format: 'json',
      includeEncrypted: false,
    } as never)
    expect(r.entries).toBe(2)
    expect(r.filename).toMatch(/yyc3.*export.*\.json$/)
    expect(r.checksum).toBeTruthy()
    expect(r.size).toBeGreaterThan(50)
    // Blob 可解析出 DataPackage
    const pkg = JSON.parse(await r.blob.text()) as { metadata: { totalEntries: number; dataTypes: string[]; encrypted: boolean } }
    expect(pkg.metadata.totalEntries).toBe(2)
    expect(pkg.metadata.dataTypes).toEqual(['settings', 'notes'])
    expect(pkg.metadata.encrypted).toBe(false)
  })

  it('entries ID 白名单筛选优先', async () => {
    const r = await dataPortabilityManager.exportData(entries, {
      format: 'json', entries: ['e1'],
    } as never)
    expect(r.entries).toBe(1)
  })

  it('includeEncrypted=true 保留加密项', async () => {
    const r = await dataPortabilityManager.exportData(entries, {
      format: 'json', includeEncrypted: true,
    } as never)
    expect(r.entries).toBe(3)
  })

  it('不支持格式抛错', async () => {
    await expect(dataPortabilityManager.exportData(entries, { format: 'tar' } as never))
      .rejects.toThrow('Unsupported format')
  })

  it('previewImport：合法 JSON 包返回元信息；坏文件报错', async () => {
    const r = await dataPortabilityManager.exportData(entries, { format: 'json' } as never)
    // 对齐真实用法：以带文件名的 File 传递（parseFile 按扩展名分流）
    const pkgFile = new File([await r.blob.arrayBuffer()], r.filename, { type: 'application/json' })
    const preview = await dataPortabilityManager.previewImport(pkgFile)
    expect(preview.valid).toBe(true)
    expect(preview.totalEntries).toBeGreaterThan(0)
    expect(preview.packageVersion).toBe('2.0.0')

    const bad = new File(['{{{not json at all'], 'bad.json', { type: 'application/json' })
    const badPreview = await dataPortabilityManager.previewImport(bad)
    expect(badPreview.valid).toBe(false)
    expect((badPreview.errors ?? []).length).toBeGreaterThan(0)
  })
})

// ===== MonacoPreloader =====

vi.mock('../monaco-setup', () => ({ monaco: {} }))
vi.mock('@monaco-editor/react', () => ({ loader: { config: vi.fn() } }))

import { getMonacoPreloader, useMonacoPreload, PRELOAD_STRATEGIES } from '../monaco-preloader'

describe('MonacoPreloader', () => {
  it('单例 + 初始 idle', () => {
    expect(getMonacoPreloader()).toBe(getMonacoPreloader())
    expect(getMonacoPreloader().getState()).toBe('idle')
    expect(getMonacoPreloader().isLoaded()).toBe(false)
  })

  it('preload(high)：加载成功 → loaded → 重复调用直接 true（幂等）', async () => {
    const p = getMonacoPreloader()
    const ok = await p.preload('high')
    expect(ok).toBe(true)
    expect(p.getState()).toBe('loaded')
    expect(await p.preload('high')).toBe(true)
  })

  it('onLoad 订阅收到 success 通知', async () => {
    const p = getMonacoPreloader()
    const cb = vi.fn()
    p.onLoad(cb)
    await p.preload('high')
    expect(cb).toHaveBeenCalledWith(true)
  })

  it('useMonacoPreload hook：state 流转 loaded', async () => {
    const { result } = renderHook(() => useMonacoPreload())
    expect(['idle', 'loading', 'loaded']).toContain(result.current.state)
    await act(async () => { await result.current.preload('high') })
    await waitFor(() => expect(result.current.state).toBe('loaded'))
    expect(result.current.isLoaded).toBe(true)
  })

  it('PRELOAD_STRATEGIES 常量集', () => {
    expect(Object.keys(PRELOAD_STRATEGIES).length).toBeGreaterThan(0)
  })
})
