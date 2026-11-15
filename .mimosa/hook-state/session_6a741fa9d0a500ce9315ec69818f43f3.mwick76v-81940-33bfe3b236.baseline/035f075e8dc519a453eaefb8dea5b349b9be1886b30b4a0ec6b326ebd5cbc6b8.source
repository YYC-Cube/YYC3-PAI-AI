/**
 * @file webgpu-inference-store.deep.test.ts
 * @description WebGPU推理Store深化测试——IDB缓存全链路/初始化三级回退/加载失败复位/推理统计
 *
 * 深化背景：浅测（webgpu-inference-store.test.ts）对 initializeWebGPU/loadModel/infer
 * 只断言「方法可调用」，IndexedDBManager 八个方法、加载进度与失败复位、embeddings 分支、
 * clearCache 清库等执行路径均未触达。
 *
 * 测法约定：
 * - IndexedDB 用 src/test/helpers/memory-idb.ts（beforeEach 遍历 idb.stores 清库）；
 *   其 open 不给 onupgradeneeded 传 event，本文件包一层补 { target: { result: db } }。
 * - 推理引擎（loadPipeline/runCompletion/runEmbedding/unloadPipeline）经 vi.mock 桩掉，
 *   工厂引用外部值按铁律走 vi.hoisted。
 * - 本 store 无定时器依赖，不启用 fake timers。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-11-12
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { enableMapSet } from 'immer'
import { createMemoryIDB } from '../../../test/helpers/memory-idb'
import { useWebGPUInferenceStore, PREDEFINED_MODELS } from '../webgpu-inference-store'

/** 推理引擎桩（工厂引用外部值 → vi.hoisted） */
const engine = vi.hoisted(() => ({
  loadPipeline: vi.fn(),
  runCompletion: vi.fn(),
  runEmbedding: vi.fn(),
  unloadPipeline: vi.fn(),
}))

vi.mock('../../services/local-inference-engine', () => ({
  HF_MODEL_MAP: {
    'tinyllama-1.1b': { repo: 'mock/tinyllama', task: 'text-generation' as const },
    'codebert-base': { repo: 'mock/codebert', task: 'feature-extraction' as const },
    'distilgpt2': { repo: 'mock/distilgpt2', task: 'text-generation' as const },
  },
  loadPipeline: engine.loadPipeline,
  runCompletion: engine.runCompletion,
  runEmbedding: engine.runEmbedding,
  unloadPipeline: engine.unloadPipeline,
}))

enableMapSet()

const idb = createMemoryIDB()

/** memory-idb 的 open 不给 onupgradeneeded 传 event——包装补 { target: { result: db } } */
const rawOpen = idb.indexedDB.open.bind(idb.indexedDB)
const wrappedOpen = (name: string, version?: number) => {
  const request = rawOpen(name, version) as unknown as {
    result: unknown
    onsuccess: (() => void) | null
    onupgradeneeded: ((event: unknown) => void) | null
  }
  let inner: ((event: unknown) => void) | null = null
  Object.defineProperty(request, 'onupgradeneeded', {
    configurable: true,
    get: () => inner,
    set: (handler) => {
      inner = handler ? () => handler({ target: { result: request.result } }) : null
    },
  })
  return request
}
;(idb.indexedDB as { open: (name: string, version?: number) => unknown }).open = wrappedOpen
// setup.ts 已把 indexedDB 定义为 writable:true 的全局——直接赋值替换为内存实现
globalThis.indexedDB = idb.indexedDB as unknown as IDBFactory

/** 每用例重建未冻结模型表 */
const freshModels = () => new Map(PREDEFINED_MODELS.map((m) => [m.id, { ...m }]))

/** 注入带/不带 gpu 的 navigator（initializeWebGPU 运行时读全局） */
const stubNavigator = (withGpu: boolean) => {
  vi.stubGlobal('navigator', {
    ...(withGpu
      ? { gpu: { requestAdapter: vi.fn(async () => ({ requestDevice: vi.fn() })) } }
      : {}),
    hardwareConcurrency: 8,
  })
}

/** 直接向内存 IDB 的 models store 播种缓存记录 */
const seedCache = (records: { id: string; size: number }[]) => {
  const store = idb.stores.get('models')
  if (!store) return
  for (const r of records) {
    store.set(r.id, {
      id: r.id,
      data: 'pipeline:mock',
      timestamp: Date.now(),
      size: r.size,
      version: 1,
    })
  }
}

describe('webgpu-inference-store 深化——IDB 缓存链路与推理执行', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    for (const m of idb.stores.values()) m.clear()
    useWebGPUInferenceStore.setState({
      models: freshModels(),
      activeModelId: null,
      tasks: [],
      isLoadingModel: false,
      isInferencing: false,
      stats: {
        totalInferences: 0,
        totalInferenceTime: 0,
        avgInferenceTime: 0,
        successRate: 100,
      },
      webGPUSupported: false,
      engineType: 'none',
      cacheSize: 0,
      maxCacheSize: 500 * 1024 * 1024,
      _initialized: false,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('initializeWebGPU：gpu 可用 → webgpu 引擎，二段初始化读出 IDB 缓存大小', async () => {
    stubNavigator(true)
    const state = useWebGPUInferenceStore.getState()
    expect(await state.initializeWebGPU()).toBe(true)
    let updated = useWebGPUInferenceStore.getState()
    expect(updated.webGPUSupported).toBe(true)
    expect(updated.engineType).toBe('webgpu')
    expect(updated._initialized).toBe(true)
    expect(updated.cacheSize).toBe(0)

    // 建 store 后播种两条缓存记录，复位初始化标志重跑 → cacheSize = 300
    seedCache([
      { id: 'tinyllama-1.1b', size: 100 },
      { id: 'codebert-base', size: 200 },
    ])
    useWebGPUInferenceStore.setState({ _initialized: false })
    expect(await useWebGPUInferenceStore.getState().initializeWebGPU()).toBe(true)
    updated = useWebGPUInferenceStore.getState()
    expect(updated.cacheSize).toBe(300)
    expect(await state.getCacheStats()).toMatchObject({ size: 300, usage: 300 / (500 * 1024 * 1024) * 100 })
  })

  it('initializeWebGPU：幂等短路——已初始化直接返回缓存值不再探测', async () => {
    stubNavigator(true)
    await useWebGPUInferenceStore.getState().initializeWebGPU()
    const requestAdapter = vi.fn(async () => ({}))
    vi.stubGlobal('navigator', { gpu: { requestAdapter } })
    expect(await useWebGPUInferenceStore.getState().initializeWebGPU()).toBe(true)
    expect(requestAdapter).not.toHaveBeenCalled()
  })

  it('initializeWebGPU：无 gpu 有 WebGL → webgl 回退', async () => {
    stubNavigator(false)
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => ({})),
    } as unknown as HTMLCanvasElement)
    expect(await useWebGPUInferenceStore.getState().initializeWebGPU()).toBe(true)
    const updated = useWebGPUInferenceStore.getState()
    expect(updated.engineType).toBe('webgl')
    expect(updated.webGPUSupported).toBe(false)
    vi.restoreAllMocks()
  })

  it('initializeWebGPU：无 gpu 无 webgl → wasm 兜底', async () => {
    stubNavigator(false)
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: vi.fn(() => null),
    } as unknown as HTMLCanvasElement)
    expect(await useWebGPUInferenceStore.getState().initializeWebGPU()).toBe(true)
    expect(useWebGPUInferenceStore.getState().engineType).toBe('wasm')
    vi.restoreAllMocks()
  })

  it('initializeWebGPU：IDB 打开失败 → 捕获异常返回 false 并落 wasm', async () => {
    stubNavigator(true)
    // 直接赋值替换为失败桩（indexedDB 全局为 writable，可覆盖可还原）
    const failing = {
      open: () => {
        const request = {
          result: null,
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          onupgradeneeded: null as (() => void) | null,
        }
        queueMicrotask(() => request.onerror?.())
        return request
      },
    }
    globalThis.indexedDB = failing as unknown as IDBFactory
    try {
      expect(await useWebGPUInferenceStore.getState().initializeWebGPU()).toBe(false)
      const updated = useWebGPUInferenceStore.getState()
      expect(updated.engineType).toBe('wasm')
      expect(updated.webGPUSupported).toBe(false)
    } finally {
      globalThis.indexedDB = idb.indexedDB as unknown as IDBFactory
    }
  })

  it('loadModel 成功全链路：进度回调、device 参数、元数据落 IDB、缓存大小更新', async () => {
    stubNavigator(true)
    await useWebGPUInferenceStore.getState().initializeWebGPU()
    engine.loadPipeline.mockImplementation(
      async (_id: string, opts?: { onProgress?: (pct: number, note: string) => void }) => {
        opts?.onProgress?.(40, 'downloading')
        opts?.onProgress?.(100, 'done')
        return {}
      }
    )

    await useWebGPUInferenceStore.getState().loadModel('tinyllama-1.1b')
    expect(engine.loadPipeline).toHaveBeenCalledTimes(1)
    const [calledId, callOpts] = engine.loadPipeline.mock.calls[0]
    expect(calledId).toBe('tinyllama-1.1b')
    expect(callOpts.device).toBe('webgpu')
    expect(typeof callOpts.onProgress).toBe('function')

    const updated = useWebGPUInferenceStore.getState()
    const model = updated.models.get('tinyllama-1.1b')
    expect(model?.loaded).toBe(true)
    expect(model?.loadProgress).toBe(100)
    expect(updated.isLoadingModel).toBe(false)

    // 元数据落 IDB：data 为 pipeline:repo 形态，缓存大小同步
    const dump = idb.dump('models') as { id: string; data: string; size: number }[]
    expect(dump).toHaveLength(1)
    expect(dump[0].id).toBe('tinyllama-1.1b')
    expect(dump[0].data).toBe('pipeline:mock/tinyllama')
    expect(dump[0].size).toBeGreaterThan(0)
    expect(updated.cacheSize).toBe(dump[0].size)

    // wasm 引擎模型 → device 'wasm'
    await useWebGPUInferenceStore.getState().loadModel('distilgpt2')
    expect(engine.loadPipeline.mock.calls[1][1].device).toBe('wasm')
  })

  it('loadModel 失败：进度与 isLoadingModel 复位并重抛', async () => {
    engine.loadPipeline.mockRejectedValue(new Error('权重下载失败'))
    await expect(useWebGPUInferenceStore.getState().loadModel('tinyllama-1.1b')).rejects.toThrow(
      '权重下载失败'
    )
    const updated = useWebGPUInferenceStore.getState()
    const model = updated.models.get('tinyllama-1.1b')
    expect(model?.loaded).toBe(false)
    expect(model?.loadProgress).toBe(0)
    expect(updated.isLoadingModel).toBe(false)
    expect(idb.dump('models')).toHaveLength(0)
  })

  it('loadModel 守卫：不存在抛 not found；已加载早退不再触发 pipeline 加载', async () => {
    await expect(useWebGPUInferenceStore.getState().loadModel('幽灵模型')).rejects.toThrow(
      /not found/
    )
    useWebGPUInferenceStore.setState((s) => {
      const m = s.models.get('tinyllama-1.1b')
      if (m) m.loaded = true
    })
    await useWebGPUInferenceStore.getState().loadModel('tinyllama-1.1b')
    expect(engine.loadPipeline).not.toHaveBeenCalled()
  })

  it('unloadModel/unloadAllModels：复位加载态、联动 activeModelId、透传引擎卸载', () => {
    useWebGPUInferenceStore.setState((s) => {
      const m = s.models.get('tinyllama-1.1b')
      if (m) {
        m.loaded = true
        m.loadProgress = 88
      }
      s.activeModelId = 'tinyllama-1.1b'
    })
    useWebGPUInferenceStore.getState().unloadModel('tinyllama-1.1b')
    let updated = useWebGPUInferenceStore.getState()
    expect(engine.unloadPipeline).toHaveBeenCalledWith('tinyllama-1.1b')
    expect(updated.models.get('tinyllama-1.1b')?.loaded).toBe(false)
    expect(updated.models.get('tinyllama-1.1b')?.loadProgress).toBe(0)
    expect(updated.activeModelId).toBeNull()

    useWebGPUInferenceStore.setState((s) => {
      const m = s.models.get('distilgpt2')
      if (m) m.loaded = true
      s.activeModelId = 'distilgpt2'
    })
    useWebGPUInferenceStore.getState().unloadAllModels()
    updated = useWebGPUInferenceStore.getState()
    updated.models.forEach((m) => expect(m.loaded).toBe(false))
    expect(updated.activeModelId).toBeNull()
  })

  it('infer 文本生成：任务记录 completed、统计推进、输出去首尾空白', async () => {
    useWebGPUInferenceStore.setState((s) => {
      const m = s.models.get('tinyllama-1.1b')
      if (m) m.loaded = true
    })
    engine.runCompletion.mockResolvedValue('  生成结果文本  ')

    const output = await useWebGPUInferenceStore.getState().infer('tinyllama-1.1b', '写一个排序')
    expect(output).toBe('生成结果文本')
    expect(engine.runCompletion).toHaveBeenCalledWith('tinyllama-1.1b', '写一个排序', 160)

    const updated = useWebGPUInferenceStore.getState()
    expect(updated.tasks).toHaveLength(1)
    const task = updated.tasks[0]
    expect(task.status).toBe('completed')
    expect(task.output).toBe('生成结果文本')
    expect(task.duration).toBeGreaterThanOrEqual(0)
    expect(updated.isInferencing).toBe(false)
    expect(updated.stats.totalInferences).toBe(1)
    expect(updated.stats.successRate).toBe(100)
  })

  it('infer embeddings：走 runEmbedding 输出向量摘要且不调 runCompletion', async () => {
    useWebGPUInferenceStore.setState((s) => {
      const m = s.models.get('codebert-base')
      if (m) m.loaded = true
    })
    engine.runEmbedding.mockResolvedValue([0.1, 0.2, 0.3, 0.4])

    const output = await useWebGPUInferenceStore.getState().infer('codebert-base', 'const a = 1')
    expect(output).toContain('dim=4')
    expect(output).toContain('0.1')
    expect(engine.runEmbedding).toHaveBeenCalledWith('codebert-base', 'const a = 1')
    expect(engine.runCompletion).not.toHaveBeenCalled()

    const updated = useWebGPUInferenceStore.getState()
    expect(updated.tasks[0]?.status).toBe('completed')
    expect(updated.stats.totalInferences).toBe(1)
  })

  it('infer 失败：任务标记 error、isInferencing 复位、统计未计入并重抛', async () => {
    useWebGPUInferenceStore.setState((s) => {
      const m = s.models.get('tinyllama-1.1b')
      if (m) m.loaded = true
    })
    engine.runCompletion.mockRejectedValue(new Error('推理内核崩溃'))

    await expect(
      useWebGPUInferenceStore.getState().infer('tinyllama-1.1b', '输入')
    ).rejects.toThrow('推理内核崩溃')

    const updated = useWebGPUInferenceStore.getState()
    expect(updated.tasks[0]?.status).toBe('error')
    expect(updated.tasks[0]?.error).toBe('推理内核崩溃')
    expect(updated.isInferencing).toBe(false)
    expect(updated.stats.totalInferences).toBe(0)
  })

  it('clearCache/clearAll：清空 IDB 缓存与任务/统计/初始化标志', async () => {
    stubNavigator(true)
    await useWebGPUInferenceStore.getState().initializeWebGPU()
    seedCache([{ id: 'tinyllama-1.1b', size: 1024 }])
    useWebGPUInferenceStore.setState({ cacheSize: 1024, tasks: [], stats: {
      totalInferences: 5,
      totalInferenceTime: 500,
      avgInferenceTime: 100,
      successRate: 80,
    } })

    await useWebGPUInferenceStore.getState().clearCache()
    expect(idb.dump('models')).toHaveLength(0)
    expect(useWebGPUInferenceStore.getState().cacheSize).toBe(0)

    useWebGPUInferenceStore.getState().clearAll()
    const cleared = useWebGPUInferenceStore.getState()
    expect(cleared.tasks).toEqual([])
    expect(cleared.stats).toEqual({
      totalInferences: 0,
      totalInferenceTime: 0,
      avgInferenceTime: 0,
      successRate: 100,
    })
    expect(cleared._initialized).toBe(false)
  })

  it('preloadModel 三分支：已加载早退、不存在静默、未加载委托 loadModel', async () => {
    // 已加载 → 早退
    useWebGPUInferenceStore.setState((s) => {
      const m = s.models.get('tinyllama-1.1b')
      if (m) m.loaded = true
    })
    await useWebGPUInferenceStore.getState().preloadModel('tinyllama-1.1b')
    expect(engine.loadPipeline).not.toHaveBeenCalled()

    // 不存在 → 静默返回不抛错
    await expect(useWebGPUInferenceStore.getState().preloadModel('幽灵模型')).resolves.toBeUndefined()

    // 未加载 → 委托 loadModel 完成加载
    await useWebGPUInferenceStore.getState().preloadModel('distilgpt2')
    expect(engine.loadPipeline).toHaveBeenCalledTimes(1)
    expect(useWebGPUInferenceStore.getState().models.get('distilgpt2')?.loaded).toBe(true)
  })

  it('getCacheStats：按当前缓存与上限换算使用率', () => {
    useWebGPUInferenceStore.setState({ cacheSize: 250 * 1024 * 1024 })
    const stats = useWebGPUInferenceStore.getState().getCacheStats()
    expect(stats.max).toBe(500 * 1024 * 1024)
    expect(stats.size).toBe(250 * 1024 * 1024)
    expect(stats.usage).toBe(50)
  })
})
