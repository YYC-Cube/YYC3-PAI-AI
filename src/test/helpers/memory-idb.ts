/**
 * @file memory-idb.ts
 * @description 测试助手：最小可用内存 IndexedDB — 驱动 openDB/withStore 真实路径
 *
 * setup.ts 的全局 indexedDB 桩不回调 put/get 的 onsuccess，
 * 本助手提供完整事务语义（微任务触发 success），供 service 专项测试覆盖 IDB 路径。
 */

interface MemoryRequest<T> {
  result: T
  onsuccess: (() => void) | null
  onerror: (() => void) | null
  error: unknown
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
    return {
      put: (v: { id: string }) => { store.set(v.id, v); return req(store.size) },
      get: (id: string) => req(store.get(id)),
      getAll: () => req([...store.values()]),
      delete: (id: string) => { store.delete(id); return req(undefined) },
      clear: () => { store.clear(); return req(undefined) },
      count: () => req(store.size),
      createIndex: () => { /* 索引不影响这些测试路径 */ },
    }
  }

  const db = {
    objectStoreNames: { contains: (name: string) => stores.has(name) },
    createObjectStore: (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map())
      return { createIndex: () => { /* noop */ } }
    },
    transaction: (_name: string, _mode: string) => ({
      objectStore: makeStore,
    }),
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
