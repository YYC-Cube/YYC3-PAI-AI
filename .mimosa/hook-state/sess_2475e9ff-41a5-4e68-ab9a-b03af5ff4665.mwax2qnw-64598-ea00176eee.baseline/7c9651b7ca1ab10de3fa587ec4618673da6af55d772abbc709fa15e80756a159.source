/**
 * @file common.ts
 * @description YYC³ AI Common Type Definitions - 通用类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags common,types,typescript,utility
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PaginationParams } from './api'

/**
 * @description ID类型（字符串）
 */
export type ID = string

/**
 * @description 时间戳类型（毫秒）
 */
export type Timestamp = number

/**
 * @description 日期类型
 */
export type DateString = string

/**
 * @description URL类型
 */
export type URL = string

/**
 * @description 邮箱类型
 */
export type Email = string

/**
 * @description 电话号码类型
 */
export type PhoneNumber = string

/**
 * @description JSON类型
 */
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray

/**
 * @description JSON对象类型
 */
export interface JSONObject {
  [key: string]: JSONValue
}

/**
 * @description JSON数组类型
 */
export type JSONArray = JSONValue[]

/**
 * @description 深度可选类型（使所有属性可选）
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P]
}

/**
 * @description 深度只读类型（使所有属性只读）
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P]
}

/**
 * @description 深度必选类型（使所有属性必选）
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object
    ? DeepRequired<T[P]>
    : T[P]
}

/**
 * @description 提取对象的所有键
 */
export type Keys<T> = keyof T

/**
 * @description 提取对象的所有值类型
 */
export type Values<T> = T[keyof T]

/**
 * @description 提取对象的所有键类型
 */
export type KeyTypes<T> = {
  [K in keyof T]: T[K]
}

/**
 * @description 使指定属性必选
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * @description 使指定属性可选
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * @description 提取函数的参数类型
 */
 
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P
  : never

/**
 * @description 提取函数的返回值类型
 */
 
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : any

/**
 * @description 提取Promise的返回值类型
 */
export type Awaited<T> = T extends Promise<infer U>
  ? Awaited<U>
  : T

/**
 * @description 函数类型
 */
 
export type Fn = (...args: any[]) => any

/**
 * @description 异步函数类型
 */
 
export type AsyncFn = (...args: any[]) => Promise<any>

/**
 * @description 可选的异步函数类型
 */
 
export type MaybeAsyncFn<T extends (...args: any[]) => any> =
  | T
  | ((...args: Parameters<T>) => Promise<ReturnType<T>>)

/**
 * @description 事件处理器类型
 */
export type EventHandler<T = Event> = (event: T) => void

/**
 * @description 异步事件处理器类型
 */
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

/**
 * @description 可选的异步事件处理器类型
 */
export type MaybeAsyncEventHandler<T = Event> =
  | EventHandler<T>
  | AsyncEventHandler<T>

/**
 * @description 变更处理器类型
 */
export type ChangeHandler<T> = (value: T) => void

/**
 * @description 异步变更处理器类型
 */
export type AsyncChangeHandler<T> = (value: T) => Promise<void>

/**
 * @description 回调函数类型
 */
export type Callback<T = void> = () => T

/**
 * @description 异步回调函数类型
 */
export type AsyncCallback<T = void> = () => Promise<T>

/**
 * @description 带参数的回调函数类型
 */
 
export type CallbackWithParams<P extends any[], R = void> = (...params: P) => R

/**
 * @description 带参数的异步回调函数类型
 */
 
export type AsyncCallbackWithParams<P extends any[], R = void> = (...params: P) => Promise<R>

/**
 * @description 映射类型
 */
 
export type Map<K extends string | number | symbol = string, V = any> = Record<K, V>

/**
 * @description 配置类型
 */
 
export type Config<T = Record<string, any>> = T

/**
 * @description 选项类型
 */
 
export type Options<T = Record<string, any>> = Partial<T>

/**
 * @description 状态类型
 */
 
export type State<T = any> = T

/**
 * @description 属性类型
 */
 
export type Props<T = Record<string, any>> = T

/**
 * @description 上下文类型
 */
 
export interface Context<T = any> {
  value: T
  provider: unknown
}

/**
 * @description 分页信息
 */
export interface Pagination {
  /** 当前页码（从1开始） */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总数量 */
  total: number
  /** 总页数 */
  totalPages: number
}

/**
 * @description 排序信息
 */
export interface Sort {
  /** 排序字段 */
  field: string
  /** 排序方向 */
  order: 'asc' | 'desc'
}

/**
 * @description 过滤信息
 */
export interface Filter {
  /** 过滤字段 */
  field: string
  /** 过滤值 */
  value: unknown
  /** 过滤操作符 */
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'like' | 'ilike'
}

/**
 * @description 查询参数
 */
export interface Query {
  /** 分页参数 */
  pagination?: PaginationParams
  /** 排序参数 */
  sort?: Sort
  /** 过滤参数 */
  filters?: Filter[]
  /** 搜索关键字 */
  search?: string
}

/**
 * @description 创建时间
 */
export interface Creatable {
  /** 创建时间 */
  createdAt: Timestamp
}

/**
 * @description 更新时间
 */
export interface Updatable {
  /** 更新时间 */
  updatedAt: Timestamp
}

/**
 * @description 创建和更新时间
 */
export type Timestamps = Creatable & Updatable

/**
 * @description 可删除的
 */
export interface Deletable {
  /** 是否已删除 */
  deleted?: boolean
  /** 删除时间 */
  deletedAt?: Timestamp
}

/**
 * @description 可软删除的
 */
export type SoftDeletable = Deletable

/**
 * @description 有ID的
 */
export interface Identifiable {
  /** ID */
  id: ID
}

/**
 * @description 有名称的
 */
export interface Nameable {
  /** 名称 */
  name: string
}

/**
 * @description 有描述的
 */
export interface Describable {
  /** 描述 */
  description?: string
}

/**
 * @description 实体（基础实体）
 */
export type Entity = Identifiable & Timestamps

/**
 * @description 具名实体
 */
export type NamedEntity = Entity & Nameable

/**
 * @description 可描述实体
 */
export type DescribedEntity = NamedEntity & Describable

/**
 * @description 用户信息
 */
export interface User extends Identifiable, Nameable {
  /** 邮箱 */
  email?: Email
  /** 头像URL */
  avatar?: URL
  /** 角色 */
  role?: string
  /** 权限 */
  permissions?: string[]
}

/**
 * @description 会话信息
 */
export interface Session extends Identifiable, Timestamps {
  /** 用户ID */
  userId: ID
  /** 会话令牌 */
  token?: string
  /** 过期时间 */
  expiresAt?: Timestamp
}

/**
 * @description 设置
 */
export interface Settings {
  /** 键 */
  key: string
  /** 值 */
  value: JSONValue
}

/**
 * @description 偏好设置
 */
export interface Preferences {
  /** 语言 */
  language: string
  /** 主题 */
  theme: string
  /** 字体大小 */
  fontSize: number
}

/**
 * @description 配置项
 */
export interface ConfigItem {
  /** 键 */
  key: string
  /** 值 */
  value: JSONValue
  /** 类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  /** 是否必需 */
  required?: boolean
  /** 默认值 */
  default?: JSONValue
  /** 描述 */
  description?: string
}

/**
 * @description 元数据
 */
export interface Metadata {
  /** 键 */
  key: string
  /** 值 */
  value: string
}

/**
 * @description 带元数据的
 */
export interface WithMetadata {
  /** 元数据列表 */
  metadata?: Metadata[]
}

/**
 * @description 标签
 */
export interface Tag extends Identifiable, Nameable {
  /** 颜色 */
  color?: string
  /** 排序 */
  order?: number
}

/**
 * @description 可标签的
 */
export interface Taggable {
  /** 标签ID列表 */
  tagIds?: ID[]
}

/**
 * @description 评论
 */
export interface Comment extends Identifiable, Timestamps {
  /** 作者ID */
  authorId: ID
  /** 内容 */
  content: string
  /** 父评论ID */
  parentId?: ID
}

/**
 * @description 可评论的
 */
export interface Commentable {
  /** 评论ID列表 */
  commentIds?: ID[]
}

/**
 * @description 附件
 */
export interface Attachment extends Identifiable, Timestamps {
  /** 文件名 */
  filename: string
  /** 文件大小 */
  size: number
  /** 文件类型 */
  mimeType: string
  /** 文件URL */
  url: string
}

/**
 * @description 可附件的
 */
export interface Attachable {
  /** 附件ID列表 */
  attachmentIds?: ID[]
}

/**
 * @description 通知
 */
export interface Notification extends Identifiable, Timestamps {
  /** 类型 */
  type: 'info' | 'success' | 'warning' | 'error'
  /** 标题 */
  title: string
  /** 内容 */
  message: string
  /** 是否已读 */
  read?: boolean
  /** 用户ID */
  userId?: ID
}

/**
 * @description 活动
 */
export interface Activity extends Identifiable, Timestamps {
  /** 类型 */
  type: string
  /** 用户ID */
  userId?: ID
  /** 描述 */
  description?: string
  /** 元数据 */
  metadata?: JSONObject
}

/**
 * @description 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * @description 日志条目
 */
export interface LogEntry {
  /** 级别 */
  level: LogLevel
  /** 时间戳 */
  timestamp: Timestamp
  /** 消息 */
  message: string
  /** 上下文 */
  context?: JSONObject
  /** 错误 */
  error?: Error
}

/**
 * @description 调试信息
 */
export interface DebugInfo {
  /** 日志条目列表 */
  logs: LogEntry[]
  /** 性能指标 */
  performance?: Record<string, number>
  /** 内存使用 */
  memory?: Record<string, number>
  /** 其他信息 */
  extra?: JSONObject
}
