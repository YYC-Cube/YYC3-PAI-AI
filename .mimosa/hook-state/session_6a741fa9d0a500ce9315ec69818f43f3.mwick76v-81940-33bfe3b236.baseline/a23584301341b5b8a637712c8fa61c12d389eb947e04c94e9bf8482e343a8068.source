/**
 * @file sandbox-client.ts
 * @description P2.3 沙箱客户端 — 主线程管理 Web Worker 代码沙箱
 *
 * 提供 Promise 化的 execute() API，管理 Worker 生命周期、超时熔断、输出限制。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags sandbox,client,worker,phase-2
 */

import type { SandboxRequest, SandboxResponse, SandboxConsoleEntry } from '../workers/code-sandbox.worker'
import { createLogger } from '../utils/logger'

const logger = createLogger('sandbox-client')

export type { SandboxConsoleEntry }

export interface ExecuteResult {
  success: boolean
  result: unknown
  console: SandboxConsoleEntry[]
  error?: string
  durationMs: number
}

const DEFAULT_TIMEOUT = 5000
const MAX_CODE_LENGTH = 10000 // 10KB 代码上限

export class SandboxClient {
  private worker: Worker | null = null
  private pending = new Map<string, { resolve: (r: SandboxResponse) => void; reject: (e: Error) => void }>()

  private ensureWorker(): Worker {
    if (this.worker) return this.worker

    this.worker = new Worker(
      new URL('../workers/code-sandbox.worker.ts', import.meta.url),
      { type: 'module' },
    )

    this.worker.onmessage = (e: MessageEvent<SandboxResponse>) => {
      const { id } = e.data
      const pending = this.pending.get(id)
      if (pending) {
        this.pending.delete(id)
        pending.resolve(e.data)
      }
    }

    this.worker.onerror = (e) => {
      logger.error('Sandbox worker error', e)
      // 拒绝所有待处理的请求
      for (const [id, p] of this.pending) {
        p.reject(new Error('Sandbox worker crashed'))
        this.pending.delete(id)
      }
    }

    return this.worker
  }

  /**
   * 执行代码（Promise 化）
   */
  async execute(code: string, timeoutMs: number = DEFAULT_TIMEOUT): Promise<ExecuteResult> {
    // 代码长度限制
    if (code.length > MAX_CODE_LENGTH) {
      return {
        success: false,
        result: null,
        console: [],
        error: `Code too long (${code.length} chars, max ${MAX_CODE_LENGTH})`,
        durationMs: 0,
      }
    }

    const id = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const worker = this.ensureWorker()

    const responsePromise = new Promise<SandboxResponse>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      // 超时保护
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id)
          reject(new Error(`Sandbox execution timeout (${timeoutMs}ms)`))
        }
      }, timeoutMs + 1000) // 比沙箱内超时多 1 秒缓冲
    })

    const request: SandboxRequest = { id, code, timeoutMs }
    worker.postMessage(request)

    try {
      const response = await responsePromise
      return {
        success: response.success,
        result: response.result,
        console: response.console,
        error: response.error,
        durationMs: response.durationMs,
      }
    } catch (e) {
      return {
        success: false,
        result: null,
        console: [],
        error: e instanceof Error ? e.message : String(e),
        durationMs: 0,
      }
    }
  }

  /**
   * 终止沙箱（清理 Worker）
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.pending.clear()
      logger.info('Sandbox worker terminated')
    }
  }

  get isAlive(): boolean {
    return this.worker !== null
  }
}

// ===== 单例 =====

let sandboxInstance: SandboxClient | null = null

export function getSandbox(): SandboxClient {
  if (!sandboxInstance) {
    sandboxInstance = new SandboxClient()
  }
  return sandboxInstance
}

export function terminateSandbox(): void {
  if (sandboxInstance) {
    sandboxInstance.terminate()
    sandboxInstance = null
  }
}
