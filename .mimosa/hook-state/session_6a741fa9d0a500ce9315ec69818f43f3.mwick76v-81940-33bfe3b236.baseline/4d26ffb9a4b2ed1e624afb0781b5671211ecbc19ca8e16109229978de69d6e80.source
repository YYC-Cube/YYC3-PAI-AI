/**
 * @file useCRDTCollab.ts
 * @description CRDT实时协作Hook，提供文档同步和用户管理接口
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hook,crdt,yjs,collaboration,realtime
 */

import { useEffect, useCallback, useMemo } from 'react'
import {
  useCRDTCollabStore,
  type CollabConnectionType,
  type CollabUser,
  type CollabDocument,
} from '../store/crdt-collab-store'

/**
 * CRDT协作Hook配置
 */
export interface UseCRDTCollabOptions {
  /** 是否自动初始化 */
  autoInitialize?: boolean
  /** 默认连接类型 */
  defaultConnectionType?: CollabConnectionType
}

/**
 * CRDT协作Hook返回值
 */
export interface UseCRDTCollabReturn {
  /** 连接类型 */
  connectionType: CollabConnectionType
  /** 是否已连接 */
  connected: boolean
  /** 连接状态 */
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  /** 错误信息 */
  error?: string
  /** 当前用户ID */
  userId: string
  /** 当前用户名 */
  userName: string
  /** 当前用户颜色 */
  userColor: string
  /** 协作用户列表 */
  users: CollabUser[]
  /** 协作文档列表 */
  documents: Map<string, CollabDocument>
  /** 是否在线用户数 */
  onlineUsersCount: number
  /** 获取文档 */
  getDocument: (docId: string) => CollabDocument | undefined
  /** 创建文档 */
  createDocument: (docId: string, name: string) => Promise<CollabDocument>
  /** 打开文档 */
  openDocument: (docId: string) => Promise<CollabDocument>
  /** 关闭文档 */
  closeDocument: (docId: string) => void
  /** 更新光标位置 */
  updateCursor: (file: string, line: number, column: number) => void
  /** 获取文档内容 */
  getDocumentContent: (docId: string) => string
  /** 更新文档内容 */
  updateDocumentContent: (docId: string, content: string) => void
  /** 设置用户信息 */
  setUserInfo: (name: string, color?: string) => void
  /** 设置连接类型 */
  setConnectionType: (type: CollabConnectionType) => Promise<void>
  /** 断开连接 */
  disconnect: () => Promise<void>
  /** 获取文档状态 */
  getDocumentStatus: (docId: string) => { synced: boolean; error?: string }
}

/**
 * CRDT协作Hook
 *
 * 提供Yjs CRDT实时协作的完整接口，包括文档同步、用户管理、光标跟踪等。
 *
 * @example 基本使用
 * ```tsx
 * function CollaborativeEditor() {
 *   const { connected, createDocument, updateDocumentContent } = useCRDTCollab({
 *     autoInitialize: true,
 *   })
 *
 *   const [docId] = useState('my-doc')
 *
 *   useEffect(() => {
 *     createDocument(docId, 'My Document')
 *   }, [docId, createDocument])
 *
 *   return (
 *     <div>
 *       {connected ? 'Connected' : 'Disconnected'}
 *       <MonacoEditor
 *         onChange={(value) => updateDocumentContent(docId, value)}
 *       />
 *     </div>
 *   )
 * }
 * ```
 *
 * @example 设置用户信息
 * ```tsx
 * function UserProfile() {
 *   const { userId, userName, userColor, setUserInfo } = useCRDTCollab()
 *
 *   return (
 *     <div>
 *       <p>User ID: {userId}</p>
 *       <input
 *         value={userName}
 *         onChange={(e) => setUserInfo(e.target.value)}
 *         placeholder="Enter your name"
 *       />
 *       <div style={{ color: userColor }}>
 *         {userName}
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example WebSocket连接
 * ```tsx
 * function WebSocketPanel() {
 *   const { connectionType, setConnectionType, connected, connectionStatus } = useCRDTCollab()
 *
 *   return (
 *     <div>
 *       <select
 *         value={connectionType}
 *         onChange={(e) => setConnectionType(e.target.value as CollabConnectionType)}
 *       >
 *         <option value="none">None</option>
 *         <option value="websocket">WebSocket</option>
 *         <option value="webrtc">WebRTC</option>
 *       </select>
 *       <p>Status: {connectionStatus}</p>
 *       {connected && <span>✓ Connected</span>}
 *     </div>
 *   )
 * }
 * ```
 *
 * @example 跟踪光标位置
 * ```tsx
 * function CursorTrackingEditor() {
 *   const { updateCursor, users } = useCRDTCollab()
 *
 *   const handleCursorPositionChange = (line: number, column: number) => {
 *     updateCursor('current-file.js', line, column)
 *   }
 *
 *   return (
 *     <div>
 *       <MonacoEditor onCursorPosition={handleCursorPositionChange} />
 *       {users.map(user => (
 *         user.cursor && (
 *           <CursorIndicator
 *             key={user.id}
 *             user={user}
 *             line={user.cursor.line}
 *             column={user.cursor.column}
 *           />
 *         )
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCRDTCollab(
  options: UseCRDTCollabOptions = {}
): UseCRDTCollabReturn {
  const { autoInitialize = true, defaultConnectionType = 'none' } = options

  // Store selectors
  const connectionType = useCRDTCollabStore((state) => state.connectionType)
  const connected = useCRDTCollabStore((state) => state.connected)
  const connectionStatus = useCRDTCollabStore((state) => state.connectionStatus)
  const error = useCRDTCollabStore((state) => state.error)
  const userId = useCRDTCollabStore((state) => state.userId)
  const userName = useCRDTCollabStore((state) => state.userName)
  const userColor = useCRDTCollabStore((state) => state.userColor)
  const usersMap = useCRDTCollabStore((state) => state.users)
  const documents = useCRDTCollabStore((state) => state.documents)

  // Store actions
  const initializeCollab = useCRDTCollabStore((state) => state.initializeCollab)
  const createDocument = useCRDTCollabStore((state) => state.createDocument)
  const openDocument = useCRDTCollabStore((state) => state.openDocument)
  const closeDocument = useCRDTCollabStore((state) => state.closeDocument)
  const updateCursor = useCRDTCollabStore((state) => state.updateCursor)
  const getDocumentContent = useCRDTCollabStore((state) => state.getDocumentContent)
  const updateDocumentContent = useCRDTCollabStore((state) => state.updateDocumentContent)
  const setUserInfo = useCRDTCollabStore((state) => state.setUserInfo)
  const setConnectionType = useCRDTCollabStore((state) => state.setConnectionType)
  const disconnect = useCRDTCollabStore((state) => state.disconnect)
  const getDocument = useCallback(
    (docId: string) => {
      return useCRDTCollabStore.getState().documents.get(docId)
    },
    []
  )
  const getDocumentStatus = useCRDTCollabStore((state) => state.getDocumentStatus)

  // 协作用户列表（转换为数组）
  const users = useMemo(() => Array.from(usersMap.values()), [usersMap])

  // 在线用户数
  const onlineUsersCount = useMemo(
    () => users.filter((u) => u.online).length,
    [users]
  )

  // 自动初始化
  useEffect(() => {
    if (autoInitialize) {
      initializeCollab()
    }
  }, [autoInitialize, initializeCollab])

  // 自动设置连接类型
  useEffect(() => {
    if (defaultConnectionType !== 'none' && connectionType === 'none') {
      useCRDTCollabStore.getState().setConnectionType(defaultConnectionType)
    }
  }, [defaultConnectionType, connectionType])

  return {
    connectionType,
    connected,
    connectionStatus,
    error,
    userId,
    userName,
    userColor,
    users,
    documents,
    onlineUsersCount,
    getDocument,
    createDocument,
    openDocument,
    closeDocument,
    updateCursor,
    getDocumentContent,
    updateDocumentContent,
    setUserInfo,
    setConnectionType,
    disconnect,
    getDocumentStatus,
  }
}

/**
 * 简化版Hook：仅文档操作
 *
 * @example
 * ```tsx
 * function DocumentEditor({ docId }: { docId: string }) {
 *   const { getDocument, getDocumentContent, updateDocumentContent } = useDocumentManager()
 *
 *   const doc = getDocument(docId)
 *   const content = doc ? getDocumentContent(docId) : ''
 *
 *   return (
 *     <textarea
 *       value={content}
 *       onChange={(e) => updateDocumentContent(docId, e.target.value)}
 *     />
 *   )
 * }
 * ```
 */
export function useDocumentManager() {
  const { getDocument, createDocument, openDocument, closeDocument } = useCRDTCollab({
    autoInitialize: false,
  })

  return {
    getDocument,
    createDocument,
    openDocument,
    closeDocument,
  }
}

/**
 * Hook：仅用户管理
 *
 * @example
 * ```tsx
 * function UserManager() {
 *   const { userId, userName, userColor, users, setUserInfo } = useUserManager()
 *
 *   return (
 *     <div>
 *       <h3>Current User</h3>
 *       <p>ID: {userId}</p>
 *       <input
 *         value={userName}
 *         onChange={(e) => setUserInfo(e.target.value)}
 *         placeholder="Name"
 *       />
 *
 *       <h3>Online Users ({users.length})</h3>
 *       {users.map(user => (
 *         <div key={user.id} style={{ color: user.color }}>
 *           {user.name}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useUserManager() {
  const { userId, userName, userColor, users, onlineUsersCount, setUserInfo } = useCRDTCollab({
    autoInitialize: false,
  })

  return {
    userId,
    userName,
    userColor,
    users,
    onlineUsersCount,
    setUserInfo,
  }
}

/**
 * Hook：仅连接管理
 *
 * @example
 * ```tsx
 * function ConnectionPanel() {
 *   const {
 *     connectionType,
 *     connected,
 *     connectionStatus,
 *     setConnectionType,
 *     disconnect,
 *   } = useConnectionManager()
 *
 *   return (
 *     <div>
 *       <select
 *         value={connectionType}
 *         onChange={(e) => setConnectionType(e.target.value)}
 *       >
 *         <option value="none">None</option>
 *         <option value="websocket">WebSocket</option>
 *         <option value="webrtc">WebRTC</option>
 *       </select>
 *       <p>Status: {connectionStatus}</p>
 *       {connected && <span>✓ Connected</span>}
 *       <button onClick={disconnect}>Disconnect</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useConnectionManager() {
  const {
    connectionType,
    connected,
    connectionStatus,
    setConnectionType,
    disconnect,
  } = useCRDTCollab({
    autoInitialize: false,
  })

  return {
    connectionType,
    connected,
    connectionStatus,
    setConnectionType,
    disconnect,
  }
}

/**
 * Hook：仅光标跟踪
 *
 * @example
 * ```tsx
 * function CursorTrackingEditor() {
 *   const { updateCursor, users } = useCursorTracking()
 *
 *   return (
 *     <div>
 *       <MonacoEditor
 *         onCursorPosition={(line, column) => {
 *           updateCursor('current-file.js', line, column)
 *         }}
 *       />
 *       {users.map(user => (
 *         user.cursor && (
 *           <RemoteCursor
 *             key={user.id}
 *             user={user}
 *             line={user.cursor.line}
 *             column={user.cursor.column}
 *           />
 *         )
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCursorTracking() {
  const { updateCursor, users } = useCRDTCollab({
    autoInitialize: false,
  })

  // 过滤有光标的用户
  const usersWithCursors = useMemo(
    () => users.filter((u) => u.cursor !== undefined),
    [users]
  )

  return {
    updateCursor,
    users: usersWithCursors,
  }
}
