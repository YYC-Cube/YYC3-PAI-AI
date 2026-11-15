/**
 * @file code-indexer.test.ts
 * @description RAG 代码索引专项 — 内存 IDB + mock 推理引擎/git，驱动 chunking/检索/上下文构建全路径
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMemoryIDB } from '../../../test/helpers/memory-idb'

const idb = createMemoryIDB()
Object.defineProperty(globalThis, 'indexedDB', { value: idb.indexedDB, writable: true })

const { runEmbedding, isPipelineLoaded, loadPipeline } = vi.hoisted(() => ({
  runEmbedding: vi.fn(),
  isPipelineLoaded: vi.fn(),
  loadPipeline: vi.fn(),
}))

vi.mock('../local-inference-engine', () => ({
  runEmbedding,
  isPipelineLoaded,
  loadPipeline,
}))

vi.mock('../git-service', () => ({
  gitEngine: {
    listFiles: vi.fn(),
    readFile: vi.fn(),
  },
}))

import { gitEngine } from '../git-service'
import {
  indexWorkspace, searchCode, buildRagContext, getIndexStats, clearIndex,
} from '../code-indexer'

/** 确定性 embedding：内容哈希映射到固定向量，同文本同向量 */
const vecOf = (s: string): number[] => {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 997
  return [h % 10, (h >> 2) % 10, 1]
}

beforeEach(async () => {
  vi.clearAllMocks()
  await clearIndex()
  vi.mocked(gitEngine.listFiles).mockResolvedValue([])
  vi.mocked(gitEngine.readFile).mockResolvedValue('')
  isPipelineLoaded.mockReturnValue(true)
  loadPipeline.mockResolvedValue(undefined)
  runEmbedding.mockImplementation(async (_m: string, text: string) => vecOf(text))
})

describe('code-indexer 索引管线', () => {
  it('chunkFile 语义：函数/类/import/注释 块类型推断 + 语言映射', async () => {
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['a.ts', 'b.py'])
    vi.mocked(gitEngine.readFile).mockImplementation(async (f: string) =>
      f === 'a.ts'
        ? 'export function hello() {\n  return 1\n}\n'
        : 'import os\n# 注释块内容较长\n',
    )
    const { total, indexed } = await indexWorkspace()
    expect(total).toBe(2)
    expect(indexed).toBe(2)
    const chunks = idb.dump('chunks')
    const a = chunks.find(c => c.filePath === 'a.ts')!
    expect(a.kind).toBe('function')
    expect(a.language).toBe('typescript')
    const b = chunks.find(c => c.filePath === 'b.py')!
    expect(b.language).toBe('python')
  })

  it('空/极短块被跳过（<10 可见字符）', async () => {
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['empty.ts'])
    vi.mocked(gitEngine.readFile).mockResolvedValue('\n\n   \n')
    await indexWorkspace()
    expect(idb.dump('chunks')).toHaveLength(0)
  })

  it('模型未加载时先 loadPipeline 并透传进度', async () => {
    isPipelineLoaded.mockReturnValue(false)
    // mock 实现：模拟加载过程回调 onProgress(pct, note)
    loadPipeline.mockImplementation(async (_m: string, cfg: { onProgress?: (pct: number, note: string) => void }) => {
      cfg?.onProgress?.(50, 'downloading')
    })
    vi.mocked(gitEngine.listFiles).mockResolvedValue([])
    const progress: string[] = []
    await indexWorkspace(p => progress.push(p.current))
    expect(loadPipeline).toHaveBeenCalledWith('codebert-base', expect.objectContaining({ onProgress: expect.any(Function) }))
    expect(progress.some(c => c.includes('加载模型'))).toBe(true)
  })

  it('单文件读取失败不中断索引（容错继续）', async () => {
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['bad.ts', 'good.ts'])
    vi.mocked(gitEngine.readFile).mockImplementation(async (f: string) => {
      if (f === 'bad.ts') throw new Error('ENOENT')
      return 'const meaningful = "content here"\n'
    })
    const { total, indexed } = await indexWorkspace()
    expect(total).toBe(2)
    expect(indexed).toBe(1)
    expect(idb.dump('chunks').every(c => c.filePath === 'good.ts')).toBe(true)
  })

  it('onProgress 逐文件上报', async () => {
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['f1.ts', 'f2.ts'])
    vi.mocked(gitEngine.readFile).mockResolvedValue('const a = 1 // meaningful\n')
    const seen: string[] = []
    await indexWorkspace(p => seen.push(p.current))
    expect(seen).toContain('开始索引')
    expect(seen).toContain('f1.ts')
    expect(seen).toContain('f2.ts')
  })
})

describe('code-indexer 语义检索', () => {
  beforeEach(async () => {
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['target.ts'])
    vi.mocked(gitEngine.readFile).mockResolvedValue('export function cosineSimilarity(a, b) {\n  return dot(a, b)\n}\n')
    await indexWorkspace()
  })

  it('模型未加载 → 空结果（守卫）', async () => {
    isPipelineLoaded.mockReturnValue(false)
    expect(await searchCode('anything')).toEqual([])
  })

  it('命中相同文本 → 相似度≈1 排第一，格式化为 RetrievalResult', async () => {
    // 与索引内容同文本（chunk content = 文件全文含尾换行）
    const query = 'export function cosineSimilarity(a, b) {\n  return dot(a, b)\n}\n'
    const results = await searchCode(query, 5)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].similarity).toBeGreaterThan(0.9)
    expect(results[0].chunk.kind).toBe('function')
  })

  it('低于 0.3 阈值的结果被过滤（正交向量）', async () => {
    await clearIndex()
    // 受控向量：索引内容 → [1,0,0]，QMISS 查询 → [0,1,0]，余弦=0
    runEmbedding.mockImplementation(async (_m: string, text: string) =>
      text === 'QMISS' ? [0, 1, 0] : [1, 0, 0])
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['ortho.ts'])
    vi.mocked(gitEngine.readFile).mockResolvedValue('const ortho = "indexed chunk"\n')
    await indexWorkspace()
    const results = await searchCode('QMISS')
    expect(results).toEqual([])
  })

  it('topK 截断', async () => {
    const r1 = await searchCode('cosine', 1)
    expect(r1.length).toBeLessThanOrEqual(1)
  })
})

describe('code-indexer RAG 上下文与统计', () => {
  beforeEach(async () => {
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['svc.ts'])
    vi.mocked(gitEngine.readFile).mockResolvedValue('export function hello() {\n  return "world content"\n}\n')
    await indexWorkspace()
  })

  it('buildRagContext：命中时输出带文件定位的代码块；无命中空串', async () => {
    await clearIndex()
    // 受控向量：命中查询与索引同向，MISS 查询正交
    runEmbedding.mockImplementation(async (_m: string, text: string) =>
      text === 'QMISS' ? [0, 1, 0] : [1, 0, 0])
    vi.mocked(gitEngine.listFiles).mockResolvedValue(['svc.ts'])
    vi.mocked(gitEngine.readFile).mockResolvedValue('export function hello() {\n  return "world content"\n}\n')
    await indexWorkspace()

    const ctx = await buildRagContext('QHIT')
    expect(ctx).toContain('svc.ts:1-4')
    expect(ctx).toContain('```typescript')
    expect(ctx).toContain('相似度')
    expect(await buildRagContext('QMISS')).toBe('')
  })

  it('getIndexStats：chunk 数/文件数/最近索引时间', async () => {
    const stats = await getIndexStats()
    expect(stats.totalChunks).toBe(1)
    expect(stats.totalFiles).toBe(1)
    expect(stats.lastIndexed).toBeGreaterThan(0)
  })

  it('clearIndex 后统计归零', async () => {
    await clearIndex()
    expect(await getIndexStats()).toEqual({ totalChunks: 0, totalFiles: 0, lastIndexed: 0 })
  })
})
