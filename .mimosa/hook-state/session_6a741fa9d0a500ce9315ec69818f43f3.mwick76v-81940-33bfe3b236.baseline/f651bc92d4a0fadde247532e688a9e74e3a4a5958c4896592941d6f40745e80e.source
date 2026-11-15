/**
 * file stream-manager.ts
 * description 流式输出管理器
 * module @yyc3/ai-hub
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-05-19
 * updated 2026-05-19
 * status active
 * tags [streaming]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 流式输出管理器
 */

import { StreamChunk, StreamingOptions } from './stream-types'

type ChunkListener = (chunk: StreamChunk) => void

export class StreamManager {
  private listeners: ChunkListener[] = []
  private aborted = false

  onChunk(listener: ChunkListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  emit(chunk: StreamChunk): void {
    if (this.aborted) return
    for (const listener of this.listeners) {
      listener(chunk)
    }
  }

  emitText(content: string, agentId?: string): void {
    this.emit({
      type: 'text',
      content,
      agentId,
      timestamp: Date.now(),
    })
  }

  emitThinking(content: string, agentId?: string): void {
    this.emit({
      type: 'thinking',
      content,
      agentId,
      timestamp: Date.now(),
    })
  }

  emitToolCall(content: string, agentId?: string): void {
    this.emit({
      type: 'tool_call',
      content,
      agentId,
      timestamp: Date.now(),
    })
  }

  emitDone(): void {
    this.emit({
      type: 'done',
      content: '',
      timestamp: Date.now(),
    })
  }

  emitError(error: string): void {
    this.emit({
      type: 'error',
      content: error,
      timestamp: Date.now(),
    })
  }

  abort(): void {
    this.aborted = true
  }

  isAborted(): boolean {
    return this.aborted
  }

  reset(): void {
    this.aborted = false
    this.listeners = []
  }

  static createChunk(type: StreamChunk['type'], content: string, agentId?: string): StreamChunk {
    return { type, content, agentId, timestamp: Date.now() }
  }
}

export async function* createStreamGenerator(
  source: ReadableStream<Uint8Array> | null,
  options?: StreamingOptions
): AsyncGenerator<StreamChunk> {
  if (!source) {
    yield StreamManager.createChunk('done', '')
    return
  }

  const reader = source.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      if (options?.signal?.aborted) {
        yield StreamManager.createChunk('done', '')
        break
      }

      const { done, value } = await reader.read()
      if (done) {
        yield StreamManager.createChunk('done', '')
        break
      }

      const text = decoder.decode(value, { stream: true })
      yield StreamManager.createChunk('text', text)
    }
  } catch (error) {
    yield StreamManager.createChunk('error', String(error))
  } finally {
    reader.releaseLock()
  }
}

export function collectStream(chunks: StreamChunk[]): string {
  return chunks
    .filter(c => c.type === 'text')
    .map(c => c.content)
    .join('')
}
