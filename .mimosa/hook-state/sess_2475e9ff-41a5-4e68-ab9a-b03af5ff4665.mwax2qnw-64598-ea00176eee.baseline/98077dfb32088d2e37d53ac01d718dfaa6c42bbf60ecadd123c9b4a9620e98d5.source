/**
 * @file data-portability-manager.ts
 * @description 数据可移植性管理器 v2.0.0 - 支持所有数据类型 + IndexedDB 数据 + 格式验证
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-04-08
 * @updated 2026-06-03
 * @status stable
 * @license MIT
 * @tags portability,export,import,migration,standardization
 */

import type { DataEntry, DataLocation, DataType } from '../store/unified-data-store'
import { createLogger } from '../utils/logger'
import { indexedDBService, type StoreRecord } from './indexeddb-service'
import { securityVault } from './security-vault'

const logger = createLogger('data-portability')

// ============================================================================
// 类型定义
// ============================================================================

export interface ExportOptions {
  format: 'json' | 'zip'
  includeEncrypted: boolean
  includeMetadata: boolean
  passphrase?: string
  compress: boolean
  prettyPrint: boolean
  entries?: string[]
  types?: DataType[]   // 按数据类型筛选
  includeIndexedDB?: boolean  // 是否包含 IndexedDB 数据
}

export interface ImportOptions {
  merge: boolean
  overwrite: boolean
  passphrase?: string
  validateChecksum: boolean
  skipErrors: boolean
  types?: DataType[]   // 只导入指定的数据类型
}

export interface ExportResult {
  blob: Blob
  filename: string
  size: number
  entries: number
  timestamp: number
  checksum: string
}

export interface ImportResult {
  success: boolean
  entries: number
  skipped: number
  errors: ImportError[]
  warnings: string[]
}

export interface ImportError {
  entryId: string
  error: string
  reason: 'invalid_format' | 'checksum_mismatch' | 'decryption_failed' | 'validation_failed' | 'unknown'
}

export interface DataPackage {
  version: string
  timestamp: number
  checksum: string
  entries: ExportableDataEntry[]
  indexedDBStores?: Record<string, unknown[]> // IndexedDB store 数据
  metadata: PackageMetadata
}

export interface ExportableDataEntry extends DataEntry {
  data?: string
}

export interface PackageMetadata {
  source: string
  platform: string
  version: string
  encrypted: boolean
  compression?: 'gzip' | 'none'
  totalEntries: number
  dataTypes: string[]
  hasIndexedDB: boolean
}

export interface MigrationPlan {
  id: string
  source: DataLocation
  target: DataLocation
  entries: DataEntry[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime?: number
  endTime?: number
  errors: string[]
}

/** 导入预览 - 在导入前查看包内容 */
export interface ImportPreview {
  valid: boolean
  packageVersion: string
  timestamp: number
  totalEntries: number
  dataTypes: string[]
  encrypted: boolean
  compression: string
  hasIndexedDB: boolean
  errors: string[]
  warnings: string[]
  sampleEntries: Array<{ id: string; type: string; size: number }>
}

// ============================================================================
// Schema 版本定义
// ============================================================================

const SUPPORTED_VERSIONS = ['1.0.0', '2.0.0']
const CURRENT_VERSION = '2.0.0'

// ============================================================================
// 数据可移植性管理器
// ============================================================================

export class DataPortabilityManager {
  private readonly SOURCE_NAME = 'YYC3-AI-PAI'

  // ==========================================================================
  // 导出功能
  // ==========================================================================

  async exportData(entries: DataEntry[], options: ExportOptions): Promise<ExportResult> {
    // 按 ID 或类型筛选
    let filteredEntries = entries
    if (options.entries && options.entries.length > 0) {
      filteredEntries = entries.filter(e => options.entries!.includes(e.id))
    }
    if (options.types && options.types.length > 0) {
      filteredEntries = filteredEntries.filter(e => options.types!.includes(e.type))
    }

    // 处理加密
    let processedEntries = filteredEntries
    if (!options.includeEncrypted) {
      processedEntries = processedEntries.filter(e => !e.encrypted)
    }
    if (options.passphrase) {
      processedEntries = await this.encryptEntries(processedEntries, options.passphrase)
    }

    // 收集 IndexedDB 数据
    let indexedDBStores: Record<string, unknown[]> | undefined
    if (options.includeIndexedDB) {
      indexedDBStores = await this.collectIndexedDBData()
    }

    // 统计数据类型的唯一值
    const dataTypes = [...new Set(processedEntries.map(e => e.type))]

    const dataPackage: DataPackage = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      checksum: '',
      entries: processedEntries,
      indexedDBStores,
      metadata: {
        source: this.SOURCE_NAME,
        platform: this.getPlatform(),
        version: CURRENT_VERSION,
        encrypted: !!options.passphrase,
        compression: options.compress ? 'gzip' : 'none',
        totalEntries: processedEntries.length,
        dataTypes,
        hasIndexedDB: !!indexedDBStores && Object.keys(indexedDBStores).length > 0,
      },
    }

    dataPackage.checksum = await this.calculateChecksum(dataPackage)

    let blob: Blob
    let filename: string

    switch (options.format) {
      case 'json':
        blob = await this.createJsonBlob(dataPackage, options.prettyPrint)
        filename = this.generateFilename('json', options.passphrase ? 'encrypted' : 'export')
        break
      case 'zip':
        blob = await this.createZipBlob(dataPackage, options.compress)
        filename = this.generateFilename('zip', options.passphrase ? 'encrypted' : 'export')
        break
      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }

    logger.info(`[Portability] Exported ${processedEntries.length} entries, ` +
      `${dataTypes.length} types, ${blob.size} bytes`)

    return {
      blob,
      filename,
      size: blob.size,
      entries: processedEntries.length,
      timestamp: dataPackage.timestamp,
      checksum: dataPackage.checksum,
    }
  }

  // ==========================================================================
  // 导入前预览
  // ==========================================================================

  /** 预览导入文件内容（不实际导入） */
  async previewImport(file: File): Promise<ImportPreview> {
    const preview: ImportPreview = {
      valid: false,
      packageVersion: '',
      timestamp: 0,
      totalEntries: 0,
      dataTypes: [],
      encrypted: false,
      compression: 'none',
      hasIndexedDB: false,
      errors: [],
      warnings: [],
      sampleEntries: [],
    }

    try {
      const dataPackage = await this.parseFile(file)
      if (!dataPackage) {
        preview.errors.push('Unable to parse file')
        return preview
      }

      // 验证版本兼容性
      if (!SUPPORTED_VERSIONS.includes(dataPackage.version)) {
        preview.warnings.push(
          `Package version ${dataPackage.version} may not be fully compatible ` +
          `(supported: ${SUPPORTED_VERSIONS.join(', ')})`
        )
      }

      preview.valid = true
      preview.packageVersion = dataPackage.version
      preview.timestamp = dataPackage.timestamp
      preview.totalEntries = dataPackage.entries.length
      preview.dataTypes = dataPackage.metadata.dataTypes || [...new Set(dataPackage.entries.map(e => e.type))]
      preview.encrypted = dataPackage.metadata.encrypted
      preview.compression = dataPackage.metadata.compression || 'none'
      preview.hasIndexedDB = !!dataPackage.indexedDBStores &&
        Object.keys(dataPackage.indexedDBStores).length > 0
      preview.sampleEntries = dataPackage.entries.slice(0, 10).map(e => ({
        id: e.id,
        type: e.type,
        size: e.size,
      }))

      // 安全警告
      if (dataPackage.metadata.encrypted && !dataPackage.version) {
        preview.warnings.push('Data is encrypted - passphrase required for import')
      }

    } catch (error) {
      preview.errors.push(`Failed to preview: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return preview
  }

  // ==========================================================================
  // 导入功能
  // ==========================================================================

  async importData(file: File, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      entries: 0,
      skipped: 0,
      errors: [],
      warnings: [],
    }

    try {
      const dataPackage = await this.parseFile(file)
      if (!dataPackage) {
        result.errors.push({
          entryId: 'file',
          error: 'Unable to parse file',
          reason: 'invalid_format',
        })
        return result
      }

      // 版本警告
      if (!SUPPORTED_VERSIONS.includes(dataPackage.version)) {
        result.warnings.push(
          `Package version ${dataPackage.version} may not be fully compatible`
        )
      }

      // checksum 验证
      if (options.validateChecksum) {
        const valid = await this.validateChecksum(dataPackage)
        if (!valid) {
          result.errors.push({
            entryId: 'package',
            error: 'Checksum validation failed - data may have been tampered with',
            reason: 'checksum_mismatch',
          })
          return result
        }
      }

      // 解密
      if (dataPackage.metadata.encrypted && !options.passphrase) {
        result.errors.push({
          entryId: 'package',
          error: 'Passphrase required for encrypted data',
          reason: 'decryption_failed',
        })
        return result
      }

      let entries = dataPackage.entries
      if (options.passphrase) {
        entries = await this.decryptEntries(entries, options.passphrase)
      }

      // 按类型筛选
      if (options.types && options.types.length > 0) {
        entries = entries.filter(e => options.types!.includes(e.type))
      }

      // 处理 IndexedDB 数据
      if (dataPackage.indexedDBStores) {
        try {
          await this.restoreIndexedDBData(dataPackage.indexedDBStores)
        } catch (error) {
          result.warnings.push(`IndexedDB restore partial: ${error}`)
        }
      }

      // 逐条处理
      for (const entry of entries) {
        try {
          const validation = this.validateEntry(entry)
          if (!validation.valid) {
            result.errors.push({
              entryId: entry.id,
              error: validation.error || 'Validation failed',
              reason: 'validation_failed',
            })
            result.skipped++
            if (!options.skipErrors) continue
          }

          // 写入 localStorage
          const lsKey = `yyc3_${entry.type}_${entry.id}`
          const existing = localStorage.getItem(lsKey)

          if (existing && !options.overwrite && !options.merge) {
            result.skipped++
            continue
          }

          if (existing && options.merge && entry.data) {
            try {
              const existingData = JSON.parse(existing)
              const newData = JSON.parse(entry.data)
              const merged = { ...existingData, ...newData }
              localStorage.setItem(lsKey, JSON.stringify(merged))
            } catch {
              localStorage.setItem(lsKey, entry.data || JSON.stringify(entry))
            }
          } else if (entry.data) {
            localStorage.setItem(lsKey, entry.data)
          }

          result.entries++
        } catch (error) {
          result.errors.push({
            entryId: entry.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            reason: 'unknown',
          })
          result.skipped++
          if (!options.skipErrors) return result
        }
      }

      result.success = result.errors.length === 0 || options.skipErrors
      logger.info(`[Portability] Imported ${result.entries} entries, ${result.skipped} skipped`)

    } catch (error) {
      result.errors.push({
        entryId: 'file',
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'invalid_format',
      })
    }

    return result
  }

  // ==========================================================================
  // IndexedDB 数据收集与恢复
  // ==========================================================================

  private async collectIndexedDBData(): Promise<Record<string, unknown[]>> {
    const stores: Record<string, unknown[]> = {}
    const storeNames = indexedDBService.getStoreNames()

    for (const storeName of storeNames) {
      try {
        const records = await indexedDBService.getAll(storeName)
        if (records.length > 0) {
          stores[storeName] = records
          logger.debug(`[Portability] Collected ${records.length} records from IndexedDB store: ${storeName}`)
        }
      } catch (error) {
        logger.warn(`[Portability] Failed to collect IndexedDB store ${storeName}:`, error)
      }
    }

    return stores
  }

  private async restoreIndexedDBData(stores: Record<string, unknown[]>): Promise<void> {
    for (const [storeName, records] of Object.entries(stores)) {
      let restored = 0
      for (const record of records) {
        try {
          const rec = record as StoreRecord
          if (rec.id) {
            await indexedDBService.set(storeName, rec.id, rec)
            restored++
          }
        } catch (error) {
          logger.warn(`[Portability] Failed to restore ${storeName} record:`, error)
        }
      }
      logger.info(`[Portability] Restored ${restored}/${records.length} records to IndexedDB store: ${storeName}`)
    }
  }

  // ==========================================================================
  // 文件解析
  // ==========================================================================

  private async parseFile(file: File): Promise<DataPackage | null> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'json':
        return this.parseJsonBlob(file)
      case 'zip':
        return this.parseZipBlob(file)
      default:
        // 尝试按 JSON 解析
        try {
          return await this.parseJsonBlob(file)
        } catch {
          return null
        }
    }
  }

  // ==========================================================================
  // 迁移功能
  // ==========================================================================

  createMigrationPlan(
    source: DataLocation,
    target: DataLocation,
    entries: DataEntry[]
  ): MigrationPlan {
    return {
      id: crypto.randomUUID(),
      source,
      target,
      entries,
      status: 'pending',
      progress: 0,
      errors: [],
    }
  }

  async executeMigration(
    plan: MigrationPlan,
    onProgress?: (progress: number) => void
  ): Promise<MigrationPlan> {
    plan.status = 'running'
    plan.startTime = Date.now()

    try {
      const total = plan.entries.length
      let processed = 0

      for (const entry of plan.entries) {
        try {
          entry.location = plan.target
          entry.lastModified = Date.now()

          processed++
          plan.progress = (processed / total) * 100
          onProgress?.(plan.progress)
        } catch (error) {
          plan.errors.push(
            `Failed to migrate ${entry.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      plan.status = plan.errors.length === 0 ? 'completed' : 'failed'
      plan.endTime = Date.now()
    } catch (error) {
      plan.status = 'failed'
      plan.endTime = Date.now()
      plan.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return plan
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  private async encryptEntries(entries: DataEntry[], _passphrase: string): Promise<ExportableDataEntry[]> {
    const encrypted: ExportableDataEntry[] = []
    for (const entry of entries) {
      if (entry.encrypted) {
        encrypted.push(entry)
        continue
      }

      const data = JSON.stringify(entry)
      const encoded = new TextEncoder().encode(data)
      const encryptedData = await securityVault.encrypt(encoded.buffer as ArrayBuffer)

      encrypted.push({
        ...entry,
        encrypted: true,
        data: this.arrayBufferToBase64(encryptedData.ciphertext),
      })
    }
    return encrypted
  }

  private async decryptEntries(entries: ExportableDataEntry[], _passphrase: string): Promise<DataEntry[]> {
    const decrypted: DataEntry[] = []
    for (const entry of entries) {
      if (!entry.encrypted || !entry.data) {
        decrypted.push(entry)
        continue
      }

      try {
        const ciphertext = this.base64ToArrayBuffer(entry.data)
        const decryptedData = await securityVault.decrypt({
          ciphertext,
          iv: new Uint8Array(12),
          salt: new Uint8Array(16),
          version: 1,
          algorithm: 'AES-GCM',
        })

        const json = new TextDecoder().decode(decryptedData)
        const originalEntry = JSON.parse(json) as DataEntry
        decrypted.push({ ...originalEntry, encrypted: false })
      } catch (error) {
        throw new Error(
          `Failed to decrypt entry ${entry.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }
    return decrypted
  }

  private async createJsonBlob(data: DataPackage, prettyPrint: boolean): Promise<Blob> {
    const json = prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    return new Blob([json], { type: 'application/json' })
  }

  private async createZipBlob(data: DataPackage, compress: boolean): Promise<Blob> {
    const json = JSON.stringify(data)
    const encoder = new TextEncoder()
    const bytes = encoder.encode(json)

    if (compress) {
      const compressed = await this.compressData(bytes)
      return new Blob([compressed.buffer as ArrayBuffer], { type: 'application/zip' })
    }

    return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/zip' })
  }

  private async parseJsonBlob(file: File): Promise<DataPackage> {
    const text = await file.text()
    return JSON.parse(text) as DataPackage
  }

  private async parseZipBlob(file: File): Promise<DataPackage> {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    try {
      const decompressed = await this.decompressData(bytes)
      const text = new TextDecoder().decode(decompressed)
      return JSON.parse(text) as DataPackage
    } catch {
      const text = new TextDecoder().decode(bytes)
      return JSON.parse(text) as DataPackage
    }
  }

  private async calculateChecksum(data: DataPackage): Promise<string> {
    const content = JSON.stringify({
      version: data.version,
      timestamp: data.timestamp,
      entries: data.entries.map(e => ({ id: e.id, type: e.type, size: e.size })),
    })

    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private async validateChecksum(data: DataPackage): Promise<boolean> {
    const calculated = await this.calculateChecksum(data)
    return calculated === data.checksum
  }

  private validateEntry(entry: DataEntry): { valid: boolean; error?: string } {
    if (!entry.id) return { valid: false, error: 'Missing entry ID' }
    if (!entry.type) return { valid: false, error: 'Missing entry type' }
    if (!entry.location) return { valid: false, error: 'Missing entry location' }
    if (typeof entry.size !== 'number' || entry.size < 0) return { valid: false, error: 'Invalid entry size' }
    return { valid: true }
  }

  private generateFilename(extension: string, prefix: string): string {
    const date = new Date().toISOString().split('T')[0]
    return `yyc3-${prefix}-${date}.${extension}`
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      return navigator.platform || 'unknown'
    }
    return 'server'
  }

  private async compressData(data: Uint8Array): Promise<Uint8Array> {
    const stream = new CompressionStream('gzip')
    const writer = stream.writable.getWriter()
    await writer.write(data as unknown as BufferSource)
    await writer.close()

    const reader = stream.readable.getReader()
    const chunks: Uint8Array[] = []
    let totalLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      totalLength += value.length
    }

    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result
  }

  private async decompressData(data: Uint8Array): Promise<Uint8Array> {
    const stream = new DecompressionStream('gzip')
    const writer = stream.writable.getWriter()
    await writer.write(data as unknown as BufferSource)
    await writer.close()

    const reader = stream.readable.getReader()
    const chunks: Uint8Array[] = []
    let totalLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      totalLength += value.length
    }

    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

export const dataPortabilityManager = new DataPortabilityManager()
