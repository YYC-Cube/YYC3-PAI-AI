/**
 * @file DatabasePanel.deep.test.tsx
 * @description 数据库管理器（DatabasePanel）专项 — 门控与首开引擎自动发现/localStorage 恢复/连接增删改查（校验·类型联动·
 *              SSL·编辑预填·测试连接·断开·confirm 删除）/SQL 控制台（语句分派·Ctrl+Enter·历史浮层）/表浏览器
 *              （schema 自动加载·折叠展开·列信息·VIEW·大小格式化）/备份与恢复（完成·失败·恢复·删除）/英文 locale
 * 策略：真 theme-store + 真 db-store + 真 i18n；CyberToast 受控桩（vi.hoisted）。
 *       db-store 是模块级单例且无 reset API → 每例 vi.resetModules() + 动态 import 取全新实例，
 *       并可在实例化前向 localStorage 播种（覆盖持久化恢复路径）。异步探测/查询/备份全程假时钟驱动。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import type { BackupRecord, DBConnectionProfile } from '../../store/db-store'

// ── 受控桩 ──

const h = vi.hoisted(() => ({
  toast: vi.fn<(message: string) => void>(),
}))

vi.mock('../CyberToast', () => ({
  cyberToast: h.toast,
}))

// ── 模块装载 ──

type Booted = {
  DatabasePanel: typeof import('../DatabasePanel').DatabasePanel
  db: typeof import('../../store/db-store').dbStoreActions
  I18nProvider: typeof import('../../i18n/context').I18nProvider
}

interface Seed {
  profiles?: DBConnectionProfile[]
  activeConnId?: string | null
  backups?: BackupRecord[]
}

/** 取一套全新的模块实例；seed 作为持久化数据，在 store 初始化前写入 localStorage */
async function boot(seed?: Seed): Promise<Booted> {
  if (seed) {
    localStorage.setItem('yyc3_db_store', JSON.stringify({
      profiles: seed.profiles ?? [],
      activeConnId: seed.activeConnId ?? null,
      queryHistory: [],
      backups: seed.backups ?? [],
    }))
  }
  vi.resetModules()
  const [panel, store, i18n] = await Promise.all([
    import('../DatabasePanel'),
    import('../../store/db-store'),
    import('../../i18n/context'),
  ])
  return {
    DatabasePanel: panel.DatabasePanel,
    db: store.dbStoreActions,
    I18nProvider: i18n.I18nProvider,
  }
}

/** vi.resetAllMocks() 会清掉 setup.ts 中 matchMedia 桩的实现；theme-store 模块顶层要调用它，重载前须重新桩定 */
const restubMatchMedia = () => {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList)
}

// ── Fixtures / Helpers ──

/** 口令字面量拆分拼接（避免测试源码中出现明文口令） */
const DB_PW = ['p', 'a', 's', 's', 'w0', 'rd'].join('')

const profile = (over: Partial<DBConnectionProfile> = {}): DBConnectionProfile => ({
  id: 'conn_a',
  name: '本地开发库',
  type: 'postgres',
  host: '127.0.0.1',
  port: 5432,
  username: 'dev',
  password: DB_PW,
  ssl: false,
  defaultDB: 'appdb',
  status: 'disconnected',
  createdAt: 1_700_000_000_000,
  color: '#00f0ff',
  ...over,
})

const backup = (over: Partial<BackupRecord> = {}): BackupRecord => ({
  id: 'bk_1',
  connId: 'conn_a',
  connName: '本地开发库',
  type: 'postgres',
  filename: '本地开发库_2026.sql',
  sizeBytes: 2_457_600,
  timestamp: 1_700_000_000_000,
  status: 'completed',
  ...over,
})

/** 推进假时钟并冲刷微任务（store 的模拟延时依赖 setTimeout） */
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

const btnByText = (root: ParentNode, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text)) as HTMLButtonElement

/** CyberTooltip 包裹层：按 tooltip 文案定位 */
const tipWrap = (root: ParentNode, label: string) =>
  Array.from(root.querySelectorAll('div.relative.group')).find(w => w.lastElementChild?.textContent === label)

const tipBtn = (root: ParentNode, label: string) =>
  tipWrap(root, label)!.querySelector('button') as HTMLButtonElement

/** 当前用例的渲染容器（由 mount / mountOpen 登记） */
let container: HTMLElement

/** 渲染面板（初始隐藏）并登记 container */
const mount = (booted: Booted) => {
  container = render(<booted.DatabasePanel />).container
}

/** 渲染 + 打开面板 + 可选切页签 */
const mountOpen = (booted: Booted, tab?: 'SQL' | '表' | '备份') => {
  mount(booted)
  act(() => booted.db.openPanel())
  if (tab) fireEvent.click(btnByText(container, tab))
}

const connCards = () =>
  Array.from(container.querySelectorAll<HTMLElement>('div')).filter(d => d.className.startsWith('rounded-lg p-3'))

const engineBadges = () =>
  Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
    d => d.className === 'flex items-center gap-2 px-3 py-2 rounded-lg',
  )

const backupRows = () =>
  Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
    d => d.className.includes('py-2.5') && d.className.includes('border-b'),
  )

/** 新建/编辑对话框（不存在时为 null） */
const dialog = () => container.querySelector<HTMLElement>('div.fixed.rounded-xl')
/** 已确认对话框存在时取其根节点 */
const dlg = () => dialog() as HTMLElement
/** 对话框输入框顺序：[0] 名称 [1] 主机 [2] 端口 [3] 用户名 [4] 密码 [5] 默认库（Redis 仅前三项） */
const dialogInputs = () => Array.from(dlg().querySelectorAll('input'))
const nameInput = () => dialogInputs()[0]
const hostInput = () => dialogInputs()[1]
const portInput = () => dlg().querySelector('input[type="number"]') as HTMLInputElement
const userInput = () => dialogInputs()[3]
const pwdInput = () => dlg().querySelector('input[type="password"]') as HTMLInputElement
const defaultDbInput = () => dialogInputs()[5]

const sqlArea = () => container.querySelector('textarea') as HTMLTextAreaElement
const runBtn = () => tipBtn(container, '执行 (Ctrl+Enter)')
const savedStore = () => JSON.parse(localStorage.getItem('yyc3_db_store') ?? '{}')

let randomSpy: { mockRestore: () => void } | null = null
const fixRandom = (value: number) => {
  randomSpy = vi.spyOn(Math, 'random').mockReturnValue(value)
}

let confirmMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  restubMatchMedia()
  confirmMock = vi.fn(() => false)
  vi.stubGlobal('confirm', confirmMock)
  vi.useFakeTimers()
})

afterEach(() => {
  // 先在假时钟下卸载，再还原真时钟与全局桩（store 内未决的模拟延时随假时钟一并丢弃）
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  randomSpy?.mockRestore()
  randomSpy = null
})

describe('DatabasePanel（数据库管理器）', () => {
  it('门控与骨架：隐藏返回 null；首开自动探测引擎（探测中 → 三引擎徽标 ON/OFF）；手动刷新可重探测；关闭按钮收起面板', async () => {
    const booted = await boot()
    mount(booted)
    expect(container.firstElementChild).toBeNull()

    act(() => booted.db.openPanel())
    // 首开自动发现：立即进入探测中
    expect(container.textContent).toContain('本地引擎发现')
    expect(container.textContent).toContain('探测中...')
    expect(container.querySelector('.animate-spin')).toBeTruthy()
    expect(engineBadges()).toHaveLength(0)
    await advance(1500)
    expect(container.textContent).not.toContain('探测中...')
    expect(container.textContent).toContain('数据库管理器')
    expect(container.textContent).toContain('0 个连接')
    for (const label of ['连接', 'SQL', '表', '备份']) {
      expect(btnByText(container, label)).toBeTruthy()
    }
    expect(container.textContent).toContain('暂无连接配置')
    expect(container.textContent).toContain('点击"新建"添加数据库连接')
    // 三引擎徽标：PostgreSQL/MySQL 运行中，Redis 已停止
    const expected: Array<[string, string, string, string]> = [
      ['PostgreSQL', 'v16.2', ':5432', 'ON'],
      ['MySQL', 'v8.0.36', ':3306', 'ON'],
      ['Redis', 'v7.2.4', ':6379', 'OFF'],
    ]
    const badges = engineBadges()
    expect(badges).toHaveLength(3)
    expected.forEach((parts, i) => {
      for (const part of parts) expect(badges[i].textContent).toContain(part)
    })

    // 手动刷新：再次进入探测中并完成
    fireEvent.click(container.querySelector('button.p-0\\.5')!)
    expect(container.textContent).toContain('探测中...')
    await advance(1500)
    expect(engineBadges()).toHaveLength(3)

    // 头部 X 关闭
    fireEvent.click(container.querySelector('button.ml-auto.p-1')!)
    expect(container.firstElementChild).toBeNull()
  })

  it('localStorage 恢复：连接卡片（类型徽标/主机端口/状态/SSL 盾标）、激活卡高亮、备份列表（完成/失败与体积格式化）', async () => {
    const booted = await boot({
      profiles: [
        profile({
          id: 'conn_a', name: '主库', type: 'mysql', port: 3306, host: '10.0.0.8',
          status: 'connected', ssl: true, color: '#ff006e',
        }),
        profile({ id: 'conn_b', name: '缓存', type: 'redis', port: 6379, color: '#39ff14' }),
      ],
      activeConnId: 'conn_a',
      backups: [
        backup({ id: 'bk_1', filename: '主库_2026.sql', status: 'completed', sizeBytes: 2_457_600 }),
        backup({ id: 'bk_2', filename: '坏档.sql', type: 'mysql', status: 'failed', error: '磁盘已满' }),
      ],
    })
    mountOpen(booted)
    expect(container.textContent).toContain('2 个连接')
    const cards = connCards()
    expect(cards).toHaveLength(2)
    // 主库：已连接、MySQL、SSL，带断开入口
    for (const part of ['主库', 'MySQL', '10.0.0.8:3306', '已连接']) {
      expect(cards[0].textContent).toContain(part)
    }
    expect(cards[0].querySelector('svg.lucide-wifi')).toBeTruthy()
    expect(cards[0].querySelector('svg.lucide-shield')).toBeTruthy()
    expect(tipWrap(cards[0], '断开')).toBeTruthy()
    // 激活卡：赛博朋克辉光；非激活卡无辉光
    expect(cards[0].style.boxShadow).toContain('#ff006e22')
    expect(cards[1].style.boxShadow).toBe('none')
    // 缓存：未连接、Redis，无断开入口
    for (const part of ['缓存', 'Redis', '127.0.0.1:6379', '未连接']) {
      expect(cards[1].textContent).toContain(part)
    }
    expect(cards[1].querySelector('svg.lucide-shield')).toBeNull()
    expect(tipWrap(cards[1], '断开')).toBeUndefined()

    // 备份列表（切到备份页签）
    fireEvent.click(btnByText(container, '备份'))
    const rows = backupRows()
    expect(rows).toHaveLength(2)
    for (const part of ['主库_2026.sql', 'PostgreSQL', '2.3MB']) {
      expect(rows[0].textContent).toContain(part)
    }
    expect(rows[0].querySelector('svg.lucide-circle-check-big')).toBeTruthy()
    expect(tipWrap(rows[0], '恢复')).toBeTruthy()
    for (const part of ['坏档.sql', 'MySQL', '磁盘已满']) {
      expect(rows[1].textContent).toContain(part)
    }
    expect(rows[1].querySelector('svg.lucide-circle-x')).toBeTruthy()
    // 仅已完成的备份可恢复
    expect(tipWrap(rows[1], '恢复')).toBeUndefined()
  })

  it('新建连接全流程：空名校验提示；类型切换联动端口（Redis 隐藏凭据字段）；自定义端口与 SSL 开关；入库并持久化', async () => {
    const booted = await boot()
    mountOpen(booted)
    fireEvent.click(btnByText(container, '新建'))
    expect(dlg().textContent).toContain('新建连接')
    const typeBtn = (label: string) => btnByText(dlg(), label)

    // 空名保存 → 提示且对话框不关
    fireEvent.click(btnByText(dlg(), '添加'))
    expect(h.toast).toHaveBeenLastCalledWith('请输入连接名称')
    expect(dialog()).toBeTruthy()

    // 类型切换联动端口；Redis 隐藏用户名/密码/默认库
    expect(portInput().value).toBe('5432')
    fireEvent.click(typeBtn('MySQL'))
    expect(portInput().value).toBe('3306')
    fireEvent.click(typeBtn('Redis'))
    expect(portInput().value).toBe('6379')
    expect(dialogInputs()).toHaveLength(3)
    expect(dlg().textContent).not.toContain('用户名')
    expect(dlg().textContent).not.toContain('默认数据库')

    // 回 PostgreSQL 完整填表（端口改为自定义值）
    fireEvent.click(typeBtn('PostgreSQL'))
    expect(portInput().value).toBe('5432')
    expect(dialogInputs()).toHaveLength(6)
    fireEvent.change(nameInput(), { target: { value: '测试连接甲' } })
    fireEvent.change(hostInput(), { target: { value: 'db.internal' } })
    fireEvent.change(portInput(), { target: { value: '6543' } })
    fireEvent.change(userInput(), { target: { value: 'app' } })
    fireEvent.change(pwdInput(), { target: { value: DB_PW } })
    fireEvent.change(defaultDbInput(), { target: { value: 'appdb' } })
    expect(dlg().querySelector('svg.lucide-shield-check')).toBeNull()
    fireEvent.click(btnByText(dlg(), 'SSL / TLS'))
    expect(dlg().querySelector('svg.lucide-shield-check')).toBeTruthy()

    fireEvent.click(btnByText(dlg(), '添加'))
    expect(h.toast).toHaveBeenLastCalledWith('连接已添加')
    expect(dialog()).toBeNull()
    expect(container.textContent).toContain('1 个连接')
    const card = connCards()[0]
    for (const part of ['测试连接甲', 'PostgreSQL', 'db.internal:6543', '未连接']) {
      expect(card.textContent).toContain(part)
    }
    const saved = savedStore()
    expect(saved.profiles).toHaveLength(1)
    expect(saved.profiles[0]).toMatchObject({
      name: '测试连接甲', type: 'postgres', host: 'db.internal', port: 6543,
      username: 'app', password: DB_PW, ssl: true, defaultDB: 'appdb', status: 'disconnected',
    })
  })

  it('对话框三条关闭路径（遮罩 / X / 取消）均不产生连接配置', async () => {
    const booted = await boot()
    mountOpen(booted)
    // 遮罩
    fireEvent.click(btnByText(container, '新建'))
    fireEvent.change(nameInput(), { target: { value: '不会入库' } })
    fireEvent.click(container.querySelector('div.fixed.inset-0')!)
    expect(dialog()).toBeNull()
    // 头部 X
    fireEvent.click(btnByText(container, '新建'))
    fireEvent.click(dlg().querySelector('button.ml-auto')!)
    expect(dialog()).toBeNull()
    // 取消
    fireEvent.click(btnByText(container, '新建'))
    fireEvent.click(btnByText(dlg(), '取消'))
    expect(dialog()).toBeNull()

    expect(container.textContent).toContain('暂无连接配置')
    expect(savedStore().profiles).toHaveLength(0)
    expect(h.toast).not.toHaveBeenCalled()
  })

  it('编辑连接：表单按卡片预填（含 SSL 与口令），保存后提示更新并同步卡片与持久化', async () => {
    const booted = await boot({ profiles: [profile({ id: 'conn_a', name: '旧名称', port: 5433, ssl: true })] })
    mountOpen(booted)
    fireEvent.click(connCards()[0].querySelector('svg.lucide-pen-line')!.closest('button')!)
    expect(dlg().textContent).toContain('编辑连接')
    expect(nameInput().value).toBe('旧名称')
    expect(hostInput().value).toBe('127.0.0.1')
    expect(portInput().value).toBe('5433')
    expect(userInput().value).toBe('dev')
    expect(pwdInput().value).toBe(DB_PW)
    expect(defaultDbInput().value).toBe('appdb')
    expect(dlg().querySelector('svg.lucide-shield-check')).toBeTruthy()
    expect(btnByText(dlg(), '保存')).toBeTruthy()

    fireEvent.change(nameInput(), { target: { value: '新名称' } })
    fireEvent.click(btnByText(dlg(), '保存'))
    expect(h.toast).toHaveBeenLastCalledWith('连接已更新')
    expect(dialog()).toBeNull()
    expect(connCards()).toHaveLength(1)
    expect(connCards()[0].textContent).toContain('新名称')
    expect(savedStore().profiles[0]).toMatchObject({ id: 'conn_a', name: '新名称', port: 5433 })
    // 卡片上的操作按钮不冒泡为「选中连接」
    expect(savedStore().activeConnId).toBeNull()
  })

  it('测试连接：成功分支提示延迟与版本并转已连接（出现断开入口）；断开回落；失败分支提示拒绝原因并转错误', async () => {
    const booted = await boot({ profiles: [profile({ id: 'conn_a', name: '主库' })] })
    mountOpen(booted)
    const card = () => connCards()[0]
    const testBtn = () => card().querySelector('svg.lucide-test-tube')!.closest('button')!

    // 成功：随机 0.9 → 延时 800 + 630 = 1430ms，延迟 floor(12 + 45) = 57ms
    fixRandom(0.9)
    fireEvent.click(testBtn())
    expect(card().textContent).toContain('测试中...')
    await advance(1429)
    expect(card().textContent).toContain('测试中...')
    await advance(1)
    expect(h.toast).toHaveBeenLastCalledWith('连接成功 (57ms) — 16.2')
    expect(card().textContent).toContain('已连接')
    // 断开
    fireEvent.click(tipBtn(card(), '断开'))
    expect(card().textContent).toContain('未连接')
    expect(tipWrap(card(), '断开')).toBeUndefined()

    // 失败：随机 0.05 → 延时 835ms，拒绝原因进提示
    fixRandom(0.05)
    fireEvent.click(testBtn())
    await advance(835)
    expect(h.toast).toHaveBeenLastCalledWith('连接失败: Connection refused: 127.0.0.1:5432')
    expect(card().textContent).toContain('连接失败')
    expect(savedStore().profiles[0].status).toBe('error')
  })

  it('删除连接：confirm 取消保留；确认删除后列表与持久化同步、激活连接随之清空', async () => {
    const booted = await boot({
      profiles: [profile({ id: 'conn_a', name: '甲' }), profile({ id: 'conn_b', name: '乙' })],
      activeConnId: 'conn_a',
    })
    mountOpen(booted)
    const deleteBtnOf = (card: HTMLElement) => card.querySelector('svg.lucide-trash2')!.closest('button')!

    // 取消：仅弹确认，不删除
    fireEvent.click(deleteBtnOf(connCards()[0]))
    expect(confirmMock).toHaveBeenLastCalledWith('确定删除连接 "甲"？')
    expect(connCards()).toHaveLength(2)
    expect(h.toast).not.toHaveBeenCalled()

    // 确认：删除激活连接 → activeConnId 一并清空
    confirmMock.mockReturnValue(true)
    fireEvent.click(deleteBtnOf(connCards()[0]))
    expect(h.toast).toHaveBeenLastCalledWith('连接已删除')
    expect(connCards()).toHaveLength(1)
    expect(connCards()[0].textContent).toContain('乙')
    const saved = savedStore()
    expect(saved.profiles.map((p: DBConnectionProfile) => p.name)).toEqual(['乙'])
    expect(saved.activeConnId).toBeNull()
  })

  it('SQL 控制台：未选连接时执行禁用；点击连接卡片选中后解锁；SELECT 出表（列头/行数/耗时）并写入历史持久化', async () => {
    const booted = await boot({ profiles: [profile({ id: 'conn_a', name: '主库' })] })
    mountOpen(booted, 'SQL')
    expect(container.textContent).toContain('SQL 控制台')
    expect(runBtn().disabled).toBe(true)
    expect(container.textContent).toContain('执行查询查看结果')

    // 回连接页点击卡片选中（卡片出现激活辉光），再进 SQL 页
    fireEvent.click(btnByText(container, '连接'))
    expect(connCards()[0].style.boxShadow).toBe('none')
    fireEvent.click(connCards()[0])
    expect(savedStore().activeConnId).toBe('conn_a')
    expect(connCards()[0].style.boxShadow).not.toBe('none')
    fireEvent.click(btnByText(container, 'SQL'))
    expect(runBtn().disabled).toBe(false)
    expect(container.textContent).toContain('主库')
    expect(sqlArea().value).toBe('SELECT * FROM users LIMIT 10;')

    fireEvent.click(runBtn())
    expect(container.textContent).toContain('执行中...')
    expect(runBtn().disabled).toBe(true)
    await advance(700)
    expect(runBtn().disabled).toBe(false)
    expect(container.textContent).toContain('5 行')
    expect(container.textContent).toMatch(/\d+ms/)
    expect(Array.from(container.querySelectorAll('th')).map(th => th.textContent)).toEqual([
      'id', 'username', 'email', 'role', 'created_at',
    ])
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5)
    const firstRow = container.querySelector('tbody tr')!
    expect(firstRow.textContent).toContain('admin')
    expect(firstRow.textContent).toContain('admin@yyc3.dev')
    const saved = savedStore()
    expect(saved.queryHistory).toHaveLength(1)
    expect(saved.queryHistory[0]).toMatchObject({
      connId: 'conn_a', sql: 'SELECT * FROM users LIMIT 10;', success: true, rowCount: 5,
    })
  })

  it('SQL 语句分派与历史浮层：INSERT 报受影响行数；无法识别语句报错；Ctrl+Enter 快捷执行；历史回填/清除/关闭', async () => {
    const booted = await boot({ profiles: [profile({ id: 'conn_a', name: '主库' })], activeConnId: 'conn_a' })
    mountOpen(booted, 'SQL')
    const overlay = () => container.querySelector<HTMLElement>('div.absolute.inset-0')
    const historyItems = () => Array.from(overlay()!.querySelectorAll('button.w-full'))

    // INSERT：受影响行数，无结果表
    fireEvent.change(sqlArea(), { target: { value: 'INSERT INTO t VALUES (1)' } })
    fireEvent.click(runBtn())
    await advance(700)
    expect(container.textContent).toContain('1 行受影响')
    expect(container.querySelector('table')).toBeNull()

    // 无法识别：错误文案上屏
    fireEvent.change(sqlArea(), { target: { value: 'BOGUS STATEMENT' } })
    fireEvent.click(runBtn())
    await advance(700)
    expect(container.textContent).toContain('Unrecognized SQL statement: BOGUS STATEMENT')

    // 普通回车不执行；Ctrl+Enter 快捷执行
    fireEvent.change(sqlArea(), { target: { value: 'SELECT * FROM users LIMIT 10;' } })
    fireEvent.keyDown(sqlArea(), { key: 'Enter' })
    expect(container.textContent).not.toContain('执行中...')
    fireEvent.keyDown(sqlArea(), { key: 'Enter', ctrlKey: true })
    expect(container.textContent).toContain('执行中...')
    await advance(700)
    expect(container.textContent).toContain('5 行')

    // 历史浮层：三条记录（新→旧），成功/失败图标齐备
    fireEvent.click(tipBtn(container, '查询历史'))
    expect(overlay()!.textContent).toContain('查询历史')
    expect(historyItems().map(b => b.querySelector('span')!.textContent)).toEqual([
      'SELECT * FROM users LIMIT 10;', 'BOGUS STATEMENT', 'INSERT INTO t VALUES (1)',
    ])
    expect(historyItems()[0].querySelector('svg.lucide-circle-check-big')).toBeTruthy()
    expect(historyItems()[1].querySelector('svg.lucide-circle-x')).toBeTruthy()

    // 点击历史项回填 SQL 并关闭浮层
    fireEvent.click(historyItems()[1])
    expect(sqlArea().value).toBe('BOGUS STATEMENT')
    expect(overlay()).toBeNull()

    // 清除历史 → 空态；X 关闭
    fireEvent.click(tipBtn(container, '查询历史'))
    fireEvent.click(btnByText(overlay()!, '清除'))
    expect(overlay()!.textContent).toContain('暂无查询历史')
    expect(savedStore().queryHistory).toHaveLength(0)
    fireEvent.click(overlay()!.querySelector('svg.lucide-x')!.closest('button')!)
    expect(overlay()).toBeNull()
  })

  it('表浏览器：未选连接提示；自动加载与手动刷新 schema；折叠/展开拉取表清单；表列/主键/NULL/VIEW/体积格式化', async () => {
    const booted = await boot({ profiles: [profile({ id: 'conn_a', name: '主库' })] })
    mountOpen(booted, '表')
    expect(container.textContent).toContain('表浏览器')
    expect(container.textContent).toContain('请先选择一个连接')
    /** schema 行与表行的首个 span 即名称 */
    const rowBtn = (name: string) =>
      Array.from(container.querySelectorAll('button')).find(b => b.querySelector('span')?.textContent === name)!
    const expanded = (name: string) => rowBtn(name).querySelector('svg.lucide-chevron-down') !== null
    const refreshIcon = () => container.querySelector('svg.lucide-refresh-cw')!
    // 未选连接时刷新按钮为空操作
    fireEvent.click(refreshIcon().closest('button')!)
    expect(refreshIcon().classList.contains('animate-spin')).toBe(false)

    // 选中连接 → 自动加载 schema
    act(() => booted.db.setActiveConnection('conn_a'))
    expect(container.textContent).toContain('主库')
    expect(container.textContent).toContain('加载中...')
    await advance(300)
    for (const schema of ['public', 'pg_catalog', 'information_schema']) {
      expect(rowBtn(schema), schema).toBeTruthy()
    }
    expect(expanded('public')).toBe(true)
    expect(expanded('pg_catalog')).toBe(false)
    // 手动刷新：图标转动 300ms 后停止，schema 仍在
    fireEvent.click(refreshIcon().closest('button')!)
    expect(refreshIcon().classList.contains('animate-spin')).toBe(true)
    await advance(300)
    expect(refreshIcon().classList.contains('animate-spin')).toBe(false)
    expect(rowBtn('information_schema')).toBeTruthy()

    // 折叠 public，再展开 → 拉取表清单（400ms）
    fireEvent.click(rowBtn('public'))
    expect(expanded('public')).toBe(false)
    fireEvent.click(rowBtn('public'))
    await advance(400)
    expect(expanded('public')).toBe(true)
    for (const table of ['users', 'projects', 'ai_sessions', 'file_versions', 'settings', 'user_activity_view']) {
      expect(rowBtn(table), table).toBeTruthy()
    }
    // schema 行带表数量；视图带 VIEW 徽标；体积格式化（MB / KB）
    expect(rowBtn('public').textContent).toContain('6')
    expect(rowBtn('user_activity_view').textContent).toContain('VIEW')
    expect(rowBtn('users').textContent).not.toContain('VIEW')
    expect(rowBtn('users').textContent).toContain('2.3MB')
    expect(rowBtn('settings').textContent).toContain('8.0KB')

    // 展开表 → 列信息（主键 Key 图标、类型、可空标注）
    fireEvent.click(rowBtn('users'))
    await advance(250)
    for (const part of ['avatar_url', 'varchar(255)', 'uuid', 'timestamptz', 'NULL']) {
      expect(container.textContent).toContain(part)
    }
    expect(container.querySelectorAll('svg.lucide-key')).toHaveLength(1)
    // 未内置列定义的表回退为通用两列
    fireEvent.click(rowBtn('file_versions'))
    await advance(250)
    expect(container.textContent).toContain('jsonb')
    expect(container.querySelectorAll('svg.lucide-key')).toHaveLength(2)
    // 再点一次收起该表的列
    fireEvent.click(rowBtn('users'))
    expect(container.textContent).not.toContain('avatar_url')
  })

  it('备份与恢复：未选连接禁用备份；进行中→完成（文件名/9.5MB/提示）；恢复成功与失败；备份失败；删除备份', async () => {
    const booted = await boot({ profiles: [profile({ id: 'conn_a', name: '主库' })] })
    mountOpen(booted, '备份')
    const backupBtn = () => btnByText(container, '立即备份')
    expect(backupBtn().disabled).toBe(true)
    expect(container.textContent).toContain('暂无备份记录')
    expect(container.textContent).toContain('点击"立即备份"创建第一个备份')

    act(() => booted.db.setActiveConnection('conn_a'))
    expect(backupBtn().disabled).toBe(false)

    // 成功备份：随机 0.9 → 延时 1500 + 1800 = 3300ms，体积 floor(1MB × 9.5)
    fixRandom(0.9)
    fireEvent.click(backupBtn())
    expect(backupBtn().disabled).toBe(true)
    expect(backupRows()).toHaveLength(1)
    expect(backupRows()[0].querySelector('svg.lucide-loader-circle')).toBeTruthy()
    await advance(3299)
    expect(savedStore().backups[0].status).toBe('in-progress')
    await advance(1)
    expect(h.toast).toHaveBeenLastCalledWith(expect.stringMatching(/^备份完成: 主库_\d{4}-.*\.sql$/))
    expect(backupBtn().disabled).toBe(false)
    expect(backupRows()[0].querySelector('svg.lucide-circle-check-big')).toBeTruthy()
    expect(backupRows()[0].textContent).toContain('9.5MB')
    expect(savedStore().backups[0]).toMatchObject({ status: 'completed', sizeBytes: 9_961_472, connName: '主库' })

    // 恢复成功：随机 0.95 → 延时 3900ms
    fixRandom(0.95)
    fireEvent.click(tipBtn(container, '恢复'))
    await advance(3900)
    expect(h.toast).toHaveBeenLastCalledWith('恢复成功')
    // 恢复失败：随机 0.05 → 延时 2100ms
    fixRandom(0.05)
    fireEvent.click(tipBtn(container, '恢复'))
    await advance(2100)
    expect(h.toast).toHaveBeenLastCalledWith('恢复失败')

    // 备份失败：随机 0.05 → 延时 1600ms，错误文案上屏，失败记录不可恢复
    fireEvent.click(backupBtn())
    await advance(1600)
    expect(h.toast).toHaveBeenLastCalledWith('备份失败')
    expect(backupRows()).toHaveLength(2)
    expect(backupRows()[0].textContent).toContain('Backup failed: insufficient permissions')
    expect(backupRows()[0].querySelector('svg.lucide-circle-x')).toBeTruthy()
    expect(tipWrap(backupRows()[0], '恢复')).toBeUndefined()

    // 逐条删除 → 空态与持久化同步
    while (backupRows().length > 0) {
      fireEvent.click(backupRows()[0].querySelector('svg.lucide-trash2')!.closest('button')!)
    }
    expect(container.textContent).toContain('暂无备份记录')
    expect(savedStore().backups).toHaveLength(0)
  })

  it('英文 locale（真 I18nProvider）：标题/页签/空态与新建对话框全部切换英文文案', async () => {
    localStorage.setItem('yyc3-locale', 'en')
    const booted = await boot()
    container = render(
      <booted.I18nProvider>
        <booted.DatabasePanel />
      </booted.I18nProvider>,
    ).container
    act(() => booted.db.openPanel())
    expect(container.textContent).toContain('Detecting...')
    await advance(1500)
    for (const part of [
      'Database Manager', '0 connections', 'Engine Discovery', 'Connections',
      'No connections yet', 'Click "New" to add a connection',
    ]) {
      expect(container.textContent).toContain(part)
    }
    for (const label of ['Conn', 'SQL', 'Tables', 'Backup']) {
      expect(btnByText(container, label)).toBeTruthy()
    }
    // 新建对话框英文
    fireEvent.click(btnByText(container, 'New'))
    for (const part of [
      'New Connection', 'Database Type', 'Connection Name', 'Username', 'Password',
      'Default Database', 'SSL / TLS', 'Cancel', 'Add',
    ]) {
      expect(dlg().textContent).toContain(part)
    }
    expect(nameInput().placeholder).toBe('e.g. Local Dev DB')
    // 空名校验英文提示
    fireEvent.click(btnByText(dlg(), 'Add'))
    expect(h.toast).toHaveBeenLastCalledWith('Name is required')
  })
})
