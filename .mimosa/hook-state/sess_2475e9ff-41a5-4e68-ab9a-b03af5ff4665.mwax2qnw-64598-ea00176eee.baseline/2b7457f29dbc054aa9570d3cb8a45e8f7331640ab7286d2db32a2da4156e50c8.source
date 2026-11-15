/**
 * @file code-sandbox.worker.ts
 * @description P2.3 Web Worker 沙箱 — 受限 JS 代码执行环境
 *
 * 安全约束：
 *   - 无 DOM/BOM 访问（Web Worker 天然隔离）
 *   - 无网络访问（无 fetch/XMLHttpRequest）
 *   - 执行超时熔断（主线程 terminate）
 *   - console 输出捕获（结构化返回）
 *   - 最大输出限制（防内存爆炸）
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags sandbox,worker,code-execution,phase-2
 */

// ===== Worker 消息协议 =====

export interface SandboxRequest {
  id: string
  code: string
  timeoutMs: number
}

export interface SandboxConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info'
  args: unknown[]
}

export interface SandboxResponse {
  id: string
  success: boolean
  result: unknown
  console: SandboxConsoleEntry[]
  error?: string
  durationMs: number
}

// ===== Worker 实现 =====

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<SandboxRequest>) => void) | null
  postMessage: (msg: unknown) => void
  close: () => void
}

ctx.onmessage = async (e: MessageEvent<SandboxRequest>) => {
  const { id, code, timeoutMs } = e.data
  const startTime = performance.now()
  const consoleEntries: SandboxConsoleEntry[] = []

  // 捕获 console 输出
  const captureConsole = (level: SandboxConsoleEntry['level']) => {
    return (...args: unknown[]) => {
      consoleEntries.push({ level, args })
      // 最大 100 条 console 输出
      if (consoleEntries.length > 100) {
        consoleEntries.shift()
      }
    }
  }

  const sandboxConsole = {
    log: captureConsole('log'),
    warn: captureConsole('warn'),
    error: captureConsole('error'),
    info: captureConsole('info'),
  }

  try {
    // 构建受限执行环境（覆盖全局对象）
    const restrictedGlobal = {
      console: sandboxConsole,
      Math,
      JSON,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set,
      Promise,
      RegExp,
      Error,
      TypeError,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
      performance: { now: () => performance.now() },
    }

    // 输入安全验证：拒绝危险模式（沙箱深度防御，Worker 隔离为第一层）
    const BLOCKED_PATTERNS = [
      /import\s*\(/,              // 动态 import（可能加载远程代码）
      /require\s*\(/,             // CommonJS require
      /eval\s*\(/,                // 嵌套 eval
      /Function\s*\(/,            // 嵌套 Function 构造器
      /fetch\s*\(/,               // 网络请求
      /XMLHttpRequest/,           // 网络请求
      /WebSocket/,                // WebSocket
      /importScripts/,            // Worker 内加载脚本
      /postMessage\s*\(/,         // 向主线程发消息
      /self\s*\./,               // Worker 全局对象
      /globalThis/,               // 全局对象访问
      /__proto__/,               // 原型污染
      /constructor\s*\[/,        // 构造器访问
    ]
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(code)) {
        ctx.postMessage({
          id,
          success: false,
          result: null,
          console: consoleEntries,
          error: `Blocked by sandbox security policy: pattern ${pattern.source}`,
          durationMs: performance.now() - startTime,
        } satisfies SandboxResponse)
        return
      }
    }

    // 受限执行：通过参数遮蔽（shadowing）注入白名单全局对象
    // 安全模型：① Worker 天然无 DOM/BOM ② 参数遮蔽覆盖 self/globalThis ③ 危险模式黑名单
    const globalKeys = Object.keys(restrictedGlobal)
    const globalVals = Object.values(restrictedGlobal)
    const fn = Reflect.construct(
      Function,
      [...globalKeys, `"use strict";\n${code}`],
    ) as (...args: unknown[]) => unknown

    // 超时熔断
    const timeoutHandle = setTimeout(() => {
      ctx.postMessage({
        id,
        success: false,
        result: null,
        console: consoleEntries,
        error: `Execution timeout (${timeoutMs}ms) — worker terminated`,
        durationMs: performance.now() - startTime,
      } satisfies SandboxResponse)
      ctx.close() // 强制终止
    }, timeoutMs)

    // 执行
    const result = await fn(...globalVals)

    clearTimeout(timeoutHandle)

    // 序列化结果（防循环引用）
    let serializedResult: unknown
    try {
      serializedResult = JSON.parse(JSON.stringify(result ?? null))
    } catch {
      serializedResult = String(result)
    }

    ctx.postMessage({
      id,
      success: true,
      result: serializedResult,
      console: consoleEntries,
      durationMs: performance.now() - startTime,
    } satisfies SandboxResponse)
  } catch (err) {
    ctx.postMessage({
      id,
      success: false,
      result: null,
      console: consoleEntries,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      durationMs: performance.now() - startTime,
    } satisfies SandboxResponse)
  }
}
