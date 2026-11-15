/**
 * @file indexeddb-service.test.ts
 * @description IndexedDBService 专项 — 内存 IDB v2 驱动 CRUD/游标 getAll/批量/用量/连接生命周期
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMemoryIDB } from '../../../test/helpers/memory-idb'

const idb = createMemoryIDB()
Object.defineProperty(globalThis, 'indexedDB', { value: idb.indexedDB, writable: true })
// setup 的 IDBKeyRange 桩无 only 实现 → 提供
Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: { only: (v: unknown) => ({ __only: v }), lowerBound: vi.fn(), upperBound: vi.fn(), bound: vi.fn() },
  writable: true,
})

import { IndexedDBService } from '../indexeddb-service'

beforeEach(() => {
  vi.clearAllMocks()
  // 内存库跨用例清空（模块级单实例）
  for (const m of idb.stores.values()) m.clear()
  // navigator.storage.estimate（getUsage 用）
  Object.defineProperty(navigator, 'storage', {
    value: { estimate: async () => ({ usage: 4096, quota: 1048576 }) },
    configurable: true,
  })
})

describe('IndexedDBService 连接生命周期', () => {
  it('open 建 stores + ready；close 复位', async () => {
    const s = new IndexedDBService()
    expect(s.ready).toBe(false)
    await s.open()
    expect(s.ready).toBe(true)
    s.close()
    expect(s.ready).toBe(false)
  })

  it('open 幂等（复用连接）', async () => {
    const s = new IndexedDBService()
    const a = await s.open()
    const b = await s.open()
    expect(a).toBe(b)
  })
})

describe('IndexedDBService CRUD', () => {
  it('set/get 往返：记录信封（createdAt/updatedAt/encrypted/type）', async () => {
    const s = new IndexedDBService()
    await s.open()
    await s.set('files', 'f1', { name: 'a.txt' }, { encrypted: true, type: 'text' })
    const rec = await s.get<{ name: string }>('files', 'f1')
    expect(rec).not.toBeNull()
    expect(rec!.data.name).toBe('a.txt')
    expect(rec!.id).toBe('f1')
    expect(rec!.encrypted).toBe(true)
    expect(rec!.type).toBe('text')
    expect(rec!.createdAt).toBeGreaterThan(0)
    expect(await s.get('files', 'missing')).toBeNull()
  })

  it('getData 直取 payload', async () => {
    const s = new IndexedDBService()
    await s.open()
    await s.set('files', 'f2', { v: 42 })
    expect(await s.getData<{ v: number }>('files', 'f2')).toEqual({ v: 42 })
  })

  it('delete 后 get 为 null', async () => {
    const s = new IndexedDBService()
    await s.open()
    await s.set('files', 'f3', 1)
    await s.delete('files', 'f3')
    expect(await s.get('files', 'f3')).toBeNull()
  })

  it('getAll（游标路径）全量返回', async () => {
    const s = new IndexedDBService()
    await s.open()
    for (let i = 0; i < 5; i++) await s.set('files', `g${i}`, i)
    const all = await s.getAll('files')
    expect(all).toHaveLength(5)
    expect(all.map(r => r.id).sort()).toEqual(['g0', 'g1', 'g2', 'g3', 'g4'])
  })

  it('getAll offset/limit 分页（游标 continue 语义）', async () => {
    const s = new IndexedDBService()
    await s.open()
    for (let i = 0; i < 10; i++) await s.set('files', `p${i}`, i)
    const page = await s.getAll('files', { offset: 2, limit: 3 })
    expect(page).toHaveLength(3)
  })

  it('count / clear', async () => {
    const s = new IndexedDBService()
    await s.open()
    await s.set('files', 'c1', 1)
    await s.set('files', 'c2', 2)
    expect(await s.count('files')).toBe(2)
    await s.clear('files')
    expect(await s.count('files')).toBe(0)
  })

  it('bulkSet / bulkDelete 批量', async () => {
    const s = new IndexedDBService()
    await s.open()
    await s.bulkSet('files', [
      { id: 'b1', data: 1 }, { id: 'b2', data: 2 }, { id: 'b3', data: 3 },
    ])
    expect(await s.count('files')).toBe(3)
    await s.bulkDelete('files', ['b1', 'b3'])
    expect(await s.count('files')).toBe(1)
    expect(await s.getData('files', 'b2')).toBe(2)
  })

  it('getUsage：navigator.storage.estimate 聚合', async () => {
    const s = new IndexedDBService()
    await s.open()
    const usage = await s.getUsage()
    expect(usage.used).toBe(4096)
    expect(usage.total).toBe(1048576)
    expect(usage.percentage).toBeCloseTo((4096 / 1048576) * 100)
    expect(usage.storeCounts.files).toBeGreaterThanOrEqual(0)
  })
})
