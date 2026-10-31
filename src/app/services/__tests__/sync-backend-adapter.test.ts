/**
 * @file sync-backend-adapter.test.ts
 * @description 同步后端适配器专项 — createBackend 工厂与 NoOp 语义、Local(localStorage 模拟)、
 *              WebDAV(探活/PUT/GET/PROPFIND XML 解析)、S3(虚拟主机与路径风格 URL/列表 XML/HEAD)、
 *              CustomHTTP({path} 端点占位符) 及 BackendManager 单例（后端切换/配置持久化/重连恢复/移除）。
 *              全部网络交互（fetch）均为 vi.stubGlobal 桩，不触真实网络。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import BackendManager, { createBackend } from '../sync-backend-adapter'
import type { BackendManagerConfig, BackendType, SyncPayload } from '../sync-backend-adapter'

// ----------------------------------------------------------------------------
// 测试基建
// ----------------------------------------------------------------------------

const fetchMock = vi.fn()

/** 构造 fetch Response 桩（覆盖被测代码用到的 ok/status/json/text/headers） */
const res = (o: { ok?: boolean; status?: number; json?: unknown; text?: string; headers?: Record<string, string> } = {}) => ({
  ok: o.ok ?? (o.status ?? 200) < 400,
  status: o.status ?? 200,
  json: async () => o.json ?? {},
  text: async () => o.text ?? JSON.stringify(o.json ?? {}),
  headers: new Headers(o.headers ?? {}),
})

/** 取第 i 次 fetch 调用的 url/method/headers/body */
const callAt = (i: number): { url: string; method: string; headers: Record<string, string>; body?: string } => {
  const [url, init] = fetchMock.mock.calls[i] as [
    string,
    { method: string; headers: Record<string, string>; body?: string },
  ]
  return { url, method: init.method, headers: init.headers, body: init.body }
}

/** 构造同步载荷 */
const makePayload = (path: string, data = 'aGVsbG8=', checksum = 'ck-sum'): SyncPayload => ({
  path,
  data,
  checksum,
  timestamp: 1_794_000_000_000,
})

/** 读取 BackendManager 持久化到 localStorage 的配置快照 */
const readSavedConfig = (): BackendManagerConfig =>
  JSON.parse(localStorage.getItem('yyc3_sync_backend_config') ?? '{}') as BackendManagerConfig

/** 重置 BackendManager 私有静态单例（private static 仅编译期可见，运行时可直达） */
const resetManagerSingleton = (): void => {
  ;(BackendManager as unknown as { instance?: unknown }).instance = undefined
}

beforeEach(() => {
  // resetAllMocks（非 clear）：否则 mockRejectedValue 等实现会跨用例泄漏
  vi.resetAllMocks()
  localStorage.clear()
  resetManagerSingleton()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ----------------------------------------------------------------------------
// 工厂与 NoOp
// ----------------------------------------------------------------------------

describe('createBackend 工厂', () => {
  it('按类型创建对应后端；none 与未知类型均回退 NoOp（全操作 no-op）', async () => {
    expect(createBackend('local').type).toBe('local')
    expect(createBackend('webdav').type).toBe('webdav')
    expect(createBackend('s3').type).toBe('s3')
    expect(createBackend('custom-http').type).toBe('custom-http')

    for (const b of [createBackend('none'), createBackend('github' as BackendType)]) {
      expect(b.type).toBe('none')
      expect(b.status).toBe('disconnected')
      expect(await b.connect({ type: 'none', label: '空后端' })).toBe(true)
      expect(b.status).toBe('connected')
      expect(await b.upload(makePayload('a.md'))).toBe(true)
      expect(await b.download('a.md')).toBeNull()
      expect(await b.list()).toEqual([])
      expect(await b.delete('a.md')).toBe(true)
      expect(await b.getInfo('a.md')).toBeNull()
      expect(await b.healthCheck()).toEqual({ ok: true, latencyMs: 0 })
      await b.disconnect()
      expect(b.status).toBe('disconnected')
    }
  })
})

// ----------------------------------------------------------------------------
// LocalFileBackend
// ----------------------------------------------------------------------------

describe('LocalFileBackend（localStorage 模拟本地盘）', () => {
  it('全链路：connect 无 localPath 回退默认仍成功；upload/download 走 yyc3_sync_ 前缀键往返；list 前缀过滤；getInfo size 取 data 长度；delete 后失效；healthCheck ok', async () => {
    const b = createBackend('local')
    expect(await b.connect({ type: 'local', label: '本地' })).toBe(true)
    expect(b.status).toBe('connected')
    expect(fetchMock).not.toHaveBeenCalled()

    const payload = makePayload('docs/a.md', '12345', 'ck-a')
    expect(await b.upload(payload)).toBe(true)
    expect(localStorage.getItem('yyc3_sync_docs/a.md')).toBe(JSON.stringify(payload))
    expect(await b.download('docs/a.md')).toEqual(payload)
    expect(await b.download('not-exist.md')).toBeNull()

    await b.upload(makePayload('docs/c.md', '1234567890', 'ck-c'))
    await b.upload(makePayload('other/b.md', 'x', 'ck-b'))
    const docs = await b.list('docs/')
    expect(docs.map(f => f.path)).toEqual(['docs/a.md', 'docs/c.md'])
    expect(docs[0].size).toBe(JSON.stringify(payload).length) // size = 存储原始串长度
    expect(docs[0].lastModified).toBe(payload.timestamp)
    expect(docs[0].checksum).toBe('ck-a')

    expect(await b.getInfo('docs/c.md')).toEqual({
      path: 'docs/c.md',
      size: 10, // getInfo 的 size 取 data 字符长度
      lastModified: 1_794_000_000_000,
      checksum: 'ck-c',
    })

    expect(await b.delete('docs/a.md')).toBe(true)
    expect(await b.download('docs/a.md')).toBeNull()
    expect((await b.healthCheck()).ok).toBe(true)
  })
})

// ----------------------------------------------------------------------------
// WebDAVBackend
// ----------------------------------------------------------------------------

describe('WebDAVBackend', () => {
  it('连接失败：缺 baseUrl → 返回 false 且不发任何网络请求；探活 OPTIONS 500 → false 且状态 error', async () => {
    const b = createBackend('webdav')
    expect(await b.connect({ type: 'webdav', label: 'wdav' })).toBe(false)
    expect(b.status).toBe('error')
    expect(fetchMock).not.toHaveBeenCalled()

    fetchMock.mockResolvedValue(res({ status: 500 }))
    expect(await b.connect({ type: 'webdav', label: 'wdav', baseUrl: 'https://dav.example.com/dav' })).toBe(false)
    expect(b.status).toBe('error')
    expect((await b.healthCheck()).ok).toBe(false)
  })

  it('basic 认证连接成功：OPTIONS 探活携带 Authorization Basic 头，状态 connected', async () => {
    fetchMock.mockResolvedValue(res({}))
    const b = createBackend('webdav')
    const ok = await b.connect({
      type: 'webdav',
      label: 'wdav',
      baseUrl: 'https://dav.example.com/remote.php/dav',
      authType: 'basic',
      username: 'user',
      password: 'pass',
    })
    expect(ok).toBe(true)
    expect(b.status).toBe('connected')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const probe = callAt(0)
    expect(probe.url).toBe('https://dav.example.com/remote.php/dav')
    expect(probe.method).toBe('OPTIONS')
    expect(probe.headers.Authorization).toBe(`Basic ${btoa('user:pass')}`)
  })

  it('upload：PUT 至规范化 URL（去 baseUrl 尾斜杠、去 path 前导斜杠）且 body 为 payload JSON；响应非 ok / 网络异常 → false', async () => {
    fetchMock.mockResolvedValueOnce(res({})) // 探活
    const b = createBackend('webdav')
    await b.connect({
      type: 'webdav',
      label: 'wdav',
      baseUrl: 'https://dav.example.com/dav///',
      authType: 'bearer',
      token: 'tk-1',
    })

    const payload = makePayload('/docs/a.md')
    fetchMock.mockResolvedValueOnce(res({}))
    expect(await b.upload(payload)).toBe(true)
    const up = callAt(1)
    expect(up.url).toBe('https://dav.example.com/dav/docs/a.md')
    expect(up.method).toBe('PUT')
    expect(up.headers.Authorization).toBe('Bearer tk-1')
    expect(up.body).toBe(JSON.stringify(payload))

    fetchMock.mockResolvedValueOnce(res({ status: 502 }))
    expect(await b.upload(makePayload('docs/b.md'))).toBe(false)
    fetchMock.mockRejectedValueOnce(new Error('网络中断'))
    expect(await b.upload(makePayload('docs/c.md'))).toBe(false)
  })

  it('download：404 → null；200 → 解析 JSON payload；网络异常 → null', async () => {
    fetchMock.mockResolvedValueOnce(res({})) // 探活
    const b = createBackend('webdav')
    await b.connect({ type: 'webdav', label: 'wdav', baseUrl: 'https://dav.example.com/dav' })

    fetchMock.mockResolvedValueOnce(res({ status: 404 }))
    expect(await b.download('docs/miss.md')).toBeNull()

    const payload = makePayload('docs/a.md')
    fetchMock.mockResolvedValueOnce(res({ json: payload }))
    expect(await b.download('docs/a.md')).toEqual(payload)
    const dl = callAt(2)
    expect(dl.url).toBe('https://dav.example.com/dav/docs/a.md')
    expect(dl.method).toBe('GET')

    fetchMock.mockRejectedValueOnce(new Error('网络中断'))
    expect(await b.download('docs/a.md')).toBeNull()
  })

  it('list：PROPFIND 携带 Depth 头并解析 XML 的 href/size/lastModified/etag；响应非 ok → 空数组', async () => {
    fetchMock.mockResolvedValueOnce(res({})) // 探活
    const b = createBackend('webdav')
    await b.connect({ type: 'webdav', label: 'wdav', baseUrl: 'https://dav.example.com/dav' })

    const xml = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<d:multistatus xmlns:d="DAV:">',
      '  <d:response><d:href>/dav/</d:href></d:response>',
      '  <d:response>',
      '    <d:href>/dav/docs/a.md</d:href>',
      '    <d:propstat><d:prop>',
      '      <d:getcontentlength>128</d:getcontentlength>',
      '      <d:getlastmodified>Wed, 21 Oct 2026 07:28:00 GMT</d:getlastmodified>',
      '      <d:getetag>"etag-a1"</d:getetag>',
      '    </d:prop></d:propstat>',
      '  </d:response>',
      '</d:multistatus>',
    ].join('\n')
    fetchMock.mockResolvedValueOnce(res({ text: xml }))
    const files = await b.list('docs')

    const ls = callAt(1)
    expect(ls.method).toBe('PROPFIND')
    expect(ls.headers.Depth).toBe('1')

    // 现状行为：根条目 href('/dav/') 与完整 baseUrl 字符串比较永不相等 → 未被过滤（疑似 bug，见专项报告）
    expect(files).toHaveLength(2)
    expect(files[0]).toEqual({ path: '/dav/', size: 0, lastModified: 0 })
    const entry = files.find(f => f.path === '/dav/docs/a.md')
    expect(entry?.size).toBe(128)
    expect(entry?.lastModified).toBe(new Date('Wed, 21 Oct 2026 07:28:00 GMT').getTime())
    expect(entry?.etag).toBe('"etag-a1"')

    fetchMock.mockResolvedValueOnce(res({ status: 500 }))
    expect(await b.list('docs')).toEqual([])
  })
})

// ----------------------------------------------------------------------------
// S3Backend
// ----------------------------------------------------------------------------

describe('S3Backend', () => {
  it('缺 bucket 或 region → 返回 false 且状态 error、不发网络请求；配置齐备 → true 且 connected', async () => {
    const b = createBackend('s3')
    expect(await b.connect({ type: 's3', label: 's3', region: 'us-east-1' })).toBe(false)
    expect(b.status).toBe('error')
    expect(await b.connect({ type: 's3', label: 's3', bucket: 'my-bucket' })).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()

    expect(await b.connect({ type: 's3', label: 's3', bucket: 'my-bucket', region: 'us-east-1' })).toBe(true)
    expect(b.status).toBe('connected')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('upload：默认虚拟主机风格 URL；forcePathStyle 时走 endpoint 路径风格；携带 x-amz-date 头；响应非 ok → false', async () => {
    fetchMock.mockResolvedValue(res({}))
    const b = createBackend('s3')
    await b.connect({ type: 's3', label: 's3', bucket: 'my-bucket', region: 'ap-east-1' })
    expect(await b.upload(makePayload('/docs/a.md'))).toBe(true)
    let c = callAt(0)
    expect(c.url).toBe('https://my-bucket.s3.ap-east-1.amazonaws.com/docs/a.md')
    expect(c.method).toBe('PUT')
    expect(c.headers['x-amz-date']).toBeTruthy()

    const pathStyle = createBackend('s3')
    await pathStyle.connect({
      type: 's3',
      label: 'minio',
      bucket: 'my-bucket',
      region: 'us-east-1',
      endpoint: 'https://minio.local',
      forcePathStyle: true,
    })
    expect(await pathStyle.upload(makePayload('docs/b.md'))).toBe(true)
    c = callAt(1)
    expect(c.url).toBe('https://minio.local/my-bucket/docs/b.md')

    fetchMock.mockResolvedValueOnce(res({ status: 403 }))
    expect(await b.upload(makePayload('docs/x.md'))).toBe(false)
  })

  it('list：prefix 拼入查询串并解析 Contents XML（ETag 去引号）；getInfo 解析 HEAD 响应头', async () => {
    fetchMock.mockResolvedValue(res({}))
    const b = createBackend('s3')
    await b.connect({ type: 's3', label: 's3', bucket: 'my-bucket', region: 'us-east-1' })

    const xml = [
      '<ListBucketResult>',
      '  <Contents><Key>docs/a.md</Key><Size>42</Size><LastModified>2026-10-21T07:28:00.000Z</LastModified><ETag>"e1"</ETag></Contents>',
      '  <Contents><Key>docs/b.md</Key><Size>7</Size></Contents>',
      '</ListBucketResult>',
    ].join('\n')
    fetchMock.mockResolvedValueOnce(res({ text: xml }))
    const files = await b.list('docs/')
    const ls = callAt(0)
    expect(ls.url).toContain('https://my-bucket.s3.us-east-1.amazonaws.com/?')
    expect(ls.url).toContain('prefix=docs%2F')
    expect(files).toHaveLength(2)
    expect(files[0]).toEqual({
      path: 'docs/a.md',
      size: 42,
      lastModified: new Date('2026-10-21T07:28:00.000Z').getTime(),
      etag: 'e1',
    })
    expect(files[1]).toEqual({ path: 'docs/b.md', size: 7, lastModified: 0 })

    fetchMock.mockResolvedValueOnce(
      res({ headers: { 'content-length': '99', 'last-modified': 'Wed, 21 Oct 2026 07:28:00 GMT', etag: '"xyz"' } }),
    )
    const info = await b.getInfo('docs/a.md')
    expect(callAt(1).method).toBe('HEAD')
    expect(info).toEqual({
      path: 'docs/a.md',
      size: 99,
      lastModified: new Date('Wed, 21 Oct 2026 07:28:00 GMT').getTime(),
      etag: '"xyz"',
    })
  })
})

// ----------------------------------------------------------------------------
// CustomHTTPBackend
// ----------------------------------------------------------------------------

describe('CustomHTTPBackend', () => {
  it('连接失败：缺 baseUrl → false 且不发请求；探活 GET 非 ok → false；bearer/basic 与自定义头均注入探活请求', async () => {
    const b = createBackend('custom-http')
    expect(await b.connect({ type: 'custom-http', label: 'h', authType: 'bearer', token: 'tk' })).toBe(false)
    expect(b.status).toBe('error')
    expect(fetchMock).not.toHaveBeenCalled()

    fetchMock.mockResolvedValue(res({ status: 503 })) // b2 探活失败
    const b2 = createBackend('custom-http')
    expect(
      await b2.connect({
        type: 'custom-http',
        label: 'h',
        baseUrl: 'https://api.example.com',
        authType: 'bearer',
        token: 'tk-2',
        customHeaders: { 'X-API-Key': 'k1' },
      }),
    ).toBe(false)
    expect(b2.status).toBe('error')
    const probe = callAt(0)
    expect(probe.url).toBe('https://api.example.com')
    expect(probe.method).toBe('GET')
    expect(probe.headers.Authorization).toBe('Bearer tk-2')
    expect(probe.headers['X-API-Key']).toBe('k1')

    fetchMock.mockResolvedValueOnce(res({})) // b3 探活成功
    const b3 = createBackend('custom-http')
    expect(
      await b3.connect({ type: 'custom-http', label: 'h', baseUrl: 'https://api.example.com', authType: 'basic', username: 'u', password: 'p' }),
    ).toBe(true)
    expect(b3.status).toBe('connected')
    expect(callAt(1).headers.Authorization).toBe(`Basic ${btoa('u:p')}`)
  })

  it('uploadEndpoint/downloadEndpoint 的 {path} 占位符替换为 encodeURIComponent 结果；download 非 ok → null', async () => {
    fetchMock.mockResolvedValueOnce(res({})) // 探活
    const b = createBackend('custom-http')
    await b.connect({
      type: 'custom-http',
      label: 'h',
      baseUrl: 'https://api.example.com',
      uploadEndpoint: 'https://cdn.example.com/u/{path}',
      downloadEndpoint: 'https://api.example.com/d/{path}',
    })

    fetchMock.mockResolvedValueOnce(res({}))
    expect(await b.upload(makePayload('docs/a b.md'))).toBe(true)
    expect(callAt(1).url).toBe('https://cdn.example.com/u/docs%2Fa%20b.md')

    fetchMock.mockResolvedValueOnce(res({ status: 404 }))
    expect(await b.download('x.md')).toBeNull()
    expect(callAt(2).url).toBe('https://api.example.com/d/x.md')

    const payload = makePayload('x.md')
    fetchMock.mockResolvedValueOnce(res({ json: payload }))
    expect(await b.download('x.md')).toEqual(payload)
  })
})

// ----------------------------------------------------------------------------
// BackendManager（单例）
// ----------------------------------------------------------------------------

describe('BackendManager 单例', () => {
  it('重复 getInstance 返回同一实例；损坏的持久化 JSON 容错回默认配置；getConfig 标量字段为快照副本', () => {
    localStorage.setItem('yyc3_sync_backend_config', '{{{broken-json')
    const m1 = BackendManager.getInstance()
    expect(BackendManager.getInstance()).toBe(m1)

    const cfg = m1.getConfig()
    expect(cfg.activeBackend).toBe('none')
    expect(cfg.syncDirection).toBe('bidirectional')
    expect(cfg.autoSync).toBe(false)
    expect(cfg.syncIntervalMs).toBe(60000)
    expect(cfg.lastSyncTime).toBeNull()
    expect(m1.getActiveType()).toBe('none')
    expect(m1.getActive().type).toBe('none')

    cfg.syncDirection = 'push' // 外部改快照不应影响内部
    expect(m1.getSyncDirection()).toBe('bidirectional')
  })

  it('webdav 连接失败 → setActiveBackend 返回 false，活动后端回退 none', async () => {
    fetchMock.mockResolvedValue(res({ status: 500 }))
    const m = BackendManager.getInstance()
    const ok = await m.setActiveBackend('webdav', { type: 'webdav', label: 'wdav', baseUrl: 'https://dav.example.com/dav' })
    expect(ok).toBe(false)
    expect(m.getActiveType()).toBe('none')
    expect(m.getActive().type).toBe('none')
    expect(m.getConfiguredBackends()).toEqual([])
  })

  it('setActiveBackend 成功：activeType 与活动实例切换、配置持久化、getConfiguredBackends 登记；再次切换时旧后端被 disconnect', async () => {
    const m = BackendManager.getInstance()
    expect(await m.setActiveBackend('local', { type: 'local', label: '本地', localPath: '/tmp/sync' })).toBe(true)
    expect(m.getActiveType()).toBe('local')
    expect(m.getActive().type).toBe('local')
    expect(m.getConfiguredBackends().map(x => x.type)).toEqual(['local'])
    expect(readSavedConfig().activeBackend).toBe('local')

    const oldActive = m.getActive()
    fetchMock.mockResolvedValue(res({})) // webdav 探活成功
    expect(await m.setActiveBackend('webdav', { type: 'webdav', label: 'wdav', baseUrl: 'https://dav.example.com/dav' })).toBe(true)
    expect(m.getActiveType()).toBe('webdav')
    expect(m.getActive().type).toBe('webdav')
    expect(oldActive.status).toBe('disconnected') // 旧 local 后端被断开
  })

  it('方向/自动同步/间隔/最后同步时间设置后即时生效并写入 localStorage', () => {
    const m = BackendManager.getInstance()
    m.setSyncDirection('push')
    m.setAutoSync(true)
    m.setSyncInterval(30000)
    const before = Date.now()
    m.updateLastSyncTime()
    const after = Date.now()

    expect(m.getSyncDirection()).toBe('push')
    expect(m.isAutoSyncEnabled()).toBe(true)
    expect(m.getSyncInterval()).toBe(30000)
    expect(m.getLastSyncTime()).toBeGreaterThanOrEqual(before)
    expect(m.getLastSyncTime()).toBeLessThanOrEqual(after)

    const saved = readSavedConfig()
    expect(saved.syncDirection).toBe('push')
    expect(saved.autoSync).toBe(true)
    expect(saved.syncIntervalMs).toBe(30000)
    expect(saved.lastSyncTime).not.toBeNull()
  })

  it('removeBackend 移除活动后端：activeType 回 none、旧实例断开、配置清除', async () => {
    // 规避源码缺陷：默认配置为浅拷贝，backends 映射对象跨实例共享（DEFAULT_MANAGER_CONFIG 被污染）。
    // 预置含空 backends 的存档 → loadConfig 走 {...DEFAULT, ...parsed} 使管理器持有私有 backends map。
    localStorage.setItem('yyc3_sync_backend_config', JSON.stringify({ backends: {} }))
    const m = BackendManager.getInstance()
    await m.setActiveBackend('local', { type: 'local', label: '本地' })
    const active = m.getActive()

    await m.removeBackend('local')
    expect(m.getActiveType()).toBe('none')
    expect(m.getActive().type).toBe('none')
    expect(active.status).toBe('disconnected')
    expect(m.getConfiguredBackends()).toEqual([])
    expect(readSavedConfig().backends).toEqual({})
  })

  it('预置持久化配置 → 新建管理器自动恢复：getActiveType 同步可见，活动实例经异步重连切换为 local', async () => {
    localStorage.setItem(
      'yyc3_sync_backend_config',
      JSON.stringify({
        activeBackend: 'local',
        backends: { local: { type: 'local', label: '本地', localPath: '/tmp/sync' } },
        syncDirection: 'push',
        autoSync: true,
        syncIntervalMs: 5000,
        lastSyncTime: 123,
      }),
    )
    const m = BackendManager.getInstance()
    expect(m.getActiveType()).toBe('local')
    expect(m.getSyncDirection()).toBe('push')
    expect(m.isAutoSyncEnabled()).toBe(true)
    expect(m.getSyncInterval()).toBe(5000)
    expect(m.getLastSyncTime()).toBe(123)

    expect(m.getActive().type).toBe('none') // 重连是异步的：此刻仍是占位 NoOp
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(m.getActive().type).toBe('local') // 重连完成后切换为真实后端
  })
})
