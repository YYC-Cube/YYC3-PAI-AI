/**
 * @file webgpu-inference-store.ts
 * @description WebGPU AI推理Store，管理模型加载和推理任务（含IndexedDB缓存）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,webgpu,ai,inference,model,indexeddb
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createLogger } from '../utils/logger'
import { HF_MODEL_MAP, loadPipeline, runCompletion, runEmbedding, unloadPipeline } from '../services/local-inference-engine'

const logger = createLogger('webgpu')

/**
 * IndexedDB配置
 */
const IDB_CONFIG = {
  dbName: 'yyc3-webgpu-cache',
  dbVersion: 1,
  storeName: 'models',
  maxCacheSize: 500 * 1024 * 1024, // 500MB
}

/**
 * 缓存的模型数据
 */
interface CachedModel {
  /** 模型ID */
  id: string
  /** 模型数据（ArrayBuffer或字符串） */
  data: ArrayBuffer | string
  /** 缓存时间 */
  timestamp: number
  /** 数据大小（字节） */
  size: number
  /** 版本号 */
  version: number
}

/**
 * IndexedDB管理器
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null
  private dbConfig = IDB_CONFIG

  /** 初始化IndexedDB */
  async init(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbConfig.dbName, this.dbConfig.dbVersion)

      request.onerror = () => {
        logger.error('[IndexedDB] Failed to open database')
        reject(false)
      }

      request.onsuccess = () => {
        this.db = request.result
        logger.info('[IndexedDB] Database opened successfully')
        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.dbConfig.storeName)) {
          const store = db.createObjectStore(this.dbConfig.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          logger.debug('[IndexedDB] Object store created')
        }
      }
    })
  }

  /** 检查模型是否已缓存 */
  async hasModel(modelId: string): Promise<boolean> {
    if (!this.db) return false

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readonly')
      const store = transaction.objectStore(this.dbConfig.storeName)
      const request = store.get(modelId)

      request.onsuccess = () => {
        resolve(!!request.result)
      }

      request.onerror = () => {
        resolve(false)
      }
    })
  }

  /** 获取缓存的模型 */
  async getModel(modelId: string): Promise<CachedModel | null> {
    if (!this.db) return null

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readonly')
      const store = transaction.objectStore(this.dbConfig.storeName)
      const request = store.get(modelId)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        resolve(null)
      }
    })
  }

  /** 缓存模型数据 */
  async saveModel(modelId: string, data: ArrayBuffer | string): Promise<boolean> {
    if (!this.db) return false

    // 计算数据大小
    const size = data instanceof ArrayBuffer ? data.byteLength : new Blob([data]).size

    // 检查缓存大小限制
    const currentSize = await this.getTotalCacheSize()
    if (currentSize + size > this.dbConfig.maxCacheSize) {
      await this.cleanupOldest(currentSize + size - this.dbConfig.maxCacheSize)
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readwrite')
      const store = transaction.objectStore(this.dbConfig.storeName)

      const cachedModel: CachedModel = {
        id: modelId,
        data,
        timestamp: Date.now(),
        size,
        version: 1,
      }

      const request = store.put(cachedModel)

      request.onsuccess = () => {
        logger.info(`[IndexedDB] Model ${modelId} cached (${(size / 1024 / 1024).toFixed(2)}MB)`)
        resolve(true)
      }

      request.onerror = () => {
        logger.error(`[IndexedDB] Failed to cache model ${modelId}`)
        resolve(false)
      }
    })
  }

  /** 删除缓存的模型 */
  async deleteModel(modelId: string): Promise<boolean> {
    if (!this.db) return false

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readwrite')
      const store = transaction.objectStore(this.dbConfig.storeName)
      const request = store.delete(modelId)

      request.onsuccess = () => {
        logger.info(`[IndexedDB] Model ${modelId} deleted from cache`)
        resolve(true)
      }

      request.onerror = () => {
        logger.error(`[IndexedDB] Failed to delete model ${modelId}`)
        resolve(false)
      }
    })
  }

  /** 获取总缓存大小 */
  async getTotalCacheSize(): Promise<number> {
    if (!this.db) return 0

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readonly')
      const store = transaction.objectStore(this.dbConfig.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        const models = request.result as CachedModel[]
        const totalSize = models.reduce((sum, m) => sum + m.size, 0)
        resolve(totalSize)
      }

      request.onerror = () => {
        resolve(0)
      }
    })
  }

  /** 获取所有缓存的模型列表 */
  async getAllModels(): Promise<CachedModel[]> {
    if (!this.db) return []

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readonly')
      const store = transaction.objectStore(this.dbConfig.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result as CachedModel[])
      }

      request.onerror = () => {
        resolve([])
      }
    })
  }

  /** 清理最旧的缓存 */
  private async cleanupOldest(targetSize: number): Promise<void> {
    const models = await this.getAllModels()
    if (models.length === 0) return

    // 按时间戳排序
    models.sort((a, b) => a.timestamp - b.timestamp)

    let freedSize = 0
    for (const model of models) {
      if (freedSize >= targetSize) break
      await this.deleteModel(model.id)
      freedSize += model.size
    }

    logger.info(`[IndexedDB] Cleaned up ${(freedSize / 1024 / 1024).toFixed(2)}MB`)
  }

  /** 清除所有缓存 */
  async clearAll(): Promise<boolean> {
    if (!this.db) return false

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.dbConfig.storeName], 'readwrite')
      const store = transaction.objectStore(this.dbConfig.storeName)
      const request = store.clear()

      request.onsuccess = () => {
        logger.info('[IndexedDB] All cache cleared')
        resolve(true)
      }

      request.onerror = () => {
        logger.error('[IndexedDB] Failed to clear cache')
        resolve(false)
      }
    })
  }
}

// 全局IndexedDB管理器实例
const idbManager = new IndexedDBManager()

/**
 * AI模型类型
 */
export type AIModelType = 'code' | 'chat' | 'embeddings' | 'image'

/**
 * AI模型信息
 */
export interface AIModel {
  /** 模型ID */
  id: string
  /** 模型名称 */
  name: string
  /** 模型类型 */
  type: AIModelType
  /** 模型文件大小 (MB) */
  size: number
  /** 模型描述 */
  description: string
  /** 是否已加载 */
  loaded: boolean
  /** 加载进度 (0-100) */
  loadProgress: number
  /** 推理引擎类型 */
  engine: 'webgpu' | 'wasm' | 'webgl'
}

/**
 * 推理任务状态
 */
export type InferenceTaskStatus = 'pending' | 'running' | 'completed' | 'error'

/**
 * 推理任务
 */
export interface InferenceTask {
  /** 任务ID */
  id: string
  /** 模型ID */
  modelId: string
  /** 输入数据 */
  input: string
  /** 输出结果 */
  output?: string
  /** 任务状态 */
  status: InferenceTaskStatus
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 推理时间 (ms) */
  duration?: number
  /** 错误信息 */
  error?: string
}

/**
 * WebGPU推理Store状态
 */
interface WebGPUInferenceStoreState {
  /** 可用模型列表 */
  models: Map<string, AIModel>
  /** 当前激活的模型ID */
  activeModelId: string | null
  /** 推理任务历史 */
  tasks: InferenceTask[]
  /** 是否正在加载模型 */
  isLoadingModel: boolean
  /** 是否正在推理 */
  isInferencing: boolean
  /** 推理性能统计 */
  stats: {
    /** 总推理次数 */
    totalInferences: number
    /** 总推理时间 (ms) */
    totalInferenceTime: number
    /** 平均推理时间 (ms) */
    avgInferenceTime: number
    /** 推理成功率 (%) */
    successRate: number
  }
  /** WebGPU支持状态 */
  webGPUSupported: boolean
  /** 推理引擎类型 */
  engineType: 'webgpu' | 'wasm' | 'webgl' | 'none'
  /** IndexedDB缓存大小（字节） */
  cacheSize: number
  /** IndexedDB最大缓存大小（字节） */
  maxCacheSize: number
  /** 是否已初始化 */
  _initialized: boolean
}

/**
 * WebGPU推理Store操作
 */
interface WebGPUInferenceStoreActions {
  /** 初始化WebGPU支持检测 */
  initializeWebGPU: () => Promise<boolean>
  /** 加载模型 */
  loadModel: (modelId: string) => Promise<void>
  /** 卸载模型 */
  unloadModel: (modelId: string) => void
  /** 卸载所有模型 */
  unloadAllModels: () => void
  /** 设置激活模型 */
  setActiveModel: (modelId: string) => void
  /** 执行推理 */
  infer: (modelId: string, input: string) => Promise<string>
  /** 清除任务历史 */
  clearTasks: () => void
  /** 清除所有数据 */
  clearAll: () => void
  /** 获取推理统计 */
  getStats: () => WebGPUInferenceStoreState['stats']
  /** 清除IndexedDB缓存 */
  clearCache: () => Promise<void>
  /** 预加载模型 */
  preloadModel: (modelId: string) => Promise<void>
  /** 获取缓存统计 */
  getCacheStats: () => { size: number; max: number; usage: number }
}

/**
 * 预定义模型列表
 */
const PREDEFINED_MODELS: AIModel[] = [
  {
    id: 'tinyllama-1.1b',
    name: 'TinyLlama 1.1B',
    type: 'code',
    size: 1100,
    description: '轻量级代码生成模型，适合本地推理',
    loaded: false,
    loadProgress: 0,
    engine: 'webgpu',
  },
  {
    id: 'codebert-base',
    name: 'CodeBERT Base',
    type: 'embeddings',
    size: 420,
    description: '代码嵌入模型，用于代码相似度搜索',
    loaded: false,
    loadProgress: 0,
    engine: 'wasm',
  },
  {
    id: 'distilgpt2',
    name: 'DistilGPT2',
    type: 'chat',
    size: 360,
    description: '轻量级对话模型，快速响应',
    loaded: false,
    loadProgress: 0,
    engine: 'wasm',
  },
]

/**
 * WebGPU推理Store
 */
export const useWebGPUInferenceStore = create<WebGPUInferenceStoreState & WebGPUInferenceStoreActions>()(
  immer((set, get) => ({
    // 初始状态
    models: new Map(PREDEFINED_MODELS.map((m) => [m.id, m])),
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
    maxCacheSize: IDB_CONFIG.maxCacheSize,
    _initialized: false,

    // 初始化WebGPU支持检测
    initializeWebGPU: async () => {
      // 防止重复初始化
      const currentState = get()
      if (currentState._initialized) {
        return currentState.webGPUSupported
      }

      // 立即设置初始化标志，防止并发调用
      set((state) => {
        state._initialized = true
      })

      try {
        // 初始化IndexedDB
        await idbManager.init()

        // 更新缓存大小
        const cacheSize = await idbManager.getTotalCacheSize()
        set((state) => {
          state.cacheSize = cacheSize
        })

        // 检查WebGPU支持
        if ('gpu' in navigator) {
          const adapter = await navigator.gpu!.requestAdapter()
          if (adapter) {
            set((state) => {
              state.webGPUSupported = true
              state.engineType = 'webgpu'
            })
            logger.info('[WebGPU] WebGPU initialized successfully')
            return true
          }
        }

        // 后备：WebGL
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
        if (gl) {
          set((state) => {
            state.webGPUSupported = false
            state.engineType = 'webgl'
          })
          logger.info('[WebGPU] WebGL available (fallback)')
          return true
        }

        // 后备：WASM
        set((state) => {
          state.webGPUSupported = false
          state.engineType = 'wasm'
        })
        logger.info('[WebGPU] WASM mode (fallback)')
        return true
      } catch (error) {
        logger.error('[WebGPU] Initialization failed:', error)
        set((state) => {
          state.webGPUSupported = false
          state.engineType = 'wasm'
        })
        return false
      }
    },

    // 加载模型
    loadModel: async (modelId) => {
      const model = get().models.get(modelId)
      if (!model) {
        throw new Error(`Model ${modelId} not found`)
      }

      if (model.loaded) {
        logger.debug(`[WebGPU] Model ${modelId} already loaded`)
        return
      }

      set((state) => {
        state.isLoadingModel = true
        const m = state.models.get(modelId)
        if (m) m.loadProgress = 0
      })

      try {
        logger.info(`[WebGPU] Loading model ${modelId}...`)

        // 真实加载：transformers.js pipeline（权重经浏览器 Cache API 复用，
        // IndexedDB 记录元数据用于缓存统计与列表展示）
        await loadPipeline(modelId, {
          device: model.engine === 'wasm' ? 'wasm' : 'webgpu',
          onProgress: (pct, note) => {
            set((state) => {
              const m = state.models.get(modelId)
              if (m) m.loadProgress = pct
            })
            logger.debug(`[WebGPU] ${modelId} ${pct}% ${note}`)
          },
        })

        // 缓存登记（transformers 权重在 Cache API；此处记录元数据驱动缓存面板）
        await idbManager.saveModel(modelId, `pipeline:${HF_MODEL_MAP[modelId]?.repo ?? modelId}`)

        // 更新缓存大小
        const cacheSize = await idbManager.getTotalCacheSize()
        set((state) => {
          state.cacheSize = cacheSize
        })

        set((state) => {
          const m = state.models.get(modelId)
          if (m) {
            m.loaded = true
            m.loadProgress = 100
          }
          state.isLoadingModel = false
        })

        logger.info(`[WebGPU] Model ${modelId} loaded successfully`)
      } catch (error) {
        logger.error(`[WebGPU] Failed to load model ${modelId}:`, error)
        set((state) => {
          state.isLoadingModel = false
          const m = state.models.get(modelId)
          if (m) m.loadProgress = 0
        })
        throw error
      }
    },

    // 卸载模型
    unloadModel: (modelId) => {
      unloadPipeline(modelId)
      set((state) => {
        const m = state.models.get(modelId)
        if (m) {
          m.loaded = false
          m.loadProgress = 0
        }
        if (state.activeModelId === modelId) {
          state.activeModelId = null
        }
      })
      logger.info(`[WebGPU] Model ${modelId} unloaded`)
    },

    // 卸载所有模型
    unloadAllModels: () => {
      set((state) => {
        state.models.forEach((m) => {
          m.loaded = false
          m.loadProgress = 0
        })
        state.activeModelId = null
      })
      logger.info('[WebGPU] All models unloaded')
    },

    // 设置激活模型
    setActiveModel: (modelId) => {
      const model = get().models.get(modelId)
      if (!model) {
        throw new Error(`Model ${modelId} not found`)
      }

      if (!model.loaded) {
        throw new Error(`Model ${modelId} is not loaded`)
      }

      set((state) => {
        state.activeModelId = modelId
      })
      logger.info(`[WebGPU] Active model set to ${modelId}`)
    },

    // 执行推理
    infer: async (modelId, input) => {
      const model = get().models.get(modelId)
      if (!model) {
        throw new Error(`Model ${modelId} not found`)
      }

      if (!model.loaded) {
        throw new Error(`Model ${modelId} is not loaded`)
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      set((state) => {
        state.isInferencing = true
        state.tasks.push({
          id: taskId,
          modelId,
          input,
          status: 'running',
          startTime: Date.now(),
        })
      })

      try {
        logger.debug(`[WebGPU] Starting inference with model ${modelId}...`)

        // 真实推理：embeddings 走 feature-extraction，其余走 text-generation
        const spec = HF_MODEL_MAP[modelId]
        let output: string
        if (spec?.task === 'feature-extraction' || model.type === 'embeddings') {
          const vec = await runEmbedding(modelId, input)
          output = `[${model.type} 向量 dim=${vec.length}] ${JSON.stringify(vec.slice(0, 16)).slice(0, 200)}…`
        } else {
          output = (await runCompletion(modelId, input, 160)).trim()
        }

        const endTime = Date.now()

        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId)
          if (task) {
            task.status = 'completed'
            task.output = output
            task.endTime = endTime
            task.duration = endTime - task.startTime
          }

          // 更新统计
          state.stats.totalInferences++
          state.stats.totalInferenceTime += task?.duration || 0
          state.stats.avgInferenceTime = state.stats.totalInferenceTime / state.stats.totalInferences
          state.stats.successRate = (state.tasks.filter((t) => t.status === 'completed').length / state.tasks.length) * 100

          state.isInferencing = false
        })

        logger.info(`[WebGPU] Inference completed in ${endTime - (get().tasks.find((t) => t.id === taskId)?.startTime ?? endTime)}ms`)
        return output
      } catch (error) {
        logger.error(`[WebGPU] Inference failed:`, error)
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId)
          if (task) {
            task.status = 'error'
            task.error = error instanceof Error ? error.message : String(error)
          }
          state.isInferencing = false
        })
        throw error
      }
    },

    // 清除任务历史
    clearTasks: () => {
      set((state) => {
        state.tasks = []
      })
    },

    // 清除所有数据
    clearAll: () => {
      set((state) => {
        state.tasks = []
        state.stats = {
          totalInferences: 0,
          totalInferenceTime: 0,
          avgInferenceTime: 0,
          successRate: 100,
        }
        state._initialized = false
      })
    },

    // 获取推理统计
    getStats: () => {
      return get().stats
    },

    // 清除IndexedDB缓存
    clearCache: async () => {
      await idbManager.clearAll()
      set((state) => {
        state.cacheSize = 0
      })
    },

    // 预加载模型
    preloadModel: async (modelId) => {
      const model = get().models.get(modelId)
      if (!model) {
        logger.warn(`[WebGPU] Model ${modelId} not found for preload`)
        return
      }

      if (model.loaded) {
        logger.debug(`[WebGPU] Model ${modelId} already loaded`)
        return
      }

      logger.info(`[WebGPU] Preloading model ${modelId}...`)
      await get().loadModel(modelId)
      logger.info(`[WebGPU] Model ${modelId} preloaded`)
    },

    // 获取缓存统计
    getCacheStats: () => {
      const state = get()
      return {
        size: state.cacheSize,
        max: state.maxCacheSize,
        usage: (state.cacheSize / state.maxCacheSize) * 100,
      }
    },
  }))
)
