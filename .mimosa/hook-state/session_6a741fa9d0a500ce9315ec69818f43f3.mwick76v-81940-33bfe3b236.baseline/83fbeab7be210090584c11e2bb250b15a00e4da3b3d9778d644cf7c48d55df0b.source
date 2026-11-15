/**
 * @file memory-idb.ts
 * @description 测试助手：最小可用内存 IndexedDB — 驱动 openDB/withStore/cursor/index 真实路径
 *
 * setup.ts 的全局 indexedDB 桩不回调 put/get 的 onsuccess，
 * 本助手提供完整事务语义（微任务触发 success），供 service 专项测试覆盖 IDB 路径。
 * v2：补 openCursor（getAll 游标路径）/ db.close / createIndex / index() / IDBKeyRange.only。
 */

interface MemoryRequest<T> {
  result: T
  onsuccess: (() => void) | null
  onerror: (() => void) | null
  error: unknown
}

interface MemCursor<T> {
  value: T
  continue: () => void
}

export function createMemoryIDB() {
  /** storeName → Map<id, record> */
  const stores = new Map<string, Map<string, { id: string } & Record<string, unknown>>>()

  const req = <T>(value: T): MemoryRequest<T> => {
    const request: MemoryRequest<T> = { result: value, onsuccess: null, onerror: null, error: null }
    queueMicrotask(() => request.onsuccess?.())
    return request
  }

  const makeStore = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map())
    const store = stores.get(name)!
    const indexes = new Map<string, string>() // indexName → keyPath

    const openCursor = (range?: unknown, _direction?: string) => {
      const items = [...store.values()]
      // IDBKeyRange.only 简化匹配：字符串/数字键按 record[keyPath] 相等过滤（range 为 KeyRange 形状或原值）
      let filtered = items
      const r = range as { lower?: unknown; upper?: unknown; only?: unknown; __only?: unknown } | undefined
      if (r && (r.only !== undefined || r.lower !== undefined || r.upper !== undefined || (r as { __only?: unknown }).__only !== undefined)) {
        const onlyVal = r.only ?? (r as { __only?: unknown }).__only
        if (onlyVal !== undefined) {
          filtered = items.filter(rec => {
            for (const [, kp] of indexes) {
              if (rec[kp] === onlyVal) return true
            }
            return rec.id === onlyVal
          })
        }
      }
      let i = 0
      const request: MemoryRequest<MemCursor<unknown> | null> & { result: MemCursor<unknown> | null } = {
        result: null, onsuccess: null, onerror: null, error: null,
      }
      const fire = () => {
        if (i < filtered.length) {
          request.result = {
            value: filtered[i],
            continue: () => { i++; queueMicrotask(fire) },
          }
        } else {
          request.result = null
        }
        request.onsuccess?.()
      }
      queueMicrotask(fire)
      return request
    }

    return {
      put: (v: { id: string }) => { store.set(v.id, v); return req(store.size) },
      get: (id: string) => req(store.get(id)),
      getAll: () => req([...store.values()]),
      delete: (id: string) => { store.delete(id); return req(undefined) },
      clear: () => { store.clear(); return req(undefined) },
      count: () => req(store.size),
      createIndex: (name: string, keyPath: string) => { indexes.set(name, keyPath) },
      index: (_name: string) => ({
        openCursor,
        getAll: () => req([...store.values()]),
      }),
      openCursor,
    }
  }

  const db = {
    objectStoreNames: { contains: (name: string) => stores.has(name) },
    createObjectStore: (name: string, _opts?: { keyPath?: string; autoIncrement?: boolean }) => {
      if (!stores.has(name)) stores.set(name, new Map())
      return { createIndex: (n: string, kp: string) => { makeStore(name).createIndex(n, kp) } }
    },
    transaction: (_name: string, _mode: string) => ({
      objectStore: makeStore,
    }),
    close: () => { /* 内存实现无持锁 */ },
    onversionchange: null as (() => void) | null,
  }

  const openRequest: MemoryRequest<unknown> & { onupgradeneeded: (() => void) | null } = {
    result: db, onsuccess: null, onerror: null, onupgradeneeded: null, error: null,
  }

  return {
    /** 形状对齐被测代码用到的 indexedDB.open */
    indexedDB: {
      open: (_name: string, _version?: number) => {
        queueMicrotask(() => {
          openRequest.onupgradeneeded?.()
          openRequest.onsuccess?.()
        })
        return openRequest
      },
    },
    stores,
    /** 直读内部存储（断言用） */
    dump: (name: string) => [...(stores.get(name)?.values() ?? [])],
  }
}

/** IDBKeyRange.only 形状（getAll 用：内存实现按 __only 匹配） */
export const memKeyRangeOnly = (v: unknown) => ({ __only: v })
