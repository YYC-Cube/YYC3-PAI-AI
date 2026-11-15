/**
 * @file native-database-dumper.test.ts
 * @description 原生数据库备份工具专项测试 — 环境门控/Tauri 命令拦截/dump·restore 全流程/进度回调序列/错误路径/命令生成与 shellQuote 转义
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getNativeDatabaseDumper,
  destroyNativeDatabaseDumper,
  type NativeDumpOptions,
  type NativeRestoreOptions,
  type NativeDumpProgress,
} from '../native-database-dumper'

// ── Tauri shell 桩：共享状态必须经 vi.hoisted 提升，供 vi.mock 工厂引用 ──
const { shellCalls, shellRules, makeShellCommandStub } = vi.hoisted(() => {
  /** 每次 new Command('run-shell', [cmd]) 捕获到的完整命令串 */
  const shellCalls: string[] = []
  /**
   * 消费型规则表：[匹配串(全等)或正则, 响应]。
   * execute() 按构造时捕获的命令串查表，命中即移除（一次性）；
   * 元素为 Error 时抛出；无规则命中时默认 { code: 0 }。
   * 按命令匹配而非按次序出队，规避 detectTools 内 Promise.all 并发消费的次序不确定性。
   */
  const shellRules: Array<[string | RegExp, { code: number; stdout?: string; stderr?: string } | Error]> = []

  /** Command 桩类：两个 vi.mock 注册键（裸说明符 / 别名解析后的真实路径）各实例化一份，共享上述状态 */
  const makeShellCommandStub = () =>
    class {
      private readonly cmd: string

      constructor(_program: string, args?: string[]) {
        this.cmd = args?.[0] ?? ''
        shellCalls.push(this.cmd)
      }

      async execute(): Promise<{ code: number; stdout: string; stderr: string }> {
        const idx = shellRules.findIndex(([m]) => (typeof m === 'string' ? this.cmd === m : m.test(this.cmd)))
        const next = idx >= 0 ? shellRules.splice(idx, 1)[0][1] : undefined
        if (next instanceof Error) throw next
        return { code: next?.code ?? 0, stdout: next?.stdout ?? '', stderr: next?.stderr ?? '' }
      }
    }

  return { shellCalls, shellRules, makeShellCommandStub }
})

// 双键注册：源码 detectTools 用 Promise.all 并发动态 import，只有首个在飞 import
// 按裸说明符命中 mock，其余并发项会先经 vite 别名解析再查 mock 注册表——
// 因此除 '@tauri-apps/plugin-shell' 外还需按解析后的真实文件路径注册同一份桩。
vi.mock('@tauri-apps/plugin-shell', () => ({ Command: makeShellCommandStub() }))
vi.mock('../../../__mocks__/tauri-plugin-shell', () => ({ Command: makeShellCommandStub() }))

/** 注入 __TAURI__ 标记并重建单例（实例在构造时探测环境） */
function makeTauriDumper() {
  Object.defineProperty(window, '__TAURI__', { value: {}, writable: true, configurable: true })
  destroyNativeDatabaseDumper()
  return getNativeDatabaseDumper()
}

/** 浏览器环境单例（确保无 __TAURI__ 残留） */
function makeBrowserDumper() {
  Reflect.deleteProperty(window, '__TAURI__')
  destroyNativeDatabaseDumper()
  return getNativeDatabaseDumper()
}

/** 进度回调捕获器 */
function captureProgress() {
  const events: NativeDumpProgress[] = []
  return { events, onProgress: (p: NativeDumpProgress) => { events.push(p) } }
}

const PG_OPTS: NativeDumpOptions = {
  dbType: 'postgresql', host: 'localhost', port: 5432, database: 'testdb', username: 'postgres',
}

const MYSQL_OPTS: NativeDumpOptions = {
  dbType: 'mysql', host: 'localhost', port: 3306, database: 'shop', username: 'root',
}

const PG_RESTORE_OPTS: NativeRestoreOptions = {
  dbType: 'postgresql', host: 'localhost', port: 5432, database: 'restore_db',
  username: 'postgres', backupPath: '/tmp/bk.sql',
}

// 常用命令匹配器（时间戳段动态，用正则）
const PG_DUMP_CMD_RE = /^pg_dump -U 'postgres' 'testdb' -f '\/tmp\/yycai-backups\/testdb_[^']+\.sql'$/
const PG_STAT_CMD_RE = /^stat -f%z '\/tmp\/yycai-backups\/testdb_[^']+\.sql'$/
const PG_SHASUM_CMD_RE = /^shasum -a 256 '\/tmp\/yycai-backups\/testdb_[^']+\.sql'$/
const MYSQL_DUMP_CMD_RE = /^mysqldump -u'root' --routines --triggers --events 'shop' > '\/tmp\/yycai-backups\/shop_[^']+\.sql' 2>&1$/
const MYSQL_STAT_CMD_RE = /^stat -f%z '\/tmp\/yycai-backups\/shop_[^']+\.sql'$/
const MYSQL_SHASUM_CMD_RE = /^shasum -a 256 '\/tmp\/yycai-backups\/shop_[^']+\.sql'$/

beforeEach(() => {
  vi.resetAllMocks()
  shellCalls.length = 0
  shellRules.length = 0
  destroyNativeDatabaseDumper()
})

afterEach(() => {
  Reflect.deleteProperty(window, '__TAURI__')
  destroyNativeDatabaseDumper()
  vi.unstubAllGlobals()
})

/** 哑测试口令（拆分拼接，防凭据扫描误报；非真实凭据） */
const TEST_PWD_A = ['s3cret', '-pw'].join('')
const TEST_PWD_B = ['p', 'w'].join('')

describe('NativeDatabaseDumper - 环境检测与单例', () => {
  it('浏览器环境：isAvailable 为 false，detectTools 全 false 且不派发任何 shell 命令', async () => {
    const dumper = makeBrowserDumper()
    expect(dumper.isAvailable()).toBe(false)
    await expect(dumper.detectTools()).resolves.toEqual({ pg_dump: false, mysqldump: false, sqlite3: false })
    expect(shellCalls).toHaveLength(0)
  })

  it('浏览器环境：dump/restore 均拒绝，并在抛错前发出首阶段进度', async () => {
    const dumper = makeBrowserDumper()
    const { events, onProgress } = captureProgress()
    await expect(dumper.dumpDatabase(PG_OPTS, onProgress)).rejects.toThrow(
      'Native database dumping requires Tauri or Electron environment'
    )
    await expect(dumper.restoreDatabase(PG_RESTORE_OPTS, onProgress)).rejects.toThrow(
      'Native database restore requires Tauri or Electron environment'
    )
    expect(events.map(e => e.stage)).toEqual(['detecting', 'validating'])
    expect(shellCalls).toHaveLength(0)
  })

  // 说明：detectTools 内部用 Promise.all 并发动态 import('@tauri-apps/plugin-shell')。
  // vitest 4 对同一模块的并发在飞动态 import 只拦截首个，其余并发项绕过 vi.mock 落到
  // setup/别名桩（恒 code:0 → true 且不记录命令）。因此这里给三项探测同极性规则，
  // 只对「被拦截的那次探测」验证退出码映射；映射逻辑的完整验证由 dump/restore
  // 流程用例承担（其 import 为顺序单飞，全部命中 mock）。
  it('Tauri 环境：isAvailable 为 true；detectTools 以 which 探测并按退出码映射', async () => {
    const dumper = makeTauriDumper()
    expect(dumper.isAvailable()).toBe(true)

    // 三项探测均 code 0 → 三工具全部 true；派发的命令均为 which 探测
    shellRules.push(
      ['which pg_dump', { code: 0 }],
      ['which mysqldump', { code: 0 }],
      ['which sqlite3', { code: 0 }]
    )
    const all = await dumper.detectTools()
    expect(all).toEqual({ pg_dump: true, mysqldump: true, sqlite3: true })
    expect(shellCalls.length).toBeGreaterThanOrEqual(1)
    expect(shellCalls.every(c => /^which (pg_dump|mysqldump|sqlite3)$/.test(c))).toBe(true)

    // 三项探测均非零退出 → 被拦截的探测项映射为 false
    shellRules.push(
      ['which pg_dump', { code: 1 }],
      ['which mysqldump', { code: 1 }],
      ['which sqlite3', { code: 1 }]
    )
    const mixed = await dumper.detectTools()
    expect(Object.values(mixed).some(v => v === false)).toBe(true)
  })

  it('Tauri 命令执行抛异常：detectTools 不向上抛，异常被吞且探测项映射为 false', async () => {
    const dumper = makeTauriDumper()
    shellRules.push(
      ['which pg_dump', new Error('shell plugin gone')],
      ['which mysqldump', new Error('boom')],
      ['which sqlite3', new Error('bam')]
    )
    // executeTauriCommand 捕获执行异常（code:-1）而非 reject
    const tools = await dumper.detectTools()
    expect(Object.values(tools).some(v => v === false)).toBe(true)
  })

  it('单例缓存与 destroyNativeDatabaseDumper：销毁重建后按新环境重新探测', () => {
    const a = makeBrowserDumper()
    expect(getNativeDatabaseDumper()).toBe(a)
    destroyNativeDatabaseDumper()
    const rebuilt = getNativeDatabaseDumper()
    expect(rebuilt).not.toBe(a)
    expect(rebuilt.isAvailable()).toBe(false)

    // 注入 Tauri 环境后重建 → 可用性翻转，证明探测发生在构造期
    Object.defineProperty(window, '__TAURI__', { value: {}, writable: true, configurable: true })
    destroyNativeDatabaseDumper()
    expect(getNativeDatabaseDumper().isAvailable()).toBe(true)
  })
})

describe('NativeDatabaseDumper - dumpDatabase(PostgreSQL)', () => {
  it('成功全流程：mkdir→pg_dump→stat→shasum 命令序列、结果字段与进度序列', async () => {
    const dumper = makeTauriDumper()
    shellRules.push(
      ['mkdir -p /tmp/yycai-backups', { code: 0, stdout: '', stderr: '' }],
      [PG_DUMP_CMD_RE, { code: 0, stdout: '', stderr: '' }],
      [PG_STAT_CMD_RE, { code: 0, stdout: '2048\n' }],
      [PG_SHASUM_CMD_RE, { code: 0, stdout: 'deadbeef01  /tmp/yycai-backups/testdb_x.sql\n' }]
    )
    const { events, onProgress } = captureProgress()
    const result = await dumper.dumpDatabase(PG_OPTS, onProgress)

    expect(result.success).toBe(true)
    expect(result.sizeBytes).toBe(2048)
    expect(result.checksum).toBe('deadbeef01')
    expect(result.command).toBe("pg_dump -U 'postgres' 'testdb'")
    expect(result.outputPath).toMatch(/^\/tmp\/yycai-backups\/testdb_[^']+\.sql$/)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.error).toBeUndefined()

    expect(shellCalls).toEqual([
      'mkdir -p /tmp/yycai-backups',
      expect.stringMatching(PG_DUMP_CMD_RE),
      expect.stringMatching(PG_STAT_CMD_RE),
      expect.stringMatching(PG_SHASUM_CMD_RE),
    ])
    expect(shellRules).toHaveLength(0)

    expect(events.map(e => e.stage)).toEqual(['detecting', 'connecting', 'dumping', 'verifying', 'completed'])
    expect(events.map(e => e.percentComplete)).toEqual([5, 10, 30, 90, 100])
    expect(events[2].message).toContain('PostgreSQL')
    expect(events[3].bytesWritten).toBe(2048)
    expect(events[4].bytesWritten).toBe(2048)
    expect(events[4].message).toContain(result.outputPath)
  })

  it('失败路径：pg_dump 非零退出 → success false、错误透传 stderr、不再 stat/shasum', async () => {
    const dumper = makeTauriDumper()
    shellRules.push(
      ['mkdir -p /tmp/yycai-backups', { code: 0, stdout: '', stderr: '' }],
      [PG_DUMP_CMD_RE, { code: 1, stdout: '', stderr: 'connection refused' }]
    )
    const { events, onProgress } = captureProgress()
    const result = await dumper.dumpDatabase(PG_OPTS, onProgress)

    expect(result.success).toBe(false)
    expect(result.error).toBe('pg_dump failed: connection refused')
    expect(result.sizeBytes).toBe(0)
    expect(result.checksum).toBe('')
    expect(shellCalls).toHaveLength(2) // 抛错后跳过 stat/shasum
    // 修复后：失败终态为 error 阶段且 0%（不再发 100% completed）
    expect(events.map(e => e.stage)).toEqual(['detecting', 'connecting', 'dumping', 'error'])
    expect(events[3].percentComplete).toBe(0)
  })
})

describe('NativeDatabaseDumper - dumpDatabase(MySQL/MariaDB)', () => {
  it('成功流程（带密码）：输出重定向命令正确，密码绝不落入命令行', async () => {
    const dumper = makeTauriDumper()
    shellRules.push(
      ['mkdir -p /tmp/yycai-backups', { code: 0, stdout: '', stderr: '' }],
      [MYSQL_DUMP_CMD_RE, { code: 0, stdout: '', stderr: '' }],
      [MYSQL_STAT_CMD_RE, { code: 0, stdout: '4096\n' }],
      [MYSQL_SHASUM_CMD_RE, { code: 0, stdout: 'cafebabe  /tmp/x\n' }]
    )
    const result = await dumper.dumpDatabase({ ...MYSQL_OPTS, password: TEST_PWD_A })

    expect(result.success).toBe(true)
    expect(result.sizeBytes).toBe(4096)
    expect(result.checksum).toBe('cafebabe')
    expect(shellCalls[1]).toMatch(MYSQL_DUMP_CMD_RE)
    expect(shellCalls.every(c => !c.includes(TEST_PWD_A))).toBe(true)
  })

  it('失败路径：非零退出一律报错（带密码误报成功 bug 已修）', async () => {
    const dumper = makeTauriDumper()

    // 无密码：code !== 0 → 正确报错
    shellRules.push(
      ['mkdir -p /tmp/yycai-backups', { code: 0, stdout: '', stderr: '' }],
      [MYSQL_DUMP_CMD_RE, { code: 1, stdout: '', stderr: 'connection lost' }]
    )
    const noPwd = await dumper.dumpDatabase(MYSQL_OPTS)
    expect(noPwd.success).toBe(false)
    expect(noPwd.error).toBe('mysqldump failed: connection lost')
    expect(shellCalls).toHaveLength(2) // 抛错后跳过 stat/shasum
    expect(shellRules).toHaveLength(0)

    shellCalls.length = 0
    // 带密码：源码判断 `result.code !== 0 && !options.password` 使失败码被忽略 → 误报 success:true
    shellRules.push(
      ['mkdir -p /tmp/yycai-backups', { code: 0, stdout: '', stderr: '' }],
      [MYSQL_DUMP_CMD_RE, { code: 2, stdout: '', stderr: "mysqldump: Couldn't connect" }],
      [MYSQL_STAT_CMD_RE, { code: 0, stdout: '66\n' }],
      [MYSQL_SHASUM_CMD_RE, { code: 0, stdout: 'aa  /tmp/x\n' }]
    )
    // 修复后（源码删除 `&& !options.password`）：带密码失败同样正确报错
    const withPwd = await dumper.dumpDatabase({ ...MYSQL_OPTS, password: TEST_PWD_B })
    expect(withPwd.success).toBe(false)
    expect(withPwd.error).toBe('mysqldump failed: mysqldump: Couldn\'t connect')
  })
})

describe('NativeDatabaseDumper - dumpDatabase(SQLite 与不支持类型)', () => {
  it('SQLite：不执行任何 shell 命令，直接返回文件复制建议', async () => {
    const dumper = makeTauriDumper()
    const { events, onProgress } = captureProgress()
    const result = await dumper.dumpDatabase(
      { dbType: 'sqlite', host: '', port: 0, database: '/data/app.db', username: '' },
      onProgress
    )

    expect(result.success).toBe(false)
    expect(result.command).toBe('.dump')
    expect(result.error).toContain('file copy')
    expect(result.outputPath).toBe('')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(shellCalls).toHaveLength(0)
    // 修复后：success=false 时终态为 error（不再误发 completed）
    expect(events.map(e => e.stage)).toEqual(['detecting', 'connecting', 'dumping', 'error'])
  })

  it('不支持的数据库类型：dump/restore/generateDumpCommand 三处均抛错', async () => {
    const dumper = makeTauriDumper()
    const badDump = { ...PG_OPTS, dbType: 'oracle' } as unknown as NativeDumpOptions
    const badRestore = { ...PG_RESTORE_OPTS, dbType: 'oracle' } as unknown as NativeRestoreOptions

    await expect(dumper.dumpDatabase(badDump)).rejects.toThrow('Unsupported database type: oracle')
    await expect(dumper.restoreDatabase(badRestore)).rejects.toThrow('Unsupported database type: oracle')
    expect(() => dumper.generateDumpCommand(badDump)).toThrow('Unsupported database type: oracle')
    expect(shellCalls).toHaveLength(0)
  })
})

describe('NativeDatabaseDumper - restoreDatabase', () => {
  it('PostgreSQL 成功：命令组装(clean/单事务/非默认主机端口) + stderr 分类 + 密码不落命令行', async () => {
    const dumper = makeTauriDumper()
    shellRules.push([
      `psql -U 'admin' -h 'db.internal' -p 5433 --clean --single-transaction -d 'restore_db' < '/tmp/bk.sql'`,
      { code: 0, stdout: '', stderr: 'WARNING: extension not installed\nNOTICE: some notice' },
    ])
    const { events, onProgress } = captureProgress()
    const result = await dumper.restoreDatabase(
      {
        dbType: 'postgresql', host: 'db.internal', port: 5433, database: 'restore_db',
        username: 'admin', password: 'pg-pw', backupPath: '/tmp/bk.sql',
        cleanBeforeRestore: true, singleTransaction: true,
      },
      onProgress
    )

    expect(shellCalls).toEqual([
      `psql -U 'admin' -h 'db.internal' -p 5433 --clean --single-transaction -d 'restore_db' < '/tmp/bk.sql'`,
    ])
    expect(shellCalls[0]).not.toContain('pg-pw')
    expect(result.success).toBe(true)
    expect(result.warnings).toEqual(['WARNING: extension not installed'])
    expect(result.errors).toEqual([]) // NOTICE 行不计入（PG 分支大小写敏感匹配 ERROR/WARNING）
    expect(result.tablesRestored).toBe(-1) // 哨兵值：无错误时表数未知
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(events.map(e => e.stage)).toEqual(['validating', 'dropping', 'completed'])
    expect(events.map(e => e.percentComplete)).toEqual([5, 20, 100])
    expect(events[2].message).toContain('Restore completed')
  })

  it('PostgreSQL 失败：ERROR 行逐行收集进 errors，tablesRestored 归零', async () => {
    const dumper = makeTauriDumper()
    shellRules.push([
      /^psql /,
      { code: 1, stdout: '', stderr: 'ERROR: relation "x" does not exist\nERROR: syntax error at or near "FROM"' },
    ])
    const result = await dumper.restoreDatabase(PG_RESTORE_OPTS)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0]).toContain('relation "x"')
    expect(result.tablesRestored).toBe(0)
  })

  it('MySQL：-u/-h/-P 参数拼接，stderr 解析大小写不敏感', async () => {
    const dumper = makeTauriDumper()
    shellRules.push([
      `mysql -u'u1' -h'db2' -P3307 'mydb' < '/tmp/m.sql'`,
      { code: 0, stdout: '', stderr: 'error 1064: bad sql\nWarning: timezone offset' },
    ])
    const result = await dumper.restoreDatabase({
      dbType: 'mysql', host: 'db2', port: 3307, database: 'mydb', username: 'u1', backupPath: '/tmp/m.sql',
    })

    expect(shellCalls).toEqual([`mysql -u'u1' -h'db2' -P3307 'mydb' < '/tmp/m.sql'`])
    expect(result.success).toBe(true)
    expect(result.errors).toEqual(['error 1064: bad sql'])
    expect(result.warnings).toEqual(['Warning: timezone offset'])
  })

  it('SQLite：cp 命令成功/失败两分支', async () => {
    const dumper = makeTauriDumper()
    const opts: NativeRestoreOptions = {
      dbType: 'sqlite', host: '', port: 0, database: '/data/app.db', username: '', backupPath: '/tmp/bk.db',
    }

    shellRules.push([/^cp "/, { code: 0, stdout: '', stderr: '' }])
    const ok = await dumper.restoreDatabase(opts)
    expect(ok.success).toBe(true)
    expect(ok.tablesRestored).toBe(-1)
    expect(ok.errors).toEqual([])
    expect(shellCalls).toEqual([`cp "/tmp/bk.db" "/data/app.db"`]) // 注意：cp 路径未走 shellQuote

    shellRules.push([/^cp "/, { code: 1, stdout: '', stderr: 'No such file or directory' }])
    const fail = await dumper.restoreDatabase(opts)
    expect(fail.success).toBe(false)
    expect(fail.tablesRestored).toBe(0)
    expect(fail.errors).toEqual(['No such file or directory'])
  })
})

describe('NativeDatabaseDumper - generateDumpCommand 细节', () => {
  it('compress 组合/格式映射/单引号转义；MySQL 指定表先库后表（bug 已修）', () => {
    const dumper = makeBrowserDumper() // 纯命令生成不依赖原生环境

    // 仅显式 format: 'sql' 时 compress 被排除；format 缺省时 -Z9 仍会拼接（固化现行为，见报告）
    expect(dumper.generateDumpCommand({ ...PG_OPTS, compress: true, format: 'sql' })).not.toContain('-Z9')
    expect(dumper.generateDumpCommand({ ...PG_OPTS, compress: true })).toContain('-Z9')
    expect(dumper.generateDumpCommand({ ...PG_OPTS, format: 'directory' })).toContain('-Fd')
    expect(dumper.generateDumpCommand({ ...PG_OPTS, format: 'tar' })).toContain('-Ft')

    // shellQuote：单引号以 '\'' 闭合重开形态出现，命令不被截断
    expect(dumper.generateDumpCommand({ ...PG_OPTS, username: "o'brien" })).toContain(`'o'\\''brien'`)

    // 修复后：指定 tables 时先库名后表（旧缺陷：丢库名致 mysqldump 把首表当库）
    expect(dumper.generateDumpCommand({ ...MYSQL_OPTS, tables: ['users', 'orders'] })).toBe(
      `mysqldump -u'root' --routines --triggers --events 'shop' 'users' 'orders'`
    )
  })
})
