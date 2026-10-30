/**
 * @file code-indexer.ts
 * @description 代码库语义索引（RAG）— chunk → embedding → IndexedDB 向量存储
 *
 * 对标：Continue.dev codebase indexing / Cursor 代码库搜索（纯前端版，Phase 1.2）
 *
 * 管线：
 *   1. 索引：文件列表 → 按函数/类 chunk → runEmbedding → IndexedDB 向量存储
 *   2. 检索：用户消息 → embedding → 余弦相似度 top-K → 上下文注入
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags rag,indexing,embedding,vector,phase-1
 */

import { runEmbedding, isPipelineLoaded, loadPipeline } from './local-inference-engine'
import { gitEngine } from './git-service'
import { createLogger } from '../utils/logger'

const logger = createLogger('code-indexer')
const DB_NAME = 'yyc3_code_index'
const STORE = 'chunks'
const CHUNK_SIZE = 50 // 行数
const CHUNK_OVERLAP = 10

// ===== Types =====

export interface CodeChunk {
  id: string
  filePath: string
  startLine: number
  endLine: number
  content: string
  /** 语言（从文件扩展名推断） */
  language: string
  /** chunk 类型 */
  kind: 'function' | 'class' | 'import' | 'block' | 'comment'
  /** embedding 向量 */
  embedding: number[]
  /** 索引时间 */
  indexedAt: number
}

export interface IndexProgress {
  total: number
  indexed: number
  current: string
}

export interface RetrievalResult {
  chunk: CodeChunk
  similarity: number
}

// ===== IndexedDB =====

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('filePath', 'filePath', { unique: false })
        store.createIndex('indexedAt', 'indexedAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ===== Chunking =====

const LANG_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', rs: 'rust', go: 'go', java: 'java', c: 'c', cpp: 'cpp',
  css: 'css', html: 'html', json: 'json', md: 'markdown', yml: 'yaml', yaml: 'yaml',
}

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  return LANG_MAP[ext] || 'text'
}

/** 按行分块（带重叠），标记函数/类/import 块 */
function chunkFile(filePath: string, content: string): Omit<CodeChunk, 'embedding' | 'indexedAt'>[] {
  const lines = content.split('\n')
  const language = getLanguage(filePath)
  const chunks: Omit<CodeChunk, 'embedding' | 'indexedAt'>[] = []

  let start = 0
  while (start < lines.length) {
    const end = Math.min(start + CHUNK_SIZE, lines.length)
    const block = lines.slice(start, end).join('\n')
    if (block.trim().length < 10) { // 跳过空/极短块
      start = end - CHUNK_OVERLAP
      continue
    }

    // 推断 chunk 类型
    let kind: CodeChunk['kind'] = 'block'
    const firstLine = block.split('\n')[0]?.trim() || ''
    if (/^(export\s+)?(async\s+)?function\s/.test(firstLine)) kind = 'function'
    else if (/^(export\s+)?(abstract\s+)?class\s/.test(firstLine)) kind = 'class'
    else if (/^import\s/.test(firstLine)) kind = 'import'
    else if (/^(\/\/|\/\*|#|<!--)/.test(firstLine)) kind = 'comment'

    chunks.push({
      id: `${filePath}:${start}-${end}`,
      filePath,
      startLine: start + 1,
      endLine: end,
      content: block,
      language,
      kind,
    })

    if (end >= lines.length) break
    start = end - CHUNK_OVERLAP
  }

  return chunks
}

// ===== 余弦相似度 =====

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// ===== Public API =====

/**
 * 索引整个工作区（gitEngine 文件列表）
 * 需先加载 embedding 模型（codebert-base）
 */
export async function indexWorkspace(
  onProgress?: (p: IndexProgress) => void,
): Promise<{ total: number; indexed: number }> {
  // 确保模型加载
  if (!isPipelineLoaded('codebert-base')) {
    await loadPipeline('codebert-base', {
      onProgress: (pct, note) => onProgress?.({ total: 0, indexed: 0, current: `加载模型 ${pct}% ${note}` }),
    })
  }

  const files = await gitEngine.listFiles()
  onProgress?.({ total: files.length, indexed: 0, current: '开始索引' })

  let indexed = 0
  for (const filePath of files) {
    try {
      const content = await gitEngine.readFile(filePath)
      const rawChunks = chunkFile(filePath, content)

      for (const chunk of rawChunks) {
        // 逐 chunk embedding
        const embedding = await runEmbedding('codebert-base', chunk.content)
        const full: CodeChunk = { ...chunk, embedding, indexedAt: Date.now() }
        await withStore('readwrite', store => store.put(full) as IDBRequest<IDBValidKey>)
      }

      indexed++
      onProgress?.({ total: files.length, indexed, current: filePath })
    } catch (e) {
      logger.warn(`Failed to index ${filePath}`, e as Error)
    }
  }

  logger.info(`Workspace indexed: ${indexed}/${files.length} files`)
  return { total: files.length, indexed }
}

/**
 * 语义检索：用户查询 → embedding → top-K 相似 chunk
 */
export async function searchCode(query: string, topK = 5): Promise<RetrievalResult[]> {
  if (!isPipelineLoaded('codebert-base')) {
    return [] // 模型未加载，无法检索
  }

  try {
    const queryEmbedding = await runEmbedding('codebert-base', query)
    const all = await withStore('readonly', store => store.getAll() as IDBRequest<CodeChunk[]>)
    const chunks = all as CodeChunk[]

    if (!chunks.length) return []

    const scored = chunks.map(chunk => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .filter(s => s.similarity > 0.3) // 相似度阈值
  } catch (e) {
    logger.warn('Search failed', e as Error)
    return []
  }
}

/**
 * 构建 RAG 上下文（注入 systemPrompt）
 * 返回格式化的代码片段上下文
 */
export async function buildRagContext(query: string, topK = 5): Promise<string> {
  const results = await searchCode(query, topK)
  if (!results.length) return ''

  const sections = results.map((r, i) => {
    const { chunk, similarity } = r
    return `### ${i + 1}. ${chunk.filePath}:${chunk.startLine}-${chunk.endLine} (相似度 ${(similarity * 100).toFixed(1)}%)
\`\`\`${chunk.language}
${chunk.content}
\`\`\``
  })

  return `\n\n---\n以下是从项目代码库检索到的相关代码片段（供参考）：\n\n${sections.join('\n\n')}\n---`
}

/** 获取索引统计 */
export async function getIndexStats(): Promise<{ totalChunks: number; totalFiles: number; lastIndexed: number }> {
  try {
    const all = await withStore('readonly', store => store.getAll() as IDBRequest<CodeChunk[]>)
    const chunks = all as CodeChunk[]
    const files = new Set(chunks.map(c => c.filePath))
    const lastIndexed = chunks.length ? Math.max(...chunks.map(c => c.indexedAt)) : 0
    return { totalChunks: chunks.length, totalFiles: files.size, lastIndexed }
  } catch {
    return { totalChunks: 0, totalFiles: 0, lastIndexed: 0 }
  }
}

/** 清空索引 */
export async function clearIndex(): Promise<void> {
  try {
    await withStore('readwrite', store => store.clear() as unknown as IDBRequest<undefined>)
  } catch { /* ignore */ }
}
