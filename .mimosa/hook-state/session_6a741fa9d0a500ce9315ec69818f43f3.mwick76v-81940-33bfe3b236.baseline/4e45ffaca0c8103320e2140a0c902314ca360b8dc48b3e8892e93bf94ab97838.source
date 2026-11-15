/**
 * @file CRDTCollabPanel.deep.test.tsx
 * @description CRDT 协作面板专项深化 — visible 门控 / 头部连接状态徽标与颜色分支 / 遮罩与 X 关闭 /
 *              Connect→setConnectionType(websocket) 与 Disconnect→disconnect / 错误条 /
 *              Users 页在线统计-他人光标-离线标注-空态 / Documents 页输入禁用-建档-文档列表同步态 /
 *              Settings 页改名-连接类型说明-连接信息
 * @note useCRDTCollab（yjs/y-websocket/y-webrtc 重依赖）以 vi.hoisted 受控桩替换，面板映射逻辑全真；
 *       theme-store 走真 store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { UseCRDTCollabReturn, UseCRDTCollabOptions } from '../../hooks/useCRDTCollab'
import type { CollabUser, CollabDocument } from '../../store/crdt-collab-store'

const h = vi.hoisted(() => ({
  hook: null as unknown,
  lastOpts: null as unknown,
  disconnect: vi.fn(),
  createDocument: vi.fn(),
  setUserInfo: vi.fn(),
  setConnectionType: vi.fn(),
}))

vi.mock('../../hooks/useCRDTCollab', () => ({
  useCRDTCollab: (opts: unknown) => { h.lastOpts = opts; return h.hook },
}))

import { CRDTCollabPanel } from '../CRDTCollabPanel'

// ── Helpers ──

const SELF_ID = 'user-1700000000000-abcdef123'
const user = (p: Partial<CollabUser> & { id: string; name: string }): CollabUser =>
  ({ color: '#4ECDC4', online: true, lastSeen: Date.now(), ...p })
const doc = (id: string, name: string, synced: boolean) =>
  ({ id, name, synced, doc: {} } as unknown as CollabDocument)

const baseHook = (): UseCRDTCollabReturn => ({
  connectionType: 'none',
  connected: false,
  connectionStatus: 'disconnected',
  error: undefined,
  userId: SELF_ID,
  userName: 'Anonymous',
  userColor: '#FF6B6B',
  users: [],
  documents: new Map(),
  onlineUsersCount: 0,
  getDocument: vi.fn(),
  createDocument: h.createDocument,
  openDocument: vi.fn(),
  closeDocument: vi.fn(),
  updateCursor: vi.fn(),
  getDocumentContent: vi.fn(),
  updateDocumentContent: vi.fn(),
  setUserInfo: h.setUserInfo,
  setConnectionType: h.setConnectionType,
  disconnect: h.disconnect,
  getDocumentStatus: vi.fn(),
})
const setHook = (overrides: Partial<UseCRDTCollabReturn> = {}) => { h.hook = { ...baseHook(), ...overrides } }

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => b.textContent?.trim() === text) as HTMLButtonElement
const tab = (c: HTMLElement, name: 'USERS' | 'DOCUMENTS' | 'SETTINGS') => btnByText(c, name)
const mount = (overrides: Partial<UseCRDTCollabReturn> = {}) => {
  setHook(overrides)
  const onClose = vi.fn()
  const utils = render(<CRDTCollabPanel visible onClose={onClose} />)
  return { ...utils, onClose }
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  h.lastOpts = null
  h.createDocument.mockResolvedValue(doc('d', 'd', true))
  h.setConnectionType.mockResolvedValue(undefined)
  h.disconnect.mockResolvedValue(undefined)
  setHook()
})

describe('CRDTCollabPanel 框架', () => {
  it('visible=false → null；打开渲染标题/DISCONNECTED 徽标/当前用户名与 ID 前 8 位/NONE 类型/Connect；hook 以 autoInitialize 调用', () => {
    setHook()
    const { container, rerender } = render(<CRDTCollabPanel visible={false} onClose={vi.fn()} />)
    expect(container.firstElementChild).toBeNull()
    expect((h.lastOpts as UseCRDTCollabOptions).autoInitialize).toBe(true)
    rerender(<CRDTCollabPanel visible onClose={vi.fn()} />)
    expect(container.textContent).toContain('CRDT COLLABORATION')
    expect(container.textContent).toContain('DISCONNECTED')
    expect(container.textContent).toContain('Anonymous')
    expect(container.textContent).toContain('ID: user-170')
    expect(container.textContent).toContain('NONE')
    expect(btnByText(container, 'Connect')).toBeTruthy()
    expect(btnByText(container, 'Disconnect')).toBeUndefined()
    // 未连接 → Radio 图标；默认 USERS 页
    expect(container.querySelector('.lucide-radio')).toBeTruthy()
    expect(container.textContent).toContain('ONLINE USERS (0)')
  })

  it('遮罩点击（target 判定）与 X 按钮双路关闭；点击面板内部不关闭', () => {
    const { container, onClose } = mount()
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.click(tab(container, 'USERS'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('Connect → setConnectionType(websocket)；连接态显示 Disconnect→disconnect，CONNECTED 徽标 + Wifi 图标', () => {
    const { container } = mount()
    fireEvent.click(btnByText(container, 'Connect'))
    expect(h.setConnectionType).toHaveBeenCalledWith('websocket')

    const { container: c2 } = mount({ connected: true, connectionType: 'websocket', connectionStatus: 'connected' })
    expect(c2.textContent).toContain('CONNECTED')
    expect(c2.textContent).toContain('WEBSOCKET')
    expect(c2.querySelector('.lucide-wifi')).toBeTruthy()
    fireEvent.click(btnByText(c2, 'Disconnect'))
    expect(h.disconnect).toHaveBeenCalledTimes(1)
  })

  it('error 存在 → 错误条；connecting/error 状态徽标文案', () => {
    const { container } = mount({ connectionStatus: 'error', error: 'Connection error', connectionType: 'webrtc' })
    expect(container.textContent).toContain('Connection error')
    expect(container.querySelector('.lucide-circle-alert, .lucide-alert-circle')).toBeTruthy()
    expect(container.textContent).toContain('ERROR')
    const { container: c2 } = mount({ connectionStatus: 'connecting' })
    expect(c2.textContent).toContain('CONNECTING')
    expect(c2.textContent).not.toContain('Connection error')
  })
})

describe('Users 页', () => {
  it('自己 + 在线 Bob（带光标）+ 离线 Carol → 在线 2 / 1 others online / 光标位置 / offline 标注', () => {
    const users = [
      user({ id: SELF_ID, name: 'Anonymous' }),
      user({ id: 'u-bob', name: 'Bob', cursor: { file: 'main.ts', line: 10, column: 5 } }),
      user({ id: 'u-carol', name: 'Carol', online: false }),
    ]
    const { container } = mount({ users, onlineUsersCount: 2 })
    expect(container.textContent).toContain('ONLINE USERS (2)')
    expect(container.textContent).toContain('2 watching')
    expect(container.textContent).toContain('Anonymous (You)')
    expect(container.textContent).toContain('1 others online')
    expect(container.textContent).toContain('Bob')
    expect(container.textContent).toContain('main.ts:10:5')
    expect(container.textContent).toContain('Carol')
    expect(container.textContent).toContain('• offline')
    expect(container.textContent).not.toContain('No other users connected')
  })

  it('仅自己在线 → Only you online + 空态提示', () => {
    const { container } = mount({ users: [user({ id: SELF_ID, name: 'Anonymous' })], onlineUsersCount: 1 })
    expect(container.textContent).toContain('ONLINE USERS (1)')
    expect(container.textContent).toContain('Only you online')
    expect(container.textContent).toContain('No other users connected')
  })
})

describe('Documents 页', () => {
  it('死锁已修（31号）：未连接也可建档（输入/按钮不因 connected 禁用）→ createDocument(name,name) 并清空；空白名保持禁用', () => {
    const { container } = mount()
    fireEvent.click(tab(container, 'DOCUMENTS'))
    expect(container.textContent).toContain('SHARED DOCUMENTS (0)')
    expect(container.textContent).toContain('No shared documents yet')
    const input = container.querySelector('input[placeholder="Enter document name..."]') as HTMLInputElement
    expect(input.disabled).toBe(false)
    expect(btnByText(container, 'New Document').disabled).toBe(true)
    fireEvent.change(input, { target: { value: 'first' } })
    expect(btnByText(container, 'New Document').disabled).toBe(false)
    fireEvent.click(btnByText(container, 'New Document'))
    expect(h.createDocument).toHaveBeenCalledWith('first', 'first')
    expect(input.value).toBe('')

    const { container: c2 } = mount({ connected: true, connectionType: 'websocket', connectionStatus: 'connected' })
    fireEvent.click(tab(c2, 'DOCUMENTS'))
    const in2 = c2.querySelector('input[placeholder="Enter document name..."]') as HTMLInputElement
    expect(in2.disabled).toBe(false)
    expect(btnByText(c2, 'New Document').disabled).toBe(true)
    fireEvent.change(in2, { target: { value: '   ' } })
    expect(btnByText(c2, 'New Document').disabled).toBe(true)
    fireEvent.change(in2, { target: { value: 'spec' } })
    expect(btnByText(c2, 'New Document').disabled).toBe(false)
    fireEvent.click(btnByText(c2, 'New Document'))
    expect(h.createDocument).toHaveBeenCalledWith('spec', 'spec')
    expect(in2.value).toBe('')
  })

  it('文档列表：SYNCED / SYNCING 状态 + ID 前 8 位 + 计数', () => {
    const documents = new Map<string, CollabDocument>([
      ['doc-aaaa-1', doc('doc-aaaa-1', 'Design Spec', true)],
      ['doc-bbbb-2', doc('doc-bbbb-2', 'Changelog', false)],
    ])
    const { container } = mount({ connected: true, connectionStatus: 'connected', documents })
    fireEvent.click(tab(container, 'DOCUMENTS'))
    expect(container.textContent).toContain('SHARED DOCUMENTS (2)')
    expect(container.textContent).toContain('Design Spec')
    expect(container.textContent).toContain('ID: doc-aaaa')
    expect(container.textContent).toContain('SYNCED')
    expect(container.textContent).toContain('Changelog')
    expect(container.textContent).toContain('SYNCING')
    expect(container.textContent).not.toContain('No shared documents yet')
  })
})

describe('Settings 页', () => {
  it('Display Name 改名 → setUserInfo；WEBSOCKET 说明 + Offline Support + 连接信息四格', () => {
    const documents = new Map<string, CollabDocument>([['d1', doc('d1', 'D1', true)]])
    const users = [user({ id: SELF_ID, name: 'Neo' }), user({ id: 'u2', name: 'Trinity' })]
    const { container } = mount({ connected: true, connectionType: 'websocket', connectionStatus: 'connected', userName: 'Neo', users, documents })
    fireEvent.click(tab(container, 'SETTINGS'))
    expect(container.textContent).toContain('COLLABORATION SETTINGS')
    const nameInput = Array.from(container.querySelectorAll('input')).find(i => i.value === 'Neo') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Morpheus' } })
    expect(h.setUserInfo).toHaveBeenCalledWith('Morpheus')
    expect(container.textContent).toContain('WEBSOCKET Provider')
    expect(container.textContent).toContain('Server-based sync')
    expect(container.textContent).toContain('Offline Support Enabled')
    expect(container.textContent).toContain('CONNECTION INFO')
    expect(container.textContent).toContain('Documents:1')
    expect(container.textContent).toContain('Users:2')
    expect(container.textContent).toContain('Status:CONNECTED')
  })

  it('WEBRTC 类型 → P2P direct connection 说明', () => {
    const { container } = mount({ connectionType: 'webrtc', connectionStatus: 'connecting' })
    fireEvent.click(tab(container, 'SETTINGS'))
    expect(container.textContent).toContain('WEBRTC Provider')
    expect(container.textContent).toContain('P2P direct connection')
    expect(container.textContent).toContain('Status:CONNECTING')
  })
})
