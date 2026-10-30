/**
 * @file otel-adapter.ts
 * @description E1-4 OTel 语义对齐 — trace 字段名对齐 GenAI 语义约定 + JSON 导出
 *
 * 对标：OpenTelemetry GenAI Semantic Conventions (2026)
 * 参考：https://opentelemetry.io/docs/specs/semconv/gen-ai/
 *
 * 将内部 TraceRecord 映射为 OTel 兼容的 Span 格式，可直接发送到
 * OTLP collector（Jaeger/Zipkin/Tempo/Langfuse）或导出 JSON 分析。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags otel,opentelemetry,semconv,genai,trace,export,phase-e1
 */

import type { TraceRecord } from './trace-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('otel-adapter')

// ===== OTel GenAI Semantic Convention 字段名 =====
// https://opentelemetry.io/docs/specs/semconv/gen-ai/

export const GENAI_ATTRIBUTES = {
  // Span 基础
  OPERATION: 'gen_ai.operation.name',
  SYSTEM: 'gen_ai.system',
  MODEL: 'gen_ai.request.model',
  PROVIDER: 'gen_ai.provider.name',

  // 请求指标
  INPUT_TOKENS: 'gen_ai.usage.input_tokens',
  OUTPUT_TOKENS: 'gen_ai.usage.output_tokens',
  TOTAL_TOKENS: 'gen_ai.usage.total_tokens',
  COST: 'gen_ai.usage.cost',

  // 响应
  FINISH_REASON: 'gen_ai.response.finish_reason',
  RESPONSE_ID: 'gen_ai.response.id',

  // 延迟
  FIRST_TOKEN_LATENCY: 'gen_ai.response.first_token_latency_ms',
  TOTAL_LATENCY: 'gen_ai.response.total_latency_ms',

  // Prompt
  PROMPT_TEMPLATE: 'gen_ai.prompt.template',
  PROMPT_VERSION: 'gen_ai.prompt.version',

  // 工具
  TOOL_NAME: 'gen_ai.tool.name',
  TOOL_CALL_ID: 'gen_ai.tool.call.id',
  TOOL_DESCRIPTION: 'gen_ai.tool.description',
  TOOL_DURATION: 'gen_ai.tool.duration_ms',
} as const

// ===== OTel Span 格式 =====

export interface OTelSpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  kind: 'INTERNAL' | 'SERVER' | 'CLIENT'
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes: Record<string, string | number | boolean>
  status: { code: 'OK' | 'ERROR'; message?: string }
  resource: Record<string, string>
}

export interface OTelExport {
  resourceSpans: Array<{
    resource: { attributes: Record<string, string> }
    scopeSpans: Array<{
      scope: { name: string; version: string }
      spans: OTelSpan[]
    }>
  }>
}

// ===== 转换 =====

/**
 * 将内部 TraceRecord 转换为 OTel Span
 */
export function traceToOtelSpan(trace: TraceRecord): OTelSpan {
  const startNano = `${trace.timestamp * 1_000_000}`
  const endNano = `${(trace.timestamp + trace.totalMs) * 1_000_000}`

  const attributes: Record<string, string | number | boolean> = {
    // GenAI 语义约定字段
    [GENAI_ATTRIBUTES.OPERATION]: 'chat',
    [GENAI_ATTRIBUTES.SYSTEM]: trace.provider,
    [GENAI_ATTRIBUTES.MODEL]: trace.model,
    [GENAI_ATTRIBUTES.PROVIDER]: trace.provider,
    [GENAI_ATTRIBUTES.INPUT_TOKENS]: trace.inputTokens,
    [GENAI_ATTRIBUTES.OUTPUT_TOKENS]: trace.outputTokens,
    [GENAI_ATTRIBUTES.TOTAL_TOKENS]: trace.inputTokens + trace.outputTokens,
    [GENAI_ATTRIBUTES.FIRST_TOKEN_LATENCY]: trace.firstTokenMs,
    [GENAI_ATTRIBUTES.TOTAL_LATENCY]: trace.totalMs,
    [GENAI_ATTRIBUTES.COST]: trace.costUsd,
    [GENAI_ATTRIBUTES.FINISH_REASON]: trace.success ? 'stop' : 'error',
    [GENAI_ATTRIBUTES.RESPONSE_ID]: trace.id,

    // 自定义扩展（非 OTel 标准，前缀 yyc3）
    'yyc3.prompt.preview': trace.promptPreview,
    'yyc3.completion.preview': trace.completion.slice(0, 200),
    'yyc3.agent.iterations': trace.iterations,
    'yyc3.tool.call_count': trace.toolCalls.length,
  }

  // 工具调用作为嵌套属性
  trace.toolCalls.forEach((tc, i) => {
    attributes[`yyc3.tool.${i}.name`] = tc.tool
    attributes[`yyc3.tool.${i}.duration_ms`] = tc.durationMs
    attributes[`yyc3.tool.${i}.is_error`] = tc.isError
  })

  return {
    traceId: trace.id.replace(/[^a-f0-9]/g, '').padEnd(32, '0').slice(0, 32),
    spanId: Math.abs(trace.timestamp % 0xffffffff).toString(16).padStart(16, '0'),
    name: `gen_ai.${trace.provider}.${trace.model}`,
    kind: 'CLIENT',
    startTimeUnixNano: startNano,
    endTimeUnixNano: endNano,
    attributes,
    status: trace.success
      ? { code: 'OK' }
      : { code: 'ERROR', message: trace.errorMessage || 'Unknown error' },
    resource: {
      'service.name': 'yyc3-ai-pai',
      'service.version': '1.0.0',
      'telemetry.sdk.name': 'yyc3-web',
    },
  }
}

/**
 * 批量导出为 OTel JSON 格式
 * 可直接 POST 到 OTLP HTTP collector 或保存为文件分析
 */
export function exportTracesToOtel(traces: TraceRecord[]): OTelExport {
  const spans = traces.map(traceToOtelSpan)
  logger.info(`Exporting ${spans.length} traces to OTel format`)

  return {
    resourceSpans: [{
      resource: {
        attributes: {
          'service.name': 'yyc3-ai-pai',
          'service.version': '1.0.0',
          'telemetry.sdk.name': 'yyc3-web',
          'telemetry.sdk.language': 'typescript',
        },
      },
      scopeSpans: [{
        scope: { name: 'yyc3.ai.trace', version: '1.0.0' },
        spans,
      }],
    }],
  }
}

/**
 * 导出为 JSON 文件（供 Langfuse/Jaeger 等导入分析）
 */
export function downloadOtelExport(traces: TraceRecord[]): void {
  const export_ = exportTracesToOtel(traces)
  const blob = new Blob([JSON.stringify(export_, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `yyc3-otel-traces-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 发送到 OTLP HTTP endpoint（如 Tempo/Jaeger/Langfuse）
 */
export async function sendToOTLPCollector(
  traces: TraceRecord[],
  endpoint: string,
  headers?: Record<string, string>,
): Promise<boolean> {
  const export_ = exportTracesToOtel(traces)
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(export_),
    })
    if (!resp.ok) {
      logger.warn(`OTLP collector returned ${resp.status}`)
      return false
    }
    logger.info(`Sent ${traces.length} traces to OTLP collector`)
    return true
  } catch (e) {
    logger.warn('Failed to send to OTLP collector', e as Error)
    return false
  }
}
