/**
 * @file index.ts
 * @description YYC³ AI Core Type Definitions - 统一类型定义导出
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags core,types,typescript,export
 */

// 导出所有类型定义
export * from './errors'
export * from './api'
export * from './ai'
export * from './common'

/**
 * @description 通用的Result类型，用于表示可能失败的操作
 */
export interface Result<T, E = Error> {
  success: boolean
  value?: T
  error?: E
}

/**
 * @description 成功结果创建器
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value }
}

/**
 * @description 失败结果创建器
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * @description 异步结果类型
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

/**
 * @description 位置信息
 */
export interface Position {
  /** 行号（从0开始） */
  line: number
  /** 列号（从0开始） */
  character: number
}

/**
 * @description 范围信息
 */
export interface Range {
  /** 起始位置 */
  start: Position
  /** 结束位置 */
  end: Position
}

/**
 * @description 源位置信息
 */
export interface SourceLocation {
  /** 文件路径 */
  filePath: string
  /** 范围 */
  range?: Range
  /** 函数名 */
  functionName?: string
}

/**
 * @description 环境变量类型
 */
export interface EnvConfig {
  /** 是否开发环境 */
  isDev: boolean
  /** 是否生产环境 */
  isProd: boolean
  /** 是否测试环境 */
  isTest: boolean
  /** API基础URL */
  apiBaseUrl: string
  /** WebSocket URL */
  wsUrl: string
  /** 调试模式 */
  debug: boolean
}

/**
 * @description 获取环境配置
 */
export function getEnvConfig(): EnvConfig {
  const env = import.meta.env.MODE || 'development'

  return {
    isDev: env === 'development',
    isProd: env === 'production',
    isTest: env === 'test',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    wsUrl: import.meta.env.VITE_WS_URL || import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:8080',
    debug: import.meta.env.VITE_DEBUG === 'true'
  }
}
