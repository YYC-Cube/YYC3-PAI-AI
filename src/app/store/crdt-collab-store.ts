/**
 * @file crdt-collab-store.ts
 * @description CRDT实时协作Store，管理Yjs文档和多用户同步
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags store,crdt,yjs,collaboration,realtime
 */

import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'
import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createLogger } from '../utils/logger'

const logger = createLogger('crdt')

const COLLAB_CONFIG = {
  get wsUrl() { return import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:8080' },
  get signalingUrls(): string[] {
    // 信令服务不再内置任何默认域名：历史硬编码的 wss://signaling.yyc3.io 归属
    // 未经验证（被抢注即全量用户泄露连接元数据）。必须显式配置后启用。
    const envVal = import.meta.env.VITE_COLLAB_SIGNALING_URL
    return envVal ? [envVal] : []
  },
  /** 房间令牌：自建协作服务端（见 docs/YYC3-协作服务端-部署指南.md）按房间签发；
   *  令牌经查询参数下发给 y-websocket / signaling，服务端校验后才允许加入房间。
   *  未配置时服务端应默认拒绝写操作（只读）或按其自身策略处理。 */
  get roomToken() { return import.meta.env.VITE_COLLAB_ROOM_TOKEN || '' },
  maxConnsBase: 20,
  maxConnsRandom: 10,
} as const

/** 拼接带 token 的连接 URL（无 token 原样返回） */
function withRoomToken(url: string): string {
  const token = COLLAB_CONFIG.roomToken
  if (!token) return url
  return url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token)
}

/**
 * 协作连接类型
 */
export type CollabConnectionType = 'websocket' | 'webrtc' | 'none'

/**
 * 用户信息
 */
export interface CollabUser {
  /** 用户ID */
  id: string
  /** 用户名 */
  name: string
  /** 用户颜色 */
  color: string
  /** 用户光标位置 */
  cursor?: {
    /** 文件名 */
    file: string
    /** 行号 */
    line: number
    /** 列号 */
    column: number
  }
  /** 在线状态 */
  online: boolean
  /** 最后活跃时间 */
  lastSeen: number
}

/**
 * 协作文档
 */
export interface CollabDocument {
  /** 文档ID */
  id: string
  /** 文档名称 */
  name: string
  /** Yjs文档实例 */
  doc: Y.Doc
  /** WebSocket Provider */
  wsProvider?: WebsocketProvider
  /** WebRTC Provider */
  rtcProvider?: WebrtcProvider
  /** IndexedDB持久化 */
  idbPersistence?: IndexeddbPersistence
  /** 文档状态 */
  synced: boolean
}

/**
 * 协作状态
 */
export interface CollabState {
  /** 连接类型 */
  connectionType: CollabConnectionType
  /** 是否已连接 */
  connected: boolean
  /** 当前用户ID */
  userId: string
  /** 当前用户名 */
  userName: string
  /** 当前用户颜色 */
  userColor: string
  /** 协作用户列表 */
  users: Map<string, CollabUser>
  /** 协作文档列表 */
  documents: Map<string, CollabDocument>
  /** 连接状态 */
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  /** 错误信息 */
  error?: string
}

/**
 * CRDT协作Store操作
 */
interface CollabStoreActions {
  /** 初始化协作系统 */
  initializeCollab: () => Promise<void>
  /** 设置连接类型 */
  setConnectionType: (type: CollabConnectionType) => Promise<void>
  /** 设置当前用户信息 */
  setUserInfo: (name: string, color?: string) => void
  /** 创建协作文档 */
  createDocument: (docId: string, name: string) => Promise<CollabDocument>
  /** 打开文档 */
  openDocument: (docId: string) => Promise<CollabDocument>
  /** 关闭文档 */
  closeDocument: (docId: string) => void
  /** 关闭所有文档 */
  closeAllDocuments: () => void
  /** 更新用户光标位置 */
  updateCursor: (file: string, line: number, column: number) => void
  /** 获取文档内容 */
  getDocumentContent: (docId: string) => string
  /** 更新文档内容 */
  updateDocumentContent: (docId: string, content: string) => void
  /** 获取文档状态 */
  getDocumentStatus: (docId: string) => { synced: boolean; error?: string }
  /** 获取用户列表 */
  getUsers: () => CollabUser[]
  /** 清除所有数据 */
  clearAll: () => void
  /** 断开连接 */
  disconnect: () => Promise<void>
  /** 连接WebSocket */
  connectWebSocket: () => Promise<void>
  /** 连接WebRTC */
  connectWebRTC: () => Promise<void>
}

/**
 * 用户颜色列表
 */
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B739', '#52B788', '#E76F51', '#2A9D8F',
]

/**
 * 生成随机用户颜色
 */
function getRandomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

/**
 * 生成用户ID
 */
function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * CRDT协作Store
 */
export const useCRDTCollabStore = create<CollabState & CollabStoreActions>()(
  immer((set, get) => ({
    // 初始状态
    connectionType: 'none',
    connected: false,
    userId: generateUserId(),
    userName: 'Anonymous',
    userColor: getRandomUserColor(),
    users: new Map(),
    documents: new Map(),
    connectionStatus: 'disconnected',

    // 初始化协作系统
    initializeCollab: async () => {
      // 从localStorage恢复用户信息
      try {
        const savedUserName = localStorage.getItem('yyc3_collab_username')
        const savedUserColor = localStorage.getItem('yyc3_collab_usercolor')
        if (savedUserName) {
          set((s) => {
            s.userName = savedUserName
          })
        }
        if (savedUserColor) {
          set((s) => {
            s.userColor = savedUserColor
          })
        }
      } catch (error) {
        logger.error('[CRDT] Failed to load user info:', error)
      }

      logger.info('Collaboration system initialized')
    },

    // 设置连接类型
    setConnectionType: async (type) => {
      set((state) => {
        state.connectionType = type
        state.connectionStatus = 'connecting'
      })

      try {
        if (type === 'websocket') {
          await get().connectWebSocket()
        } else if (type === 'webrtc') {
          await get().connectWebRTC()
        } else {
          await get().disconnect()
        }
      } catch (error) {
        logger.error('[CRDT] Failed to set connection type:', error)
        set((state) => {
          state.connectionStatus = 'error'
          state.error = error instanceof Error ? error.message : String(error)
        })
      }
    },

    // 设置当前用户信息
    setUserInfo: (name, color) => {
      set((state) => {
        state.userName = name
        state.userColor = color || getRandomUserColor()
      })

      // 保存到localStorage
      try {
        localStorage.setItem('yyc3_collab_username', name)
        if (color) {
          localStorage.setItem('yyc3_collab_usercolor', color)
        }
      } catch (error) {
        logger.error('[CRDT] Failed to save user info:', error)
      }
    },

    // 创建协作文档
    createDocument: async (docId, name) => {
      const existing = get().documents.get(docId)
      if (existing) {
        return existing
      }

      // 创建Yjs文档
      const doc = new Y.Doc()

      // 设置IndexedDB持久化
      const idbPersistence = new IndexeddbPersistence(docId, doc)

      // 等待持久化加载
      await new Promise<void>((resolve) => {
        idbPersistence.on('synced', () => resolve())
        idbPersistence.on('load', () => resolve())
      })

      const collabDoc: CollabDocument = {
        id: docId,
        name,
        doc,
        idbPersistence,
        synced: true,
      }

      set((state) => {
        state.documents.set(docId, collabDoc)
      })

      logger.info(`Document created: ${name}`)
      return collabDoc
    },

    // 打开文档
    openDocument: async (docId) => {
      const existing = get().documents.get(docId)
      if (existing) {
        return existing
      }

      return get().createDocument(docId, docId)
    },

    // 关闭文档
    closeDocument: (docId) => {
      set((state) => {
        const doc = state.documents.get(docId)
        if (doc) {
          // 销毁providers
          if (doc.wsProvider) {
            doc.wsProvider.destroy()
          }
          if (doc.rtcProvider) {
            doc.rtcProvider.destroy()
          }

          // 销毁文档
          doc.doc.destroy()

          state.documents.delete(docId)
        }
      })

      logger.info(`Document closed: ${docId}`)
    },

    // 关闭所有文档
    closeAllDocuments: () => {
      set((state) => {
        state.documents.forEach((doc) => {
          if (doc.wsProvider) {
            doc.wsProvider.destroy()
          }
          if (doc.rtcProvider) {
            doc.rtcProvider.destroy()
          }
          doc.doc.destroy()
        })
        state.documents.clear()
      })

      logger.info('All documents closed')
    },

    // 更新用户光标位置
    updateCursor: (file, line, column) => {
      set((state) => {
        const currentUser = state.users.get(state.userId)
        if (currentUser) {
          currentUser.cursor = { file, line, column }
          currentUser.lastSeen = Date.now()
        } else {
          state.users.set(state.userId, {
            id: state.userId,
            name: state.userName,
            color: state.userColor,
            cursor: { file, line, column },
            online: true,
            lastSeen: Date.now(),
          })
        }
      })

      const cursorData = { file, line, column }
      const doc = get().documents.get(file)
      if (doc?.wsProvider) {
        doc.wsProvider.awareness.setLocalStateField('cursor', cursorData)
      } else if (doc?.rtcProvider) {
        doc.rtcProvider.awareness.setLocalStateField('cursor', cursorData)
      }
    },

    // 获取文档内容
    getDocumentContent: (docId) => {
      const doc = get().documents.get(docId)
      if (!doc) {
        return ''
      }

      const ytext = doc.doc.getText('content')
      return ytext.toString()
    },

    // 更新文档内容
    updateDocumentContent: (docId, content) => {
      const doc = get().documents.get(docId)
      if (!doc) {
        throw new Error(`Document ${docId} not found`)
      }

      doc.doc.transact(() => {
        const ytext = doc.doc.getText('content')
        ytext.delete(0, ytext.length)
        ytext.insert(0, content)
      })
    },

    // 获取文档状态
    getDocumentStatus: (docId) => {
      const doc = get().documents.get(docId)
      if (!doc) {
        return { synced: false, error: 'Document not found' }
      }

      return {
        synced: doc.synced,
      }
    },

    // 获取用户列表
    getUsers: () => {
      return Array.from(get().users.values()).filter((u) => u.online)
    },

    // 清除所有数据
    clearAll: () => {
      get().closeAllDocuments()
      get().disconnect()

      set((state) => {
        state.users.clear()
        state.connectionType = 'none'
        state.connected = false
        state.connectionStatus = 'disconnected'
      })
    },

    // 连接WebSocket
    connectWebSocket: async () => {
      const state = get()

      // 为每个文档创建WebSocket Provider
      for (const [docId, doc] of state.documents) {
        const wsProvider = new WebsocketProvider(
          withRoomToken(COLLAB_CONFIG.wsUrl),
          docId,
          doc.doc,
          { connect: true }
        )

        // 设置用户信息到 awareness
        wsProvider.awareness.setLocalStateField('user', {
          id: state.userId,
          name: state.userName,
          color: state.userColor,
        })

        wsProvider.on('status', (event: { status: string }) => {
          logger.debug(`WebSocket status for ${docId}:`, event.status)
          set((s) => {
            const d = s.documents.get(docId)
            if (d) {
              d.synced = event.status === 'connected'
            }
            s.connectionStatus = event.status === 'connected' ? 'connected' : 'connecting'
            s.connected = event.status === 'connected'
          })
        })

        wsProvider.on('connection-error', (event: Event) => {
          logger.error(`[CRDT] WebSocket error for ${docId}:`, event)
          set((s) => {
            s.connectionStatus = 'error'
            s.error = 'Connection error'
          })
        })

        // 更新文档provider
        set((s) => {
          const d = s.documents.get(docId)
          if (d) {
            d.wsProvider = wsProvider
          }
        })
      }
    },

    // 连接WebRTC
    connectWebRTC: async () => {
      const state = get()

      // 为每个文档创建WebRTC Provider
      for (const [docId, doc] of state.documents) {
        const rtcProvider = new WebrtcProvider(docId, doc.doc, {
          signaling: COLLAB_CONFIG.signalingUrls.map(withRoomToken),
          maxConns: COLLAB_CONFIG.maxConnsBase + Math.floor(Math.random() * COLLAB_CONFIG.maxConnsRandom),
          filterBcConns: true,
          peerOpts: {},
        })

        rtcProvider.on('peers', (arg: { added: string[]; removed: string[]; webrtcPeers: string[]; bcPeers: string[] }) => {
          logger.debug(`WebRTC peers for ${docId}:`, arg.webrtcPeers.length)
          set((s) => {
            s.connectionStatus = arg.webrtcPeers.length > 0 ? 'connected' : 'connecting'
            s.connected = arg.webrtcPeers.length > 0

            // 更新用户列表
            const users = new Map<string, CollabUser>()
            users.set(state.userId, {
              id: state.userId,
              name: state.userName,
              color: state.userColor,
              online: true,
              lastSeen: Date.now(),
            })

            arg.webrtcPeers.forEach((peerId) => {
              users.set(peerId, {
                id: peerId,
                name: `Peer-${peerId.substr(0, 6)}`,
                color: getRandomUserColor(),
                online: true,
                lastSeen: Date.now(),
              })
            })

            s.users = users
          })
        })

        rtcProvider.on('synced', (event: { synced: boolean }) => {
          logger.debug(`WebRTC synced for ${docId}:`, event.synced)
          set((s) => {
            const d = s.documents.get(docId)
            if (d) {
              d.synced = event.synced
            }
          })
        })

        // 更新文档provider
        set((s) => {
          const d = s.documents.get(docId)
          if (d) {
            d.rtcProvider = rtcProvider
          }
        })
      }
    },

    // 断开连接
    disconnect: async () => {
      set((state) => {
        state.documents.forEach((doc) => {
          if (doc.wsProvider) {
            doc.wsProvider.disconnect()
          }
          if (doc.rtcProvider) {
            doc.rtcProvider.disconnect()
          }
        })
        state.connected = false
        state.connectionStatus = 'disconnected'
      })

      logger.info('Disconnected')
    },
  }))
)
