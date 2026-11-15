/**
 * @file otel-adapter.deep.test.ts
 * @description OTel 适配器深化测试——JSON 下载链路/OTLP 上报分支/span 字段边界
 *
 * 深化背景：浅测（e1-services.test.ts）已覆盖 traceToOtelSpan/exportTracesToOtel 基础形态；
 * 未触达 downloadOtelExport（Blob 下载）、sendToOTLPCollector（成功/非 2xx/网络异常三分支）
 * 与 traceId 清洗、完成预览截断、多工具索引化属性等边界。
 *
 * 测法约定：
 * - fetch 用 vi.stubGlobal（afterEach unstubAllGlobals 还原）。
 * - jsdom 无 URL.createObjectURL/revokeObjectURL——按仓库惯例 Object.defineProperty 临时桩。
 * - a.click 经 HTMLAnchorElement.prototype.click 桩捕获（避免 jsdom 导航噪音）。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-11-12
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  traceToOtelSpan,
  exportTracesToOtel,
  downloadOtelExport,
  sendToOTLPCollector,
  GENAI_ATTRIBUTES,
} from '../otel-adapter'
import type { TraceRecord } from '../trace-store'

/** 构造 TraceRecord（默认成功、无工具调用） */
const makeTrace = (overrides: Partial<TraceRecord> = {}): TraceRecord => ({
  id: 'trace_abc_123',
  timestamp: 1730300000000,
  provider: 'zhipu',
  model: 'glm-5',
  promptPreview: '如何写 React hooks？',
  completion: '答'.repeat(300),
  firstTokenMs: 120,
  totalMs: 800,
  inputTokens: 10,
  outputTokens: 20,
  costUsd: 0.001,
  success: true,
  toolCalls: [],
  iterations: 1,
  ...overrides,
})

describe('otel-adapter 深化——导出下载与 OTLP 上报', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('traceToOtelSpan：traceId 清洗补齐 32 位十六进制，spanId 16 位，纳秒时间换算', () => {
    const span = traceToOtelSpan(makeTrace({ id: 'trace_abc_123' }))
    // 非十六进制字符剔除后 padEnd 到 32 位
    expect(span.traceId).toMatch(/^[0-9a-f]{32}$/)
    expect(span.traceId.startsWith('aceabc123')).toBe(true)
    expect(span.spanId).toMatch(/^[0-9a-f]{16}$/)
    expect(span.startTimeUnixNano).toBe('1730300000000000000')
    expect(span.endTimeUnixNano).toBe('1730300000800000000')
    expect(span.kind).toBe('CLIENT')
    expect(span.name).toBe('gen_ai.zhipu.glm-5')
  })

  it('成功/失败状态与 finish_reason 映射，缺省错误信息兜底 Unknown error', () => {
    const ok = traceToOtelSpan(makeTrace({ success: true }))
    expect(ok.status).toEqual({ code: 'OK' })
    expect(ok.attributes[GENAI_ATTRIBUTES.FINISH_REASON]).toBe('stop')

    const failed = traceToOtelSpan(makeTrace({ success: false, errorMessage: '配额超限' }))
    expect(failed.status).toEqual({ code: 'ERROR', message: '配额超限' })
    expect(failed.attributes[GENAI_ATTRIBUTES.FINISH_REASON]).toBe('error')

    const failedNoMsg = traceToOtelSpan(makeTrace({ success: false }))
    expect(failedNoMsg.status).toEqual({ code: 'ERROR', message: 'Unknown error' })
  })

  it('数值与预览属性：token 汇总、成本、延迟、completion 预览截断 200 字', () => {
    const span = traceToOtelSpan(makeTrace())
    expect(span.attributes[GENAI_ATTRIBUTES.TOTAL_TOKENS]).toBe(30)
    expect(span.attributes[GENAI_ATTRIBUTES.INPUT_TOKENS]).toBe(10)
    expect(span.attributes[GENAI_ATTRIBUTES.OUTPUT_TOKENS]).toBe(20)
    expect(span.attributes[GENAI_ATTRIBUTES.COST]).toBe(0.001)
    expect(span.attributes[GENAI_ATTRIBUTES.FIRST_TOKEN_LATENCY]).toBe(120)
    expect(span.attributes[GENAI_ATTRIBUTES.TOTAL_LATENCY]).toBe(800)
    expect(span.attributes[GENAI_ATTRIBUTES.RESPONSE_ID]).toBe('trace_abc_123')
    const preview = span.attributes['yyc3.completion.preview'] as string
    expect(preview).toHaveLength(200)
    expect(span.attributes['yyc3.agent.iterations']).toBe(1)
    expect(span.attributes['yyc3.tool.call_count']).toBe(0)
    expect(span.attributes['yyc3.prompt.preview']).toBe('如何写 React hooks？')
  })

  it('多工具调用生成索引化属性（名称/时长/错误标记），空工具不产出索引键', () => {
    const span = traceToOtelSpan(
      makeTrace({
        toolCalls: [
          { tool: 'fs_read', args: {}, result: 'ok', isError: false, durationMs: 50 },
          { tool: 'web_search', args: {}, result: '失败', isError: true, durationMs: 120 },
        ],
      })
    )
    expect(span.attributes['yyc3.tool.call_count']).toBe(2)
    expect(span.attributes['yyc3.tool.0.name']).toBe('fs_read')
    expect(span.attributes['yyc3.tool.0.duration_ms']).toBe(50)
    expect(span.attributes['yyc3.tool.0.is_error']).toBe(false)
    expect(span.attributes['yyc3.tool.1.name']).toBe('web_search')
    expect(span.attributes['yyc3.tool.1.is_error']).toBe(true)
    expect(span.attributes['yyc3.tool.2.name']).toBeUndefined()

    const empty = traceToOtelSpan(makeTrace())
    expect(empty.attributes['yyc3.tool.0.name']).toBeUndefined()
  })

  it('exportTracesToOtel：批量结构与资源/scope 标识；空数组输出空 spans', () => {
    const result = exportTracesToOtel([makeTrace(), makeTrace({ id: 'trace_def_456' }), makeTrace()])
    expect(result.resourceSpans).toHaveLength(1)
    const resource = result.resourceSpans[0].resource.attributes
    expect(resource).toEqual({
      'service.name': 'yyc3-ai-pai',
      'service.version': '1.0.0',
      'telemetry.sdk.name': 'yyc3-web',
      'telemetry.sdk.language': 'typescript',
    })
    const scope = result.resourceSpans[0].scopeSpans[0]
    expect(scope.scope).toEqual({ name: 'yyc3.ai.trace', version: '1.0.0' })
    expect(scope.spans).toHaveLength(3)

    const empty = exportTracesToOtel([])
    expect(empty.resourceSpans[0].scopeSpans[0].spans).toEqual([])
  })

  it('GENAI_ATTRIBUTES 关键键名对齐 OTel GenAI 语义约定', () => {
    expect(GENAI_ATTRIBUTES.OPERATION).toBe('gen_ai.operation.name')
    expect(GENAI_ATTRIBUTES.SYSTEM).toBe('gen_ai.system')
    expect(GENAI_ATTRIBUTES.MODEL).toBe('gen_ai.request.model')
    expect(GENAI_ATTRIBUTES.PROVIDER).toBe('gen_ai.provider.name')
    expect(GENAI_ATTRIBUTES.TOTAL_TOKENS).toBe('gen_ai.usage.total_tokens')
    expect(GENAI_ATTRIBUTES.RESPONSE_ID).toBe('gen_ai.response.id')
  })

  it('downloadOtelExport：Blob 下载链路——createObjectURL/click/revoke 依序发生且文件名带日期', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const created: HTMLAnchorElement[] = []
    const originalCreate = document.createElement.bind(document)
    const createSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = originalCreate(tag)
        if (tag === 'a') created.push(el as HTMLAnchorElement)
        return el
      })
    const revokeSpy = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:mock-url'),
      writable: true,
      configurable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeSpy,
      writable: true,
      configurable: true,
    })
    try {
      downloadOtelExport([makeTrace()])

      // createObjectURL 收到 Blob 且 JSON 内容为 OTLP 结构
      const createMock = URL.createObjectURL as ReturnType<typeof vi.fn>
      const blobArg = createMock.mock.calls[0][0] as Blob
      expect(blobArg).toBeInstanceOf(Blob)
      expect(blobArg.type).toBe('application/json')

      // 触发下载：a.href/a.download 就位后 click，随后回收 URL
      expect(created).toHaveLength(1)
      expect(created[0].href).toBe('blob:mock-url')
      expect(created[0].download).toMatch(/^yyc3-otel-traces-\d{4}-\d{2}-\d{2}\.json$/)
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
      expect(createSpy).toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(URL, 'createObjectURL')
      Reflect.deleteProperty(URL, 'revokeObjectURL')
    }
  })

  it('sendToOTLPCollector：2xx 上报成功返回 true，POST 体为 OTLP 结构且合并自定义头', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({ ok: true, status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendToOTLPCollector([makeTrace()], 'https://otel.example.com/v1/traces', {
      Authorization: 'Bearer ' + 'token-片段',
    })

    expect(result).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [endpoint, init] = fetchMock.mock.calls[0]
    expect(endpoint).toBe('https://otel.example.com/v1/traces')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-片段',
    })
    const body = JSON.parse(String(init.body)) as {
      resourceSpans: { scopeSpans: { spans: unknown[] }[] }[]
    }
    expect(body.resourceSpans[0].scopeSpans[0].spans).toHaveLength(1)
  })

  it('sendToOTLPCollector：非 2xx 响应返回 false', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({ ok: false, status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendToOTLPCollector([makeTrace()], 'https://otel.example.com/v1/traces')).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sendToOTLPCollector：网络异常返回 false 不向外抛出', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('网络断开') }))
    expect(await sendToOTLPCollector([makeTrace()], 'https://otel.example.com/v1/traces')).toBe(false)
  })

  it('sendToOTLPCollector：空 traces 仍成功上报（spans 为空数组）', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({ ok: true, status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendToOTLPCollector([], 'https://otel.example.com/v1/traces')).toBe(true)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body)) as {
      resourceSpans: { scopeSpans: { spans: unknown[] }[] }[]
    }
    expect(body.resourceSpans[0].scopeSpans[0].spans).toEqual([])
  })
})
