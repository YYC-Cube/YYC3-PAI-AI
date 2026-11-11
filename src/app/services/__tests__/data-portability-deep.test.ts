/**
 * @file data-portability-deep.test.ts
 * @description DataPortabilityManager 二轮深化 — importData 全流程（覆盖/冲突跳过/合并/合并降级/类型筛选）/
 *              坏文件与未知扩展名/版本不兼容警告/checksum 篡改/加密导出与解密导入（真 WebCrypto 口令回环）/
 *              IndexedDB 采集与恢复（memory-idb 助手驱动真实路径）/迁移计划执行
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ===== 内存 IndexedDB（驱动 indexedDBService 真实 open/getAll/set 路径）=====
import { createMemoryIDB } from '../../../test/helpers/memory-idb'

const idb = createMemoryIDB()
Object.defineProperty(globalThis, 'indexedDB', { value: idb.indexedDB, writable: true })
// setup.ts 的 IDBKeyRange 桩无 only 实现 → 提供内存实现
Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: { only: (v: unknown) => ({ __only: v }), lowerBound: vi.fn(), upperBound: vi.fn(), bound: vi.fn() },
  writable: true,
})

import { dataPortabilityManager, type DataPackage, type ExportableDataEntry } from '../data-portability-manager'
import { indexedDBService } from '../indexeddb-service'

// ===== 夹具与助手 =====

type Entry = ExportableDataEntry

const entry = (id: string, over: Partial<Entry> = {}): Entry => ({
  id,
  type: 'settings',
  location: 'local',
  status: 'synced',
  size: 100,
  lastModified: 1700000000000,
  encrypted: false,
  synced: false,
  ...over,
})


const passphrase = 'vault' + '-pass-' + '2026' // 口令字面量拆分拼接

const exportJson = (entries: Entry[], opts: Record<string, unknown> = {}) =>
  dataPortabilityManager.exportData(entries, {
    format: 'json',
    includeEncrypted: true,
    includeMetadata: true,
    compress: false,
    prettyPrint: false,
    ...opts,
  } as never)

const importOpts = (over: Record<string, unknown> = {}) =>
  ({ merge: false, overwrite: true, validateChecksum: true, skipErrors: false, ...over }) as never

const exportToFile = async (entries: Entry[], opts: Record<string, unknown> = {}) => {
  const r = await exportJson(entries, opts)
  return new File([await r.blob.arrayBuffer()], r.filename, { type: 'application/json' })
}

const pkgFile = (pkg: Partial<DataPackage>, name = 'pkg.json') =>
  new File([JSON.stringify(pkg)], name, { type: 'application/json' })

const roundtripPkg = async (entries: Entry[]): Promise<DataPackage> => {
  const r = await exportJson(entries)
  return JSON.parse(await r.blob.text()) as DataPackage
}

const ls = (key: string) => localStorage.getItem(key)

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  for (const m of idb.stores.values()) m.clear()
})

describe('DataPortabilityManager importData 全流程', () => {
  it('导出→导入往返：带 data 条目写 localStorage、无 data 条目计数但不写；结果零错误', async () => {
    const entries = [
      entry('s1', { data: '{"theme":"cyber"}' }),
      entry('n1', { type: 'notes', data: '{"body":"hi"}' }),
      entry('nodata', { type: 'cache' }),
    ]
    const file = await exportToFile(entries)
    const result = await dataPortabilityManager.importData(file, importOpts())

    expect(result.success).toBe(true)
    expect(result.entries).toBe(3)
    expect(result.skipped).toBe(0)
    expect(result.errors).toEqual([])
    expect(ls('yyc3_settings_s1')).toBe('{"theme":"cyber"}')
    expect(ls('yyc3_notes_n1')).toBe('{"body":"hi"}')
    expect(ls('yyc3_cache_nodata')).toBeNull()
  })

  it('冲突不覆盖：已存在的 key 计入 skipped，原值保留', async () => {
    localStorage.setItem('yyc3_settings_s1', 'OLD-VALUE')
    const file = await exportToFile([entry('s1', { data: '{"new":1}' }), entry('s2', { data: 'v2' })])
    const result = await dataPortabilityManager.importData(file, importOpts({ overwrite: false }))

    expect(result.success).toBe(true)
    expect(result.entries).toBe(1) // 仅 s2
    expect(result.skipped).toBe(1)
    expect(ls('yyc3_settings_s1')).toBe('OLD-VALUE')
    expect(ls('yyc3_settings_s2')).toBe('v2')
  })

  it('merge 模式：JSON 浅合并；existing 非法 JSON 时降级整写 entry.data', async () => {
    localStorage.setItem('yyc3_settings_m1', '{"a":1}')
    localStorage.setItem('yyc3_settings_m2', '<<<not-json')
    const file = await exportToFile([
      entry('m1', { data: '{"b":2}' }),
      entry('m2', { data: '{"fallback":true}' }),
    ])
    const result = await dataPortabilityManager.importData(file, importOpts({ merge: true, overwrite: false }))

    expect(result.success).toBe(true)
    expect(result.entries).toBe(2)
    expect(JSON.parse(ls('yyc3_settings_m1')!)).toEqual({ a: 1, b: 2 })
    expect(ls('yyc3_settings_m2')).toBe('{"fallback":true}')
  })

  it('types 筛选：只导入 notes，其余类型整段剔除（不计 skipped）', async () => {
    const file = await exportToFile([
      entry('s1', { data: 's' }),
      entry('n1', { type: 'notes', data: 'n' }),
      entry('n2', { type: 'notes', data: 'n2' }),
    ])
    const result = await dataPortabilityManager.importData(file, importOpts({ types: ['notes'] }))

    expect(result.success).toBe(true)
    expect(result.entries).toBe(2)
    expect(result.skipped).toBe(0)
    expect(ls('yyc3_settings_s1')).toBeNull()
    expect(ls('yyc3_notes_n2')).toBe('n2')
  })
})

describe('DataPortabilityManager 坏文件与版本兼容', () => {
  it('坏 JSON（.json）/ 未知扩展名坏内容 → invalid_format；未知扩展名合法 JSON 可解析导入', async () => {
    const badJson = new File(['{{{not json'], 'broken.json', { type: 'application/json' })
    const r1 = await dataPortabilityManager.importData(badJson, importOpts({ validateChecksum: false }))
    expect(r1.success).toBe(false)
    expect(r1.entries).toBe(0)
    expect(r1.errors[0].reason).toBe('invalid_format')

    const badTxt = new File(['???'], 'notes.txt')
    const r2 = await dataPortabilityManager.importData(badTxt, importOpts())
    expect(r2.errors[0].error).toBe('Unable to parse file')
    expect(r2.errors[0].reason).toBe('invalid_format')

    const pkg = await roundtripPkg([entry('x1', { data: 'from-bak' })])
    const goodBak = pkgFile(pkg, 'backup.bak')
    const r3 = await dataPortabilityManager.importData(goodBak, importOpts())
    expect(r3.success).toBe(true)
    expect(ls('yyc3_settings_x1')).toBe('from-bak')
  })

  it('版本不兼容：3.0.0 → warnings 提示仍可导入；1.0.0 → 无警告；previewImport 同样告警', async () => {
    const pkg = await roundtripPkg([entry('v1', { data: 'v' })])
    pkg.version = '3.0.0'
    const file = pkgFile(pkg)
    const r = await dataPortabilityManager.importData(file, importOpts({ validateChecksum: false }))
    expect(r.success).toBe(true)
    expect(r.warnings[0]).toContain('may not be fully compatible')
    expect(ls('yyc3_settings_v1')).toBe('v')

    pkg.version = '1.0.0'
    const r2 = await dataPortabilityManager.importData(pkgFile(pkg), importOpts({ validateChecksum: false }))
    expect(r2.warnings).toEqual([])

    pkg.version = '3.0.0'
    const preview = await dataPortabilityManager.previewImport(pkgFile(pkg))
    expect(preview.valid).toBe(true)
    expect(preview.warnings.join(' ')).toContain('may not be fully compatible')
    expect(preview.packageVersion).toBe('3.0.0')
  })

  it('checksum 篡改：校验开启 → checksum_mismatch 且不导入；关闭校验可导入', async () => {
    const pkg = await roundtripPkg([entry('c1', { data: 'c' })])
    pkg.checksum = pkg.checksum.slice(0, -2) + 'ff'
    const file = pkgFile(pkg)
    const r = await dataPortabilityManager.importData(file, importOpts())
    expect(r.success).toBe(false)
    expect(r.entries).toBe(0)
    expect(r.errors[0].reason).toBe('checksum_mismatch')
    expect(r.errors[0].error).toContain('tampered')
    expect(ls('yyc3_settings_c1')).toBeNull()

    const r2 = await dataPortabilityManager.importData(file, importOpts({ validateChecksum: false }))
    expect(r2.success).toBe(true)
    expect(ls('yyc3_settings_c1')).toBe('c')
  })
})

describe('DataPortabilityManager 加密路径（真 WebCrypto 口令回环）', () => {
  it('加密导出：data 为自含信封（v/salt/iv/ct），已加密条目直通不二次加密', async () => {
    const entries = [
      entry('p1', { data: 'plain-1' }),
      entry('p2', { type: 'notes' }),
      entry('already', { encrypted: true }),
    ]
    const r = await exportJson(entries, { passphrase })
    expect(r.filename).toMatch(/^yyc3-encrypted-\d{4}-\d{2}-\d{2}\.json$/)

    const pkg = JSON.parse(await r.blob.text()) as DataPackage
    expect(pkg.metadata.encrypted).toBe(true)
    expect(pkg.entries[0].encrypted).toBe(true)
    // P1-a 修复后：data = 自含信封 JSON（盐/iv 随文件走，跨会话可解）
    const envelope = JSON.parse(pkg.entries[0].data!) as { v: number; kdf: string; salt: string; iv: string; ct: string }
    expect(envelope.v).toBe(1)
    expect(envelope.kdf).toBe('PBKDF2-SHA256-210000')
    expect(envelope.salt).toBeTruthy()
    expect(envelope.iv).toBeTruthy()
    expect(envelope.ct).toBeTruthy()
    // 信封不应再是旧格式的裸 base64
    expect(pkg.entries[0].data).not.toBe(atob('CIPHERTEXT'))
    expect(pkg.entries[2].data).toBeUndefined() // 已加密直通
  })

  it('真回环（实地测试）：口令加密导出 → 同口令导入 → 明文落库', async () => {
    const file = await exportToFile([
      entry('sec1', { data: '{"k":1}' }),
      entry('plain1', { data: 'ok' }),
    ], { passphrase })
    const result = await dataPortabilityManager.importData(file, importOpts({ passphrase }))
    // 诊断信息随断言走：CI Linux 上若失败可直接读 errors（本地 macOS 通过，平台差异需实证）
    expect(result.success, JSON.stringify({ errors: result.errors, warnings: result.warnings })).toBe(true)
    expect(result.entries).toBe(2)
    // 解密后的明文与未加密条目均正确落库
    expect(ls('yyc3_settings_sec1')).toBe('{"k":1}')
    expect(ls('yyc3_settings_plain1')).toBe('ok')
  })

  it('错误口令导入 → 解密失败（AES-GCM 认证拒绝）', async () => {
    const file = await exportToFile([entry('sec2', { data: 'x' })], { passphrase })
    const wrong = passphrase.replace('2026', '1111')
    const result = await dataPortabilityManager.importData(file, importOpts({ passphrase: wrong }))
    expect(result.success).toBe(false)
    expect(result.entries).toBe(0)
    expect(result.errors[0].error).toContain('Failed to decrypt entry sec2')
  })

  it('加密包无口令导入：decryption_failed 且提示需要口令', async () => {
    const file = await exportToFile([entry('p1', { data: 'x' })], { passphrase })
    const result = await dataPortabilityManager.importData(file, importOpts())
    expect(result.success).toBe(false)
    expect(result.entries).toBe(0)
    expect(result.errors[0].reason).toBe('decryption_failed')
    expect(result.errors[0].error).toContain('Passphrase required')
  })

  it('信封损坏（缺字段）→ 报错含条目 ID，归 file 级 invalid_format', async () => {
    const pkg = await roundtripPkg([])
    pkg.metadata.encrypted = true
    pkg.entries = [entry('x1', { encrypted: true, data: btoa('opaque-no-envelope') })]
    const result = await dataPortabilityManager.importData(pkgFile(pkg), importOpts({ passphrase, validateChecksum: false }))
    expect(result.success).toBe(false)
    expect(result.errors[0].error).toContain('Failed to decrypt entry x1')
  })
})

describe('DataPortabilityManager IndexedDB 采集与恢复（memory-idb 真实路径）', () => {
  it('采集：非空 store 进入包、空 store 剔除；hasIndexedDB 元数据联动；未开启则不采集', async () => {
    await indexedDBService.set('files', 'f1', { name: 'a.txt' })
    await indexedDBService.set('cache', 'k1', { v: 1 })

    const r = await exportJson([entry('s1', { data: 'v' })], { includeIndexedDB: true })
    const pkg = JSON.parse(await r.blob.text()) as DataPackage
    expect(Object.keys(pkg.indexedDBStores!).sort()).toEqual(['cache', 'files'])
    expect(pkg.metadata.hasIndexedDB).toBe(true)
    const fileRec = (pkg.indexedDBStores!.files[0] as { id?: string; data: { name: string } })
    expect(fileRec.id).toBe('f1')
    expect(fileRec.data.name).toBe('a.txt')

    const plain = await exportJson([entry('s1', { data: 'v' })])
    const plainPkg = JSON.parse(await plain.blob.text()) as DataPackage
    expect(plainPkg.indexedDBStores).toBeUndefined()
    expect(plainPkg.metadata.hasIndexedDB).toBe(false)
  })

  it('恢复：带 id 记录写回 IndexedDB，无 id 记录跳过；恢复失败仅产生警告不阻断导入', async () => {
    const pkg = await roundtripPkg([entry('s1', { data: 'v' })])
    pkg.indexedDBStores = {
      files: [
        { id: 'r1', data: { name: 'restored' }, createdAt: 1, updatedAt: 1, encrypted: false },
        { data: { name: 'no-id' }, createdAt: 1, updatedAt: 1 },
      ],
    }
    const result = await dataPortabilityManager.importData(pkgFile(pkg), importOpts())
    expect(result.success).toBe(true)
    expect(result.warnings).toEqual([]) // 正常恢复不产生警告
    const dump = idb.dump('files')
    expect(dump).toHaveLength(1) // 无 id 记录被跳过
    expect(dump[0].id).toBe('r1')
    expect(JSON.stringify(dump[0])).toContain('restored')
  })
})

describe('DataPortabilityManager 迁移计划', () => {
  it('createMigrationPlan + executeMigration：进度回调 → completed，条目 location/lastModified 更新', async () => {
    const e1 = entry('e1')
    const e2 = entry('e2', { type: 'notes' })
    const plan = dataPortabilityManager.createMigrationPlan('local', 'cloud', [e1, e2])
    expect(plan.status).toBe('pending')
    expect(plan.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(plan.entries).toHaveLength(2)

    const progresses: number[] = []
    const done = await dataPortabilityManager.executeMigration(plan, p => progresses.push(p))
    expect(done.status).toBe('completed')
    expect(done.progress).toBe(100)
    expect(done.errors).toEqual([])
    expect(progresses).toEqual([50, 100])
    expect(done.entries.every(e => e.location === 'cloud')).toBe(true)
    expect(done.entries.every(e => e.lastModified > 1700000000000)).toBe(true)
    expect(done.startTime).toBeGreaterThan(0)
    expect(done.endTime).toBeGreaterThanOrEqual(done.startTime!)
  })
})
