/**
 * @file local-model-client.ts
 * @description 本地模型统一API调用层 — OpenAI兼容接口封装
 * 支持: 对话/流式对话/嵌入/重排序/视觉理解
 * @author YYC³ Team
 * @version v1.0.0
 * @created 2026-06-03
 * @status stable
 */

import { routeTask, type RouteResult, type TaskType } from './model-router'

// ===== 对话接口 =====

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ChatResult {
  content: string
  modelName: string
  nodeId: string
  latencyMs: number
  tokensUsed?: number
}

/** 向本地模型发送对话请求（非流式） */
export async function chat(
  messages: ChatMessage[],
  taskType: TaskType = 'chat',
  options?: ChatOptions
): Promise<ChatResult> {
  const route = await routeTask(taskType)
  if (!route) {
    throw new Error(`没有可用的本地模型处理任务: ${taskType}`)
  }

  const start = performance.now()
  const body: Record<string, unknown> = {
    model: route.modelName,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
    stream: false,
  }

  const resp = await fetch(route.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => 'unknown')
    throw new Error(`本地模型请求失败 [${resp.status}]: ${errText.slice(0, 200)}`)
  }

  const data = await resp.json() as Record<string, unknown>
  const latencyMs = Math.round(performance.now() - start)

  const choice = (data.choices as Array<Record<string, unknown>> | undefined)?.[0]
  const content = (choice?.message as Record<string, unknown> | undefined)?.content as string ?? ''
  const usage = data.usage as Record<string, unknown> | undefined
  const tokensUsed = usage ? (usage.total_tokens as number) : undefined

  return {
    content,
    modelName: route.modelName,
    nodeId: route.nodeId,
    latencyMs,
    tokensUsed,
  }
}

/** 向本地模型发送流式对话请求 */
export async function chatStream(
  messages: ChatMessage[],
  taskType: TaskType = 'chat',
  options?: ChatOptions
): Promise<{
  stream: AsyncIterable<string>
  route: RouteResult
}> {
  const route = await routeTask(taskType)
  if (!route) {
    throw new Error(`没有可用的本地模型处理任务: ${taskType}`)
  }

  const body: Record<string, unknown> = {
    model: route.modelName,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
    stream: true,
  }

  const resp = await fetch(route.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => 'unknown')
    throw new Error(`本地模型流式请求失败 [${resp.status}]: ${errText.slice(0, 200)}`)
  }

  const bodyReader = resp.body?.getReader()
  if (!bodyReader) {
    throw new Error('响应体不可读')
  }

  const decoder = new TextDecoder()
  const reader: ReadableStreamDefaultReader<Uint8Array> = bodyReader

  async function* generate(): AsyncIterable<string> {
    try {
      // 21号修复：SSE 行可能跨网络分包——旧写法按 chunk 硬 split，跨行前半段被
      // startsWith 过滤、后半段 parse 失败被吞，增量文本静默丢失。改为跨 chunk 行缓冲 + 尾部 flush
      const linesFrom = function* (rawLine: string): Generator<string> {
        if (!rawLine.startsWith('data: ')) return
        const jsonStr = rawLine.slice(6).trim()
        if (!jsonStr || jsonStr === '[DONE]') return
        try {
          const parsed = JSON.parse(jsonStr) as Record<string, unknown>
          const choice = (parsed.choices as Array<Record<string, unknown>> | undefined)?.[0]
          const delta = choice?.delta as Record<string, unknown> | undefined
          const content = delta?.content as string ?? ''
          if (content) yield content
        } catch {
          // skip parse errors
        }
      }

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          buffer += decoder.decode()
          for (const line of buffer.split('\n')) yield* linesFrom(line)
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) yield* linesFrom(line)
      }
    } finally {
      reader.releaseLock()
    }
  }

  return { stream: generate(), route }
}

// ===== 嵌入接口 =====

export interface EmbeddingResult {
  embedding: number[]
  modelName: string
  nodeId: string
  latencyMs: number
}

/** 生成文本嵌入（自动路由到 Qwen3-Embedding-8B 等） */
export async function embed(text: string): Promise<EmbeddingResult> {
  const route = await routeTask('embedding')
  if (!route) {
    throw new Error('没有可用的本地嵌入模型')
  }

  const start = performance.now()
  // 嵌入使用专用端点
  const embedEndpoint = route.endpoint.replace('/chat/completions', '/embeddings')

  const resp = await fetch(embedEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: route.modelName,
      input: text,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => 'unknown')
    // 回退到 chat/completions 格式
    const fallbackResp = await fetch(route.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: route.modelName,
        messages: [{ role: 'user', content: `嵌入以下文本: ${text}` }],
        max_tokens: 256,
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!fallbackResp.ok) {
      // 22号附带修复：双失败时报回退端点的真实原因（旧文案只复述首端点 errText，排障误导）
      const fbErrText = await fallbackResp.text().catch(() => 'unknown')
      throw new Error(`嵌入请求失败: ${errText.slice(0, 200)}；回退亦失败: ${fbErrText.slice(0, 200)}`)
    }
    const fbData = await fallbackResp.json().catch(() => null) as
      { choices?: Array<{ message?: { content?: string } }> } | null
    const fbContent = fbData?.choices?.[0]?.message?.content ?? ''
    // 22号修复：旧实现回退"成功"却返回恒空向量——调用方拿到成功结果但无数据。
    // chat 回退无法产生真实向量：解析逗号分隔数字，失败则如实抛错
    const parsed = fbContent.split(/[\[\],\s]+/).filter(x => x !== '').map(Number).filter(n => Number.isFinite(n))
    if (parsed.length === 0) {
      throw new Error('嵌入回退响应不含可解析的向量数据')
    }
    const latencyMs = Math.round(performance.now() - start)
    return {
      embedding: parsed,
      modelName: route.modelName,
      nodeId: route.nodeId,
      latencyMs,
    }
  }

  const data = await resp.json() as Record<string, unknown>
  const latencyMs = Math.round(performance.now() - start)

  const embData = (data.data as Array<Record<string, unknown>> | undefined)?.[0]
  const embedding = embData?.embedding as number[] ?? []

  return {
    embedding,
    modelName: route.modelName,
    nodeId: route.nodeId,
    latencyMs,
  }
}

// ===== 重排序接口 =====

export interface RerankResult {
  scores: number[]
  modelName: string
  nodeId: string
  latencyMs: number
}

/** 重排序（自动路由到 Qwen3-Reranker-8B 等） */
export async function rerank(
  query: string,
  documents: string[]
): Promise<RerankResult> {
  const route = await routeTask('reranker')
  if (!route) {
    throw new Error('没有可用的本地重排序模型')
  }

  const start = performance.now()
  // 尝试专用 rerank 端点
  const rerankEndpoint = route.endpoint.replace('/chat/completions', '/rerank')

  const resp = await fetch(rerankEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: route.modelName,
      query,
      documents,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!resp.ok) {
    // 回退：使用对话模型逐条评分
    const scores = await Promise.all(
      documents.map(async (doc) => {
        try {
          const result = await chat([
            { role: 'system', content: '请评估以下文档与查询的相关性，返回0-1之间的分数，仅输出数字。' },
            { role: 'user', content: `查询: ${query}\n文档: ${doc}` },
          ], 'reranker', { temperature: 0.1, maxTokens: 10 })
          const score = parseFloat(result.content.trim())
          return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score))
        } catch {
          return 0.5
        }
      })
    )
    const latencyMs = Math.round(performance.now() - start)
    return { scores, modelName: route.modelName, nodeId: route.nodeId, latencyMs }
  }

  const data = await resp.json() as Record<string, unknown>
  const latencyMs = Math.round(performance.now() - start)

  const results = data.results as Array<Record<string, unknown>> | undefined
  const scores = results?.map(r => r.relevance_score as number) ?? []

  return { scores, modelName: route.modelName, nodeId: route.nodeId, latencyMs }
}

// ===== 视觉理解接口 =====

export interface VisionResult {
  description: string
  modelName: string
  nodeId: string
  latencyMs: number
}

/** 图像理解（自动路由到 MiniCPM-V / CogAgent 等） */
export async function vision(
  imageUrl: string,
  prompt: string = '请描述这张图片的内容'
): Promise<VisionResult> {
  const route = await routeTask('vision')
  if (!route) {
    throw new Error('没有可用的本地视觉模型')
  }

  const start = performance.now()

  const messages = [
    {
      role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ]
    },
  ]

  const resp = await fetch(route.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: route.modelName,
      messages,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => 'unknown')
    throw new Error(`视觉模型请求失败 [${resp.status}]: ${errText.slice(0, 200)}`)
  }

  const data = await resp.json() as Record<string, unknown>
  const latencyMs = Math.round(performance.now() - start)

  const choice = (data.choices as Array<Record<string, unknown>> | undefined)?.[0]
  const content = (choice?.message as Record<string, unknown> | undefined)?.content as string ?? ''

  return {
    description: content,
    modelName: route.modelName,
    nodeId: route.nodeId,
    latencyMs,
  }
}

// ===== 工具函数 =====

/** 构建带系统提示的消息列表 */
export function buildMessages(
  userMessage: string,
  systemPrompt?: string
): ChatMessage[] {
  const messages: ChatMessage[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userMessage })
  return messages
}

/** 快速单轮对话 */
export async function quickChat(
  prompt: string,
  taskType: TaskType = 'chat',
  systemPrompt?: string
): Promise<string> {
  const messages = buildMessages(prompt, systemPrompt)
  const result = await chat(messages, taskType)
  return result.content
}
