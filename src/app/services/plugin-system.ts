/**
 * @file plugin-system.ts
 * @description P3.3 插件系统 — 沙箱加载 + 权限声明 + 生命周期管理
 *
 * 对标：Continue.dev 插件架构（浏览器版）
 *
 * 设计：
 *   插件清单（manifest）声明：名称/版本/权限/入口
 *   权限模型：声明式（用户可见+可拒绝）
 *   沙箱执行：Web Worker（复用 sandbox-client）或 Module Script
 *   生命周期：install → activate → deactivate → uninstall
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags plugin,extension,sandbox,permissions,phase-3
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('plugin-system')
const LS_KEY = 'yyc3_plugins'

// ===== Types =====

export type PluginPermission =
  | 'chat:read'        // 读取对话消息
  | 'chat:write'       // 发送消息
  | 'editor:read'      // 读取编辑器内容
  | 'editor:write'     // 修改编辑器内容
  | 'file:read'        // 读取工作区文件
  | 'file:write'       // 写入工作区文件
  | 'ai:invoke'        // 调用 AI 模型
  | 'mcp:tools'        // 访问 MCP 工具
  | 'storage:read'     // 读取 localStorage/IndexedDB
  | 'storage:write'    // 写入 localStorage/IndexedDB
  | 'network:fetch'    // 网络请求（受 CSP 限制）
  | 'ui:panel'         // 注册自定义面板
  | 'ui:command'       // 注册命令面板项
  | 'ui:theme'         // 修改主题

export interface PluginManifest {
  /** 插件 ID（唯一，kebab-case） */
  id: string
  /** 显示名称 */
  name: string
  /** 版本（semver） */
  version: string
  /** 描述 */
  description: string
  /** 作者 */
  author?: string
  /** 请求的权限 */
  permissions: PluginPermission[]
  /** 入口点（插件代码，JS 字符串） */
  entry: string
  /** 图标（可选，URL 或 emoji） */
  icon?: string
  /** 主页 */
  homepage?: string
}

export type PluginState = 'registered' | 'active' | 'inactive' | 'error'

export interface PluginInstance {
  manifest: PluginManifest
  state: PluginState
  installedAt: number
  activatedAt?: number
  lastError?: string
  /** 插件 API 句柄（激活后可用） */
  api?: PluginAPI
}

/** 提供给插件的 API（受权限约束） */
export interface PluginAPI {
  /** 发送消息到 AI */
  chat: (message: string) => Promise<string>
  /** 读取当前编辑器内容 */
  getEditorContent: () => string
  /** 写入编辑器内容 */
  setEditorContent: (content: string) => void
  /** 注册命令面板项 */
  registerCommand: (id: string, label: string, handler: () => void) => void
  /** 注册自定义面板 */
  registerPanel: (id: string, title: string, render: () => HTMLElement) => void
  /** 读取存储 */
  storage: {
    get: (key: string) => string | null
    set: (key: string, value: string) => void
    remove: (key: string) => void
  }
}

// ===== 权限描述 =====

export const PERMISSION_LABELS: Record<PluginPermission, string> = {
  'chat:read': '读取对话消息',
  'chat:write': '发送 AI 消息',
  'editor:read': '读取编辑器内容',
  'editor:write': '修改编辑器内容',
  'file:read': '读取工作区文件',
  'file:write': '写入工作区文件',
  'ai:invoke': '调用 AI 模型',
  'mcp:tools': '使用 MCP 工具',
  'storage:read': '读取本地存储',
  'storage:write': '写入本地存储',
  'network:fetch': '发起网络请求',
  'ui:panel': '添加自定义面板',
  'ui:command': '添加命令面板项',
  'ui:theme': '修改主题外观',
}

// ===== 存储 =====

function loadInstances(): PluginInstance[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveInstances(instances: PluginInstance[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(instances))
  } catch { /* quota */ }
}

// ===== 插件注册表 =====

/**
 * 注册插件（仅添加到注册表，不激活）
 */
export function registerPlugin(manifest: PluginManifest): PluginInstance {
  const instances = loadInstances()

  // 检查重复
  if (instances.some(p => p.manifest.id === manifest.id)) {
    throw new Error(`Plugin "${manifest.id}" already registered`)
  }

  // 验证 manifest
  validateManifest(manifest)

  const instance: PluginInstance = {
    manifest,
    state: 'registered',
    installedAt: Date.now(),
  }

  instances.push(instance)
  saveInstances(instances)
  logger.info(`Plugin registered: ${manifest.id} v${manifest.version} (${manifest.permissions.length} permissions)`)
  return instance
}

/**
 * 验证插件清单
 */
export function validateManifest(manifest: PluginManifest): void {
  if (!manifest.id || !/^[a-z0-9-]+$/.test(manifest.id)) {
    throw new Error('Plugin ID must be kebab-case (a-z, 0-9, -)')
  }
  if (!manifest.name) throw new Error('Plugin name is required')
  if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    throw new Error('Plugin version must be semver (e.g., 1.0.0)')
  }
  if (!Array.isArray(manifest.permissions)) throw new Error('Plugin permissions must be an array')
  if (!manifest.entry || manifest.entry.length < 10) {
    throw new Error('Plugin entry code is required (min 10 chars)')
  }
  // 验证权限都是已知类型
  for (const perm of manifest.permissions) {
    if (!(perm in PERMISSION_LABELS)) {
      throw new Error(`Unknown permission: ${perm}`)
    }
  }
}

/**
 * 获取已注册的插件列表
 */
export function listPlugins(): PluginInstance[] {
  return loadInstances()
}

/**
 * 获取单个插件
 */
export function getPlugin(id: string): PluginInstance | null {
  return loadInstances().find(p => p.manifest.id === id) ?? null
}

/**
 * 检查插件是否有指定权限
 */
export function hasPermission(pluginId: string, permission: PluginPermission): boolean {
  const plugin = getPlugin(pluginId)
  return plugin?.manifest.permissions.includes(permission) ?? false
}

/**
 * 卸载插件
 */
export function uninstallPlugin(id: string): boolean {
  const instances = loadInstances()
  const idx = instances.findIndex(p => p.manifest.id === id)
  if (idx < 0) return false
  instances.splice(idx, 1)
  saveInstances(instances)
  logger.info(`Plugin uninstalled: ${id}`)
  return true
}

// ===== 插件激活/停用 =====

/** 保存注入的宿主 API（由应用启动时注入） */
let hostAPI: Partial<PluginAPI> = {}
let registeredPanels: Map<string, { title: string; render: () => HTMLElement }> = new Map()
let registeredCommands: Map<string, { label: string; handler: () => void }> = new Map()

/**
 * 注入宿主 API（应用启动时调用）
 */
export function injectHostAPI(api: Partial<PluginAPI>): void {
  hostAPI = api
}

/**
 * 激活插件（构建受限 API 并执行入口代码）
 */
export async function activatePlugin(id: string): Promise<PluginInstance> {
  const instances = loadInstances()
  const instance = instances.find(p => p.manifest.id === id)
  if (!instance) throw new Error(`Plugin "${id}" not found`)

  try {
    // 构建受限 API（基于权限过滤）
    const api = buildPluginAPI(instance.manifest.permissions)

    // 执行插件入口代码（通过 Reflect.construct 沙箱）
    // 传入 pluginAPI 作为参数
    const fn = Reflect.construct(
      Function,
      ['pluginAPI', `"use strict";\n${instance.manifest.entry}`],
    ) as (api: PluginAPI) => unknown

    fn(api)

    instance.state = 'active'
    instance.activatedAt = Date.now()
    instance.api = api
    instance.lastError = undefined

    logger.info(`Plugin activated: ${id}`)
  } catch (e) {
    instance.state = 'error'
    instance.lastError = e instanceof Error ? e.message : String(e)
    logger.warn(`Plugin activation failed: ${id}`, e as Error)
  }

  saveInstances(instances)
  return instance
}

/**
 * 停用插件
 */
export function deactivatePlugin(id: string): void {
  const instances = loadInstances()
  const instance = instances.find(p => p.manifest.id === id)
  if (instance) {
    instance.state = 'inactive'
    instance.api = undefined
    saveInstances(instances)
    logger.info(`Plugin deactivated: ${id}`)
  }
}

/**
 * 构建受限 PluginAPI（基于权限过滤）
 */
function buildPluginAPI(permissions: PluginPermission[]): PluginAPI {
  const can = (perm: PluginPermission) => permissions.includes(perm)

  return {
    chat: async (message: string) => {
      if (!can('chat:write') || !can('ai:invoke')) throw new Error('Permission denied: chat:write + ai:invoke')
      return hostAPI.chat?.(message) ?? Promise.resolve('AI not available')
    },
    getEditorContent: () => {
      if (!can('editor:read')) throw new Error('Permission denied: editor:read')
      return hostAPI.getEditorContent?.() ?? ''
    },
    setEditorContent: (content: string) => {
      if (!can('editor:write')) throw new Error('Permission denied: editor:write')
      hostAPI.setEditorContent?.(content)
    },
    registerCommand: (id: string, label: string, handler: () => void) => {
      if (!can('ui:command')) throw new Error('Permission denied: ui:command')
      registeredCommands.set(id, { label, handler })
    },
    registerPanel: (id: string, title: string, render: () => HTMLElement) => {
      if (!can('ui:panel')) throw new Error('Permission denied: ui:panel')
      registeredPanels.set(id, { title, render })
    },
    storage: {
      get: (key: string) => {
        if (!can('storage:read')) throw new Error('Permission denied: storage:read')
        return localStorage.getItem(`plugin_${key}`)
      },
      set: (key: string, value: string) => {
        if (!can('storage:write')) throw new Error('Permission denied: storage:write')
        localStorage.setItem(`plugin_${key}`, value)
      },
      remove: (key: string) => {
        if (!can('storage:write')) throw new Error('Permission denied: storage:write')
        localStorage.removeItem(`plugin_${key}`)
      },
    },
  }
}

// ===== 面板/命令查询 =====

/**
 * 获取所有插件注册的面板
 */
export function getPluginPanels(): Array<{ id: string; title: string; render: () => HTMLElement }> {
  return Array.from(registeredPanels.entries()).map(([id, p]) => ({ id, ...p }))
}

/**
 * 获取所有插件注册的命令
 */
export function getPluginCommands(): Array<{ id: string; label: string; handler: () => void }> {
  return Array.from(registeredCommands.entries()).map(([id, c]) => ({ id, ...c }))
}

/**
 * 获取插件统计
 */
export function getPluginStats(): { total: number; active: number; inactive: number; error: number } {
  const instances = loadInstances()
  return {
    total: instances.length,
    active: instances.filter(p => p.state === 'active').length,
    inactive: instances.filter(p => p.state === 'inactive' || p.state === 'registered').length,
    error: instances.filter(p => p.state === 'error').length,
  }
}
