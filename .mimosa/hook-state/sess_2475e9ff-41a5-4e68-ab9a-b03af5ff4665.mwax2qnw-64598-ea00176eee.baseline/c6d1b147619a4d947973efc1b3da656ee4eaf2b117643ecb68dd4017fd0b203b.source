/**
 * @file useWebGPUInference.ts
 * @description WebGPU AI推理Hook，提供模型管理和推理接口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hook,webgpu,ai,inference
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  useWebGPUInferenceStore,
  type AIModel,
  type AIModelType,
  type InferenceTask,
} from '../store/webgpu-inference-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('useWebGPUInference')

/**
 * WebGPU推理Hook配置
 */
export interface UseWebGPUInferenceOptions {
  /** 是否自动初始化WebGPU */
  autoInitialize?: boolean
  /** 是否自动加载默认模型 */
  autoLoadDefaultModel?: boolean
  /** 默认模型ID */
  defaultModelId?: string
}

/**
 * WebGPU推理Hook返回值
 */
export interface UseWebGPUInferenceReturn {
  /** 可用模型列表 */
  models: AIModel[]
  /** 当前激活的模型 */
  activeModel: AIModel | null
  /** 推理任务历史 */
  tasks: InferenceTask[]
  /** 是否正在加载模型 */
  isLoadingModel: boolean
  /** 是否正在推理 */
  isInferencing: boolean
  /** WebGPU支持状态 */
  webGPUSupported: boolean
  /** 推理引擎类型 */
  engineType: 'webgpu' | 'wasm' | 'webgl' | 'none'
  /** 推理统计 */
  stats: {
    totalInferences: number
    totalInferenceTime: number
    avgInferenceTime: number
    successRate: number
  }
  /** 按类型筛选的模型 */
  modelsByType: (type: AIModelType) => AIModel[]
  /** 已加载的模型 */
  loadedModels: AIModel[]
  /** 加载模型 */
  loadModel: (modelId: string) => Promise<void>
  /** 卸载模型 */
  unloadModel: (modelId: string) => void
  /** 卸载所有模型 */
  unloadAllModels: () => void
  /** 设置激活模型 */
  setActiveModel: (modelId: string) => void
  /** 执行推理 */
  infer: (input: string, modelId?: string) => Promise<string>
  /** 清除任务历史 */
  clearTasks: () => void
  /** 清除所有数据 */
  clearAll: () => void
  /** 清除IndexedDB缓存 */
  clearCache: () => Promise<void>
  /** 获取缓存统计 */
  getCacheStats: () => { size: number; max: number; usage: number }
}

/**
 * WebGPU推理Hook
 *
 * 提供WebGPU AI推理的完整接口，包括模型管理、推理执行、性能监控等。
 *
 * @example 基本使用
 * ```tsx
 * function MyComponent() {
 *   const { models, loadModel, infer, isInferencing } = useWebGPUInference({
 *     autoInitialize: true,
 *   })
 *
 *   return (
 *     <div>
 *       <button onClick={() => loadModel('tinyllama-1.1b')}>
 *         加载模型
 *       </button>
 *       <button
 *         disabled={isInferencing}
 *         onClick={() => infer('function hello() {')}
 *       >
 *         代码补全
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example 自动加载模型
 * ```tsx
 * function MyComponent() {
 *   const { activeModel, infer } = useWebGPUInference({
 *     autoInitialize: true,
 *     autoLoadDefaultModel: true,
 *     defaultModelId: 'tinyllama-1.1b',
 *   })
 *
 *   return (
 *     <div>
 *       {activeModel ? (
 *         <button onClick={() => infer('const a = ')}>
 *           使用 {activeModel.name} 推理
 *         </button>
 *       ) : (
 *         <span>加载中...</span>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example 获取统计信息
 * ```tsx
 * function StatsDisplay() {
 *   const { stats } = useWebGPUInference()
 *
 *   return (
 *     <div>
 *       <p>总推理次数: {stats.totalInferences}</p>
 *       <p>平均推理时间: {stats.avgInferenceTime.toFixed(0)}ms</p>
 *       <p>成功率: {stats.successRate.toFixed(1)}%</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWebGPUInference(
  options: UseWebGPUInferenceOptions = {}
): UseWebGPUInferenceReturn {
  const {
    autoInitialize = true,
    autoLoadDefaultModel = false,
    defaultModelId = 'tinyllama-1.1b',
  } = options

  // Store selectors
  const models = useWebGPUInferenceStore(useShallow((state) => Array.from(state.models.values())))
  const activeModelId = useWebGPUInferenceStore((state) => state.activeModelId)
  const tasks = useWebGPUInferenceStore(useShallow((state) => state.tasks))
  const isLoadingModel = useWebGPUInferenceStore((state) => state.isLoadingModel)
  const isInferencing = useWebGPUInferenceStore((state) => state.isInferencing)
  const webGPUSupported = useWebGPUInferenceStore((state) => state.webGPUSupported)
  const engineType = useWebGPUInferenceStore((state) => state.engineType)
  const stats = useWebGPUInferenceStore(useShallow((state) => state.stats))

  // Store actions
  const initializeWebGPU = useWebGPUInferenceStore((state) => state.initializeWebGPU)
  const loadModel = useWebGPUInferenceStore((state) => state.loadModel)
  const unloadModel = useWebGPUInferenceStore((state) => state.unloadModel)
  const unloadAllModels = useWebGPUInferenceStore((state) => state.unloadAllModels)
  const setActiveModel = useWebGPUInferenceStore((state) => state.setActiveModel)
  const infer = useWebGPUInferenceStore((state) => state.infer)
  const clearTasks = useWebGPUInferenceStore((state) => state.clearTasks)
  const clearAll = useWebGPUInferenceStore((state) => state.clearAll)
  const clearCache = useWebGPUInferenceStore((state) => state.clearCache)
  const getCacheStats = useWebGPUInferenceStore((state) => state.getCacheStats)

  // 当前激活的模型
  const activeModel = useMemo(
    () => models.find((m) => m.id === activeModelId) || null,
    [models, activeModelId]
  )

  // 按类型筛选的模型
  const modelsByType = useCallback(
    (type: AIModelType) => models.filter((m) => m.type === type),
    [models]
  )

  // 已加载的模型
  const loadedModels = useMemo(
    () => models.filter((m) => m.loaded),
    [models]
  )

  // 自动初始化
  useEffect(() => {
    if (autoInitialize) {
      initializeWebGPU().catch((err: Error) => logger.error('[WebGPU] Auto init failed:', err))
    }
  }, [autoInitialize, initializeWebGPU])

  // 自动加载默认模型
  useEffect(() => {
    if (autoLoadDefaultModel && webGPUSupported) {
      const store = useWebGPUInferenceStore.getState()
      store.loadModel(defaultModelId)
        .then(() => store.setActiveModel(defaultModelId))
        .catch((err: Error) => logger.error('[WebGPU] Auto load model failed:', err))
    }
  }, [autoLoadDefaultModel, defaultModelId, webGPUSupported])

  // 包装infer方法，支持默认使用激活模型
  const wrappedInfer = useCallback(
    async (input: string, modelId?: string) => {
      const targetModelId = modelId || activeModelId
      if (!targetModelId) {
        throw new Error('No active model or modelId provided')
      }
      return infer(targetModelId, input)
    },
    [activeModelId, infer]
  )

  return {
    models,
    activeModel,
    tasks,
    isLoadingModel,
    isInferencing,
    webGPUSupported,
    engineType,
    stats,
    modelsByType,
    loadedModels,
    loadModel,
    unloadModel,
    unloadAllModels,
    setActiveModel,
    infer: wrappedInfer,
    clearTasks,
    clearAll,
    clearCache,
    getCacheStats,
  }
}

/**
 * 简化版Hook：仅执行推理（假设模型已加载）
 *
 * @example
 * ```tsx
 * function CodeEditor() {
 *   const { infer, isInferencing } = useInference()
 *
 *   const handleAutoComplete = async (code: string) => {
 *     const suggestion = await infer(code)
 *     // 使用suggestion...
 *   }
 *
 *   return <textarea onChange={(e) => handleAutoComplete(e.target.value)} />
 * }
 * ```
 */
export function useInference() {
  const { infer, isInferencing, activeModel, stats } = useWebGPUInference({
    autoInitialize: false,
  })

  return {
    infer,
    isInferencing,
    activeModel,
    stats,
  }
}

/**
 * Hook：仅模型管理
 *
 * @example
 * ```tsx
 * function ModelManager() {
 *   const { models, loadedModels, loadModel, unloadModel } = useModelManager()
 *
 *   return (
 *     <div>
 *       {models.map(model => (
 *         <ModelCard
 *           key={model.id}
 *           model={model}
 *           loaded={loadedModels.includes(model)}
 *           onLoad={() => loadModel(model.id)}
 *           onUnload={() => unloadModel(model.id)}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useModelManager() {
  const { models, loadedModels, loadModel, unloadModel, unloadAllModels, isLoadingModel } =
    useWebGPUInference({
      autoInitialize: false,
    })

  return {
    models,
    loadedModels,
    loadModel,
    unloadModel,
    unloadAllModels,
    isLoadingModel,
  }
}

/**
 * Hook：仅性能统计
 *
 * @example
 * ```tsx
 * function PerformanceStats() {
 *   const { stats, tasks, clearTasks } = useInferenceStats()
 *
 *   return (
 *     <div>
 *       <h2>性能统计</h2>
 *       <p>总推理: {stats.totalInferences}</p>
 *       <p>平均时间: {stats.avgInferenceTime.toFixed(0)}ms</p>
 *       <p>成功率: {stats.successRate.toFixed(1)}%</p>
 *       <button onClick={clearTasks}>清除历史</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useInferenceStats() {
  const { stats, tasks, clearTasks, clearAll } = useWebGPUInference({
    autoInitialize: false,
  })

  // 计算额外统计信息
  const extendedStats = useMemo(() => {
    const completedTasks = tasks.filter((t) => t.status === 'completed')
    const errorTasks = tasks.filter((t) => t.status === 'error')

    return {
      ...stats,
      completedCount: completedTasks.length,
      errorCount: errorTasks.length,
      recentTasks: tasks.slice(-10),
    }
  }, [stats, tasks])

  return {
    stats: extendedStats,
    tasks,
    clearTasks,
    clearAll,
  }
}
