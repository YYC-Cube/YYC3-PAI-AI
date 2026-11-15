/**
 * file stream-types.ts
 * description 流式输出类型定义
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-05-19
 * updated 2026-05-19
 * status active
 * tags [streaming],[types]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 流式输出类型定义
 */

export type StreamChunkType = 'text' | 'tool_call' | 'thinking' | 'done' | 'error'

export interface StreamChunk {
  type: StreamChunkType
  content: string
  agentId?: string
  timestamp: number
}

export interface StreamingOptions {
  onChunk?: (chunk: StreamChunk) => void
  signal?: AbortSignal
}
