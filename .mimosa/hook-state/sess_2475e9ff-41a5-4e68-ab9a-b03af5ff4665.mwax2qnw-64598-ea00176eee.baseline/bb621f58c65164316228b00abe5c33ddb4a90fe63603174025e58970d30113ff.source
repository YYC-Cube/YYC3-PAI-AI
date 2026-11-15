/**
 * @file plugin-store.ts
 * @description 插件状态管理模块，管理插件系统
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,state-management,core
 */

import { useSyncExternalStore } from 'react'
import { createLogger } from '../utils/logger'

const logger = createLogger('plugin-store')

// ===== Plugin Type Definitions (对齐 Guidelines: Plugin API) =====

/** 插件类型分类 */
export type PluginCategory = 'storage' | 'ai-provider' | 'theme' | 'language' | 'editor' | 'preview' | 'integration' | 'tool'

/** 插件生命周期钩子 */
export interface PluginLifecycle {
  /** 插件激活时调用 */
  onActivate?: () => Promise<void> | void
  /** 插件停用时调用 */
  onDeactivate?: () => Promise<void> | void
  /** 插件配置变更时调用 */
  onConfigChange?: (config: Record<string, unknown>) => Promise<void> | void
  /** 插件卸载时调用（清理资源） */
  onUninstall?: () => Promise<void> | void
}

/** 存储后端插件 API（对齐 Guidelines: third-party storage back-ends） */
export interface StoragePluginAPI {
  /** 存储类型标识 */
  type: string
  /** 读取数据 */
  read: (key: string) => Promise<string | null>
  /** 写入数据 */
  write: (key: string, value: string) => Promise<void>
  /** 删除数据 */
  remove: (key: string) => Promise<void>
  /** 列出所有键 */
  list: () => Promise<string[]>
  /** 检查连接状态 */
  isConnected: () => Promise<boolean>
  /** 获取存储大小 */
  getSize?: () => Promise<number>
}

/** AI 供应商插件 API */
export interface AIProviderPluginAPI {
  /** 供应商标识 */
  providerId: string
  /** 聊天补全 */
  chat: (messages: Array<{ role: string; content: string }>, options?: Record<string, unknown>) => Promise<unknown>
  /** 嵌入向量 */
  embed?: (text: string) => Promise<number[]>
  /** 验证 API Key */
  validate: (apiKey: string) => Promise<boolean>
}

/** 编辑器扩展插件 API */
export interface EditorPluginAPI {
  /** 注册语言支持 */
  registerLanguage?: (languageId: string, config: unknown) => void
  /** 注册代码补全 */
  registerCompletion?: (provider: unknown) => void
  /** 注册代码格式化 */
  registerFormatter?: (formatter: unknown) => void
  /** 注册代码诊断 */
  registerDiagnostic?: (diagnosticProvider: unknown) => void
}

/** 通用插件 API 联合类型 */
export type PluginAPI = StoragePluginAPI | AIProviderPluginAPI | EditorPluginAPI | Record<string, unknown>

/** 插件元信息 */
export interface PluginMeta {
  /** 插件唯一 ID */
  id: string
  /** 插件名称 */
  name: string
  /** 显示名称 */
  displayName: string
  /** 插件描述 */
  description: string
  /** 版本号 */
  version: string
  /** 作者 */
  author: string
  /** 类别 */
  category: PluginCategory
  /** 图标名称（Lucide React） */
  icon: string
  /** 主题色 */
  color: string
  /** 是否启用 */
  enabled: boolean
  /** 是否为内置插件 */
  builtin: boolean
  /** 安装时间 */
  installedAt: number
  /** 插件配置 */
  config: Record<string, unknown>
  /** 权限声明 */
  permissions: string[]
}

/** 已注册的插件完整信息 */
export interface RegisteredPlugin {
  meta: PluginMeta
  api: PluginAPI
  lifecycle: PluginLifecycle
  status: 'active' | 'inactive' | 'error'
  error?: string
  lastActiveAt?: number
}

// ===== State =====
interface PluginStoreState {
  /** 已注册的插件列表 */
  plugins: RegisteredPlugin[]
  /** 面板可见 */
  panelVisible: boolean
  /** 当前选中的插件 */
  selectedPluginId: string | null
  /** 活跃子面板 */
  activeTab: 'installed' | 'marketplace' | 'settings'
}

// ===== Persistence =====
const LS_KEY = 'yyc3_plugin_store'

function savePersistedMeta(plugins: RegisteredPlugin[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(plugins.map(p => p.meta)))
  } catch { /* ignore */ }
}

// ===== Built-in Plugins (对齐 Guidelines: local SQLite, cloud S3) =====

const BUILTIN_PLUGINS: RegisteredPlugin[] = [
  {
    meta: {
      id: 'yyc3-localstorage',
      name: 'localstorage',
      displayName: 'LocalStorage Backend',
      description: '基于浏览器 LocalStorage 的轻量存储后端，适用于小型配置数据',
      version: '1.0.0',
      author: 'YYC³ Team',
      category: 'storage',
      icon: 'HardDrive',
      color: '#00f0ff',
      enabled: true,
      builtin: true,
      installedAt: Date.now(),
      config: { maxSize: 5 * 1024 * 1024 },
      permissions: ['storage.read', 'storage.write'],
    },
    api: {
      type: 'localstorage',
      read: async (key: string) => localStorage.getItem(`yyc3_plugin_ls_${key}`),
      write: async (key: string, value: string) => localStorage.setItem(`yyc3_plugin_ls_${key}`, value),
      remove: async (key: string) => localStorage.removeItem(`yyc3_plugin_ls_${key}`),
      list: async () => {
        const prefix = 'yyc3_plugin_ls_'
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k?.startsWith(prefix)) keys.push(k.slice(prefix.length))
        }
        return keys
      },
      isConnected: async () => true,
      getSize: async () => {
        let total = 0
        const prefix = 'yyc3_plugin_ls_'
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k?.startsWith(prefix)) total += (localStorage.getItem(k) ?? '').length * 2
        }
        return total
      },
    } as StoragePluginAPI,
    lifecycle: {
      onActivate: () => logger.info('[Plugin] LocalStorage backend activated'),
      onDeactivate: () => logger.info('[Plugin] LocalStorage backend deactivated'),
    },
    status: 'active',
  },
  {
    meta: {
      id: 'yyc3-indexeddb',
      name: 'indexeddb',
      displayName: 'IndexedDB Backend',
      description: '基于浏览器 IndexedDB 的大容量存储后端，支持结构化数据和文件存储',
      version: '1.0.0',
      author: 'YYC³ Team',
      category: 'storage',
      icon: 'Database',
      color: '#39ff14',
      enabled: true,
      builtin: true,
      installedAt: Date.now(),
      config: { dbName: 'yyc3_plugin_idb', storeName: 'data' },
      permissions: ['storage.read', 'storage.write', 'storage.bulk'],
    },
    api: {
      type: 'indexeddb',
      read: async (key: string) => {
        return new Promise<string | null>((resolve) => {
          const req = indexedDB.open('yyc3_plugin_idb', 1)
          req.onupgradeneeded = () => { req.result.createObjectStore('data') }
          req.onsuccess = () => {
            const tx = req.result.transaction('data', 'readonly')
            const store = tx.objectStore('data')
            const getReq = store.get(key)
            getReq.onsuccess = () => resolve(getReq.result ?? null)
            getReq.onerror = () => resolve(null)
          }
          req.onerror = () => resolve(null)
        })
      },
      write: async (key: string, value: string) => {
        return new Promise<void>((resolve) => {
          const req = indexedDB.open('yyc3_plugin_idb', 1)
          req.onupgradeneeded = () => { req.result.createObjectStore('data') }
          req.onsuccess = () => {
            const tx = req.result.transaction('data', 'readwrite')
            tx.objectStore('data').put(value, key)
            tx.oncomplete = () => resolve()
          }
          req.onerror = () => resolve()
        })
      },
      remove: async (key: string) => {
        return new Promise<void>((resolve) => {
          const req = indexedDB.open('yyc3_plugin_idb', 1)
          req.onsuccess = () => {
            const tx = req.result.transaction('data', 'readwrite')
            tx.objectStore('data').delete(key)
            tx.oncomplete = () => resolve()
          }
          req.onerror = () => resolve()
        })
      },
      list: async () => {
        return new Promise<string[]>((resolve) => {
          const req = indexedDB.open('yyc3_plugin_idb', 1)
          req.onupgradeneeded = () => { req.result.createObjectStore('data') }
          req.onsuccess = () => {
            const tx = req.result.transaction('data', 'readonly')
            const getReq = tx.objectStore('data').getAllKeys()
            getReq.onsuccess = () => resolve(getReq.result.map(String))
            getReq.onerror = () => resolve([])
          }
          req.onerror = () => resolve([])
        })
      },
      isConnected: async () => true,
    } as StoragePluginAPI,
    lifecycle: {
      onActivate: () => logger.info('[Plugin] IndexedDB backend activated'),
      onDeactivate: () => logger.info('[Plugin] IndexedDB backend deactivated'),
    },
    status: 'active',
  },
  {
    meta: {
      id: 'yyc3-s3-mock',
      name: 's3-cloud',
      displayName: 'Cloud S3 Storage',
      description: '模拟 Amazon S3 / MinIO 云存储后端，支持大文件和多区域复制',
      version: '0.9.0',
      author: 'YYC³ Community',
      category: 'storage',
      icon: 'Cloud',
      color: '#f5a623',
      enabled: false,
      builtin: true,
      installedAt: Date.now(),
      config: { endpoint: '', bucket: '', region: 'us-east-1', accessKey: '', secretKey: '' },
      permissions: ['storage.read', 'storage.write', 'network.external'],
    },
    api: {
      type: 's3',
      read: async () => null,
      write: async () => { },
      remove: async () => { },
      list: async () => [],
      isConnected: async () => false,
    } as StoragePluginAPI,
    lifecycle: {},
    status: 'inactive',
  },
  {
    meta: {
      id: 'yyc3-sqlite-mock',
      name: 'sqlite-local',
      displayName: 'Local SQLite',
      description: '模拟本地 SQLite 嵌入式数据库存储后端（需 Tauri 原生桥接）',
      version: '0.9.0',
      author: 'YYC³ Community',
      category: 'storage',
      icon: 'FileBox',
      color: '#bd10e0',
      enabled: false,
      builtin: true,
      installedAt: Date.now(),
      config: { dbPath: 'yyc3_data.sqlite3' },
      permissions: ['storage.read', 'storage.write', 'fs.access'],
    },
    api: {
      type: 'sqlite',
      read: async () => null,
      write: async () => { },
      remove: async () => { },
      list: async () => [],
      isConnected: async () => false,
    } as StoragePluginAPI,
    lifecycle: {},
    status: 'inactive',
  },
]

// ===== Marketplace Mock (第三方插件模拟) =====
export const MARKETPLACE_PLUGINS: PluginMeta[] = [
  {
    id: 'community-redis-storage', name: 'redis-storage', displayName: 'Redis Storage Backend',
    description: '基于 Redis 的高性能缓存存储后端', version: '1.2.0', author: 'OpenDev Labs',
    category: 'storage', icon: 'Zap', color: '#dc382d', enabled: false, builtin: false,
    installedAt: 0, config: {}, permissions: ['storage.read', 'storage.write', 'network.local'],
  },
  {
    id: 'community-ollama-ext', name: 'ollama-extended', displayName: 'Ollama Extended',
    description: '增强 Ollama 本地 AI 集成，支持模型自动下载和热切换', version: '2.0.1', author: 'AI Community',
    category: 'ai-provider', icon: 'Bot', color: '#4a90d9', enabled: false, builtin: false,
    installedAt: 0, config: {}, permissions: ['ai.chat', 'ai.embed', 'network.local'],
  },
  {
    id: 'community-vim-mode', name: 'vim-mode', displayName: 'Vim Keybindings',
    description: '为代码编辑器添加完整 Vim 键位映射', version: '3.1.0', author: 'VimDevs',
    category: 'editor', icon: 'Keyboard', color: '#39ff14', enabled: false, builtin: false,
    installedAt: 0, config: {}, permissions: ['editor.keybindings'],
  },
  {
    id: 'community-github-sync', name: 'github-sync', displayName: 'GitHub Sync',
    description: '将工作区文件自动同步到 GitHub 仓库', version: '1.5.0', author: 'DevToolsHQ',
    category: 'integration', icon: 'Github', color: '#ffffff', enabled: false, builtin: false,
    installedAt: 0, config: {}, permissions: ['network.external', 'fs.access', 'auth.oauth'],
  },
  {
    id: 'community-tailwind-preview', name: 'tailwind-preview', displayName: 'Tailwind Preview',
    description: '实时预览 Tailwind CSS 类名效果', version: '1.0.0', author: 'CSS Masters',
    category: 'preview', icon: 'Paintbrush', color: '#06b6d4', enabled: false, builtin: false,
    installedAt: 0, config: {}, permissions: ['preview.render'],
  },
]

// ===== Module Store =====
let state: PluginStoreState = {
  plugins: [...BUILTIN_PLUGINS],
  panelVisible: false,
  selectedPluginId: null,
  activeTab: 'installed',
}

const listeners = new Set<() => void>()
function emit() { savePersistedMeta(state.plugins); listeners.forEach(fn => fn()) }

// ===== Core Plugin API (对齐 Guidelines: registerPlugin(name, api)) =====
export const pluginStoreActions = {

  /**
   * 注册插件（核心 API — 对齐 Guidelines: registerPlugin(name, api)）
   * 第三方可通过此 API 注册存储后端、AI 供应商等扩展
   */
  registerPlugin(name: string, api: PluginAPI, meta?: Partial<PluginMeta>, lifecycle?: PluginLifecycle): boolean {
    const existing = state.plugins.find(p => p.meta.name === name)
    if (existing) {
      logger.warn(`[PluginAPI] Plugin "${name}" already registered`)
      return false
    }

    const pluginMeta: PluginMeta = {
      id: `ext-${name}-${Date.now().toString(36)}`,
      name,
      displayName: meta?.displayName ?? name,
      description: meta?.description ?? '',
      version: meta?.version ?? '0.0.1',
      author: meta?.author ?? 'Unknown',
      category: meta?.category ?? 'tool',
      icon: meta?.icon ?? 'Puzzle',
      color: meta?.color ?? '#888888',
      enabled: meta?.enabled ?? true,
      builtin: false,
      installedAt: Date.now(),
      config: meta?.config ?? {},
      permissions: meta?.permissions ?? [],
    }

    const plugin: RegisteredPlugin = {
      meta: pluginMeta,
      api,
      lifecycle: lifecycle ?? {},
      status: pluginMeta.enabled ? 'active' : 'inactive',
    }

    state = { ...state, plugins: [...state.plugins, plugin] }

    // 触发生命周期
    if (pluginMeta.enabled && lifecycle?.onActivate) {
      try { lifecycle.onActivate() } catch (err) {
        logger.error(`[PluginAPI] Failed to activate "${name}"`, err)
        state = {
          ...state,
          plugins: state.plugins.map(p => p.meta.id === pluginMeta.id ? { ...p, status: 'error', error: String(err) } : p),
        }
      }
    }

    emit()
    logger.info(`Plugin "${name}" registered successfully`)
    return true
  },

  /** 注销插件 */
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    const plugin = state.plugins.find(p => p.meta.id === pluginId)
    if (!plugin) return false
    if (plugin.meta.builtin) { logger.warn('[PluginAPI] Cannot unregister built-in plugin'); return false }

    if (plugin.lifecycle.onUninstall) {
      try { await plugin.lifecycle.onUninstall() } catch { /* ignore */ }
    }
    if (plugin.lifecycle.onDeactivate && plugin.status === 'active') {
      try { await plugin.lifecycle.onDeactivate() } catch { /* ignore */ }
    }

    state = { ...state, plugins: state.plugins.filter(p => p.meta.id !== pluginId) }
    emit()
    return true
  },

  /** 启用插件 */
  async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = state.plugins.find(p => p.meta.id === pluginId)
    if (!plugin) return false

    if (plugin.lifecycle.onActivate) {
      try { await plugin.lifecycle.onActivate() } catch (err) {
        state = { ...state, plugins: state.plugins.map(p => p.meta.id === pluginId ? { ...p, status: 'error', error: String(err), meta: { ...p.meta, enabled: false } } : p) }
        emit()
        return false
      }
    }

    state = {
      ...state,
      plugins: state.plugins.map(p => p.meta.id === pluginId
        ? { ...p, status: 'active', meta: { ...p.meta, enabled: true }, lastActiveAt: Date.now(), error: undefined }
        : p
      ),
    }
    emit()
    return true
  },

  /** 停用插件 */
  async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = state.plugins.find(p => p.meta.id === pluginId)
    if (!plugin) return false

    if (plugin.lifecycle.onDeactivate) {
      try { await plugin.lifecycle.onDeactivate() } catch { /* ignore */ }
    }

    state = {
      ...state,
      plugins: state.plugins.map(p => p.meta.id === pluginId
        ? { ...p, status: 'inactive', meta: { ...p.meta, enabled: false } }
        : p
      ),
    }
    emit()
    return true
  },

  /** 更新插件配置 */
  async updatePluginConfig(pluginId: string, config: Record<string, unknown>): Promise<boolean> {
    const plugin = state.plugins.find(p => p.meta.id === pluginId)
    if (!plugin) return false

    if (plugin.lifecycle.onConfigChange) {
      try { await plugin.lifecycle.onConfigChange(config) } catch { /* ignore */ }
    }

    state = {
      ...state,
      plugins: state.plugins.map(p => p.meta.id === pluginId
        ? { ...p, meta: { ...p.meta, config: { ...p.meta.config, ...config } } }
        : p
      ),
    }
    emit()
    return true
  },

  /** 安装第三方插件（模拟） */
  async installPlugin(marketplaceMeta: PluginMeta): Promise<boolean> {
    const existing = state.plugins.find(p => p.meta.id === marketplaceMeta.id)
    if (existing) return false

    const plugin: RegisteredPlugin = {
      meta: { ...marketplaceMeta, installedAt: Date.now(), enabled: false },
      api: {},
      lifecycle: {},
      status: 'inactive',
    }

    state = { ...state, plugins: [...state.plugins, plugin] }
    emit()
    return true
  },

  /** 获取指定类别的所有活跃插件 */
  getActivePluginsByCategory<T extends PluginAPI>(category: PluginCategory): Array<{ meta: PluginMeta; api: T }> {
    return state.plugins
      .filter(p => p.meta.category === category && p.status === 'active')
      .map(p => ({ meta: p.meta, api: p.api as T }))
  },

  /** 获取指定插件的 API */
  getPluginAPI<T extends PluginAPI>(pluginId: string): T | null {
    const plugin = state.plugins.find(p => p.meta.id === pluginId)
    return plugin?.status === 'active' ? (plugin.api as T) : null
  },

  // ===== Panel =====
  openPanel() { state = { ...state, panelVisible: true }; emit() },
  closePanel() { state = { ...state, panelVisible: false }; emit() },
  selectPlugin(id: string | null) { state = { ...state, selectedPluginId: id }; emit() },
  setActiveTab(tab: PluginStoreState['activeTab']) { state = { ...state, activeTab: tab }; emit() },
}

// ===== 全局暴露 registerPlugin (对齐 Guidelines: 第三方直接调用) =====
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)['yyc3RegisterPlugin'] = pluginStoreActions.registerPlugin
}

// ===== React Hook =====
export function usePluginStore() {
  const snapshot = useSyncExternalStore(
    (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    () => state,
  )
  return { ...snapshot, ...pluginStoreActions }
}
