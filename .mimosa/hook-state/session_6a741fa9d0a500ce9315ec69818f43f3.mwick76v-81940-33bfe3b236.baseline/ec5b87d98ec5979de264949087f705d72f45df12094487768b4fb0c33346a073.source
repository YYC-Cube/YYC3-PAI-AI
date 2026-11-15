/**
 * @file api.ts
 * @description YYC³ AI API Type Definitions - API接口类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags api,types,typescript,network
 */

/**
 * @description HTTP方法
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * @description HTTP响应状态码
 */
export type HTTPStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504 // Gateway Timeout

/**
 * @description API响应基础接口
 */
export interface APIResponse<T = unknown> {
  /** 是否成功 */
  success: boolean
  /** 响应数据 */
  data?: T
  /** 错误信息 */
  error?: string
  /** 错误代码 */
  errorCode?: string
  /** 时间戳 */
  timestamp: number
  /** 请求ID */
  requestId?: string
}

/**
 * @description 分页响应
 */
export interface PaginatedResponse<T> {
  /** 数据项列表 */
  items: T[]
  /** 总数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
  /** 是否有下一页 */
  hasMore: boolean
}

/**
 * @description 分页参数
 */
export interface PaginationParams {
  /** 页码（从1开始） */
  page?: number
  /** 每页数量 */
  pageSize?: number
  /** 排序字段 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * @description 排序参数
 */
export interface SortParams {
  /** 排序字段 */
  field: string
  /** 排序方向 */
  order: 'asc' | 'desc'
}

/**
 * @description 过滤参数
 */
export type FilterParams = Record<string, unknown>

/**
 * @description 查询参数
 */
export interface QueryParams extends Partial<PaginationParams> {
  /** 过滤条件 */
  filters?: FilterParams
  /** 排序条件 */
  sort?: SortParams[]
  /** 搜索关键字 */
  search?: string
}

/**
 * @description API请求配置
 */
export interface APIRequestConfig {
  /** 请求URL */
  url: string
  /** 请求方法 */
  method?: HTTPMethod
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体 */
  body?: unknown
  /** 查询参数 */
  params?: Record<string, unknown>
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否需要认证 */
  auth?: boolean
  /** 重试次数 */
  retries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
}

/**
 * @description API错误响应
 */
export interface APIErrorResponse {
  /** 错误代码 */
  code: string
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: Record<string, unknown>
  /** 时间戳 */
  timestamp: number
  /** 请求ID */
  requestId?: string
  /** 堆栈信息（仅开发环境） */
  stack?: string
}

/**
 * @description API错误
 */
export class APIError extends Error {
  constructor(
    public readonly statusCode: HTTPStatusCode,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
  }

  /**
   * @description 从响应创建API错误
   */
  static fromResponse(response: APIErrorResponse, statusCode: HTTPStatusCode): APIError {
    return new APIError(
      statusCode,
      response.code,
      response.message,
      response.details
    )
  }
}

/**
 * @description 请求拦截器
 */
export type RequestInterceptor = (config: APIRequestConfig) => APIRequestConfig | Promise<APIRequestConfig>

/**
 * @description 响应拦截器
 */
export type ResponseInterceptor<T = unknown> = (
  response: APIResponse<T>
) => APIResponse<T> | Promise<APIResponse<T>>

/**
 * @description 错误拦截器
 */
export type ErrorInterceptor = (error: APIError | Error) => APIError | Error | Promise<APIError | Error>

/**
 * @description 拦截器配置
 */
export interface InterceptorConfig {
  /** 请求拦截器数组 */
  request: RequestInterceptor[]
  /** 响应拦截器数组 */
  response: ResponseInterceptor[]
  /** 错误拦截器数组 */
  error: ErrorInterceptor[]
}

/**
 * @description API客户端配置
 */
export interface APIClientConfig {
  /** 基础URL */
  baseURL: string
  /** 默认请求头 */
  headers?: Record<string, string>
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否启用请求日志 */
  logRequests?: boolean
  /** 是否启用响应日志 */
  logResponses?: boolean
  /** 拦截器配置 */
  interceptors?: InterceptorConfig
}

/**
 * @description 批量操作请求
 */
export interface BatchRequest {
  /** 操作ID */
  id: string
  /** 请求配置 */
  request: APIRequestConfig
  /** 是否必须成功 */
  required?: boolean
}

/**
 * @description 批量操作响应
 */
export interface BatchResponse<T = unknown> {
  /** 操作ID */
  id: string
  /** 是否成功 */
  success: boolean
  /** 响应数据 */
  data?: T
  /** 错误信息 */
  error?: string
}

/**
 * @description 批量操作结果
 */
export interface BatchOperationResult<T = unknown> {
  /** 总操作数 */
  total: number
  /** 成功数 */
  succeeded: number
  /** 失败数 */
  failed: number
  /** 操作结果列表 */
  results: BatchResponse<T>[]
}

/**
 * @description 流式响应事件
 */
export interface StreamEvent {
  /** 事件类型 */
  type: 'data' | 'error' | 'end'
  /** 数据 */
  data?: string
  /** 错误 */
  error?: Error
}

/**
 * @description 流式配置
 */
export interface StreamConfig {
  /** 是否启用流式响应 */
  enabled: boolean
  /** 数据块大小 */
  chunkSize?: number
  /** 是否自动解析JSON */
  parseJSON?: boolean
}

/**
 * @description 下载进度
 */
export interface DownloadProgress {
  /** 已下载字节数 */
  loaded: number
  /** 总字节数 */
  total: number
  /** 进度百分比 */
  percent: number
}

/**
 * @description 上传进度
 */
export interface UploadProgress extends DownloadProgress {
  /** 上传速度（字节/秒） */
  speed: number
  /** 剩余时间（秒） */
  remaining: number
}

/**
 * @description WebSocket消息类型
 */
export type WebSocketMessageType = 'data' | 'error' | 'close' | 'open'

/**
 * @description WebSocket消息
 */
export interface WebSocketMessage<T = unknown> {
  /** 消息类型 */
  type: WebSocketMessageType
  /** 数据 */
  data?: T
  /** 错误 */
  error?: Error
}

/**
 * @description WebSocket配置
 */
export interface WebSocketConfig {
  /** WebSocket URL */
  url: string
  /** 重连间隔（毫秒） */
  reconnectInterval?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number
  /** 是否自动重连 */
  autoReconnect?: boolean
  /** 消息处理器 */
  onMessage?: (message: WebSocketMessage) => void
  /** 错误处理器 */
  onError?: (error: Error) => void
  /** 关闭处理器 */
  onClose?: () => void
  /** 打开处理器 */
  onOpen?: () => void
}
