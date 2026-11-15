/**
 * @file errors.ts
 * @description YYC³ AI Error Type Definitions - 错误类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags error,types,typescript,validation
 */

/**
 * @description 错误类型枚举
 */
export enum ErrorType {
  /** 网络错误 */
  NETWORK = 'NETWORK',
  /** 验证错误 */
  VALIDATION = 'VALIDATION',
  /** 认证错误 */
  AUTH = 'AUTH',
  /** API错误 */
  API = 'API',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
  /** 权限错误 */
  PERMISSION = 'PERMISSION',
  /** 资源不存在 */
  NOT_FOUND = 'NOT_FOUND',
  /** 超时错误 */
  TIMEOUT = 'TIMEOUT'
}

/**
 * @description 应用错误基类
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly timestamp: number
  public readonly details?: Record<string, unknown>
  public readonly stack?: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.message = message
    this.details = details
    this.timestamp = Date.now()

    // 捕获堆栈
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((Error as any).captureStackTrace) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, AppError)
    }
  }

  /**
   * @description 转换为JSON对象
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      timestamp: this.timestamp,
      details: this.details
    }
  }

  /**
   * @description 从JSON对象创建错误
   */
  static fromJSON(json: Record<string, unknown>): AppError {
    return new AppError(
      json.message as string,
      json.type as ErrorType,
      json.details as Record<string, unknown>
    )
  }
}

/**
 * @description 网络错误
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    public readonly statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message, ErrorType.NETWORK, details)
    this.name = 'NetworkError'
  }
}

/**
 * @description 验证错误
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    details?: Record<string, unknown>
  ) {
    super(message, ErrorType.VALIDATION, {
      ...details,
      field,
      value: value !== undefined ? JSON.stringify(value) : undefined
    })
    this.name = 'ValidationError'
  }
}

/**
 * @description 认证错误
 */
export class AuthError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, ErrorType.AUTH, details)
    this.name = 'AuthError'
  }
}

/**
 * @description 权限错误
 */
export class PermissionError extends AppError {
  constructor(
    message: string,
    public readonly resource?: string,
    public readonly action?: string,
    details?: Record<string, unknown>
  ) {
    super(message, ErrorType.PERMISSION, {
      ...details,
      resource,
      action
    })
    this.name = 'PermissionError'
  }
}

/**
 * @description 资源不存在错误
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    public readonly resourceType?: string,
    public readonly resourceId?: string,
    details?: Record<string, unknown>
  ) {
    super(message, ErrorType.NOT_FOUND, {
      ...details,
      resourceType,
      resourceId
    })
    this.name = 'NotFoundError'
  }
}

/**
 * @description 超时错误
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    public readonly timeout: number,
    details?: Record<string, unknown>
  ) {
    super(message, ErrorType.TIMEOUT, {
      ...details,
      timeout
    })
    this.name = 'TimeoutError'
  }
}

/**
 * @description 错误处理器类型
 */
export type ErrorHandler = (error: AppError) => void

/**
 * @description 错误处理配置
 */
export interface ErrorHandlingConfig {
  /** 是否显示错误通知 */
  showNotification: boolean
  /** 是否记录错误日志 */
  logError: boolean
  /** 是否上报错误 */
  reportError: boolean
  /** 自定义错误处理器 */
  handler?: ErrorHandler
}

/**
 * @description 默认错误处理配置
 */
export const defaultErrorHandlingConfig: ErrorHandlingConfig = {
  showNotification: true,
  logError: true,
  reportError: false
}

/**
 * @description 错误上下文
 */
export interface ErrorContext {
  /** 用户ID */
  userId?: string
  /** 会话ID */
  sessionId?: string
  /** 请求ID */
  requestId?: string
  /** 额外信息 */
  extra?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * @description 带上下文的错误
 */
export class ContextualError extends AppError {
  constructor(
    message: string,
    type: ErrorType,
    public readonly context: ErrorContext,
    details?: Record<string, unknown>
  ) {
    super(message, type, {
      ...details,
      context
    })
    this.name = 'ContextualError'
  }
}

/**
 * @description 错误类型守卫
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * @description 网络错误类型守卫
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

/**
 * @description 验证错误类型守卫
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * @description 认证错误类型守卫
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

/**
 * @description 权限错误类型守卫
 */
export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError
}

/**
 * @description 资源不存在错误类型守卫
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

/**
 * @description 超时错误类型守卫
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError
}

/**
 * @description 将未知错误转换为AppError
 */
export function toAppError(error: unknown, context?: ErrorContext): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    return context
      ? new ContextualError(error.message, ErrorType.UNKNOWN, context)
      : new AppError(error.message, ErrorType.UNKNOWN)
  }

  if (typeof error === 'string') {
    return new AppError(error, ErrorType.UNKNOWN)
  }

  return new AppError(
    'An unknown error occurred',
    ErrorType.UNKNOWN,
    context
  )
}
