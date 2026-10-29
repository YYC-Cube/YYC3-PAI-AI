/**
 * @file key-storage.ts
 * @description API Key 统一存储门面 — 加密保险库优先，明文降级，解锁后自动迁移
 *
 * 三处历史明文写入点（ModelSettings / useAI / model-store）统一改道本模块：
 * - 保险库（KeyManager，PBKDF2 100k + AES-256-GCM）已解锁 → 密文存储；
 * - 未设置/未解锁 → 降级明文（保证可用性），并在解锁后自动迁入保险库。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags security,key-manager,vault,storage
 */

import { keyManager } from './key-manager'
import { createLogger } from './logger'

const logger = createLogger('key-storage')

const LS_PLAINTEXT = 'yyc3-provider-api-keys'
const LS_MIGRATED = 'yyc3_keys_migrated_at'

function readPlaintextMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_PLAINTEXT) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function writePlaintextMap(map: Record<string, string>) {
  try {
    localStorage.setItem(LS_PLAINTEXT, JSON.stringify(map))
  } catch (e) {
    logger.error('[KeyStorage] plaintext persist failed', e as Error)
  }
}

/** 保险库是否可用（已设主口令且会话内解锁） */
export function isVaultActive(): boolean {
  return keyManager.isUnlocked()
}

/**
 * 保存 Provider API Key：保险库优先，未解锁降级明文。
 * @returns 实际使用的存储模式
 */
export async function saveProviderKey(
  providerId: string,
  apiKey: string,
): Promise<'vault' | 'plaintext'> {
  if (!apiKey) {
    await removeProviderKey(providerId)
    return 'plaintext'
  }
  if (isVaultActive()) {
    try {
      await keyManager.storeKey(providerId, apiKey, {
        description: `provider:${providerId}`,
        tags: ['ai-provider'],
      })
      // 入库成功后清掉可能的明文残留
      const plain = readPlaintextMap()
      if (providerId in plain) {
        delete plain[providerId]
        writePlaintextMap(plain)
      }
      return 'vault'
    } catch (e) {
      logger.warn('[KeyStorage] vault store failed, fallback to plaintext', e as Error)
    }
  }
  const plain = readPlaintextMap()
  plain[providerId] = apiKey
  writePlaintextMap(plain)
  return 'plaintext'
}

/** 读取 Provider API Key：保险库优先，回退明文 */
export async function loadProviderKey(providerId: string): Promise<string> {
  if (isVaultActive()) {
    try {
      const fromVault = await keyManager.getKey(providerId)
      if (fromVault) return fromVault
    } catch { /* fallthrough */ }
  }
  return readPlaintextMap()[providerId] ?? ''
}

/** 删除（两处都清） */
export async function removeProviderKey(providerId: string): Promise<void> {
  const plain = readPlaintextMap()
  if (providerId in plain) {
    delete plain[providerId]
    writePlaintextMap(plain)
  }
  if (isVaultActive()) {
    try { await keyManager.deleteKey(providerId) } catch { /* 未入库则忽略 */ }
  }
}

/**
 * 批量读取（供设置页一次拉全部）。
 * 注意：保险库未解锁时返回明文表；解锁时逐项走解密，无密文的项回退明文。
 */
export async function loadAllProviderKeys(): Promise<Record<string, string>> {
  const plain = readPlaintextMap()
  if (!isVaultActive()) return { ...plain }
  const merged: Record<string, string> = {}
  for (const id of new Set([...Object.keys(plain), ...keyManager.listKeys().map((k) => k.provider)])) {
    merged[id] = await loadProviderKey(id)
  }
  return merged
}

/**
 * 保险库解锁后调用：把全部明文 Key 迁入加密库并清除明文。
 * @returns 迁移条数（0 = 无需迁移）
 */
export async function migratePlaintextKeysToVault(): Promise<number> {
  if (!isVaultActive()) return 0
  const plain = readPlaintextMap()
  const ids = Object.keys(plain).filter((id) => plain[id])
  if (!ids.length) return 0
  let moved = 0
  for (const id of ids) {
    try {
      await keyManager.storeKey(id, plain[id], {
        description: `provider:${id} (migrated)`,
        tags: ['ai-provider', 'migrated'],
      })
      delete plain[id]
      moved++
    } catch (e) {
      logger.warn(`[KeyStorage] migrate ${id} failed`, e as Error)
    }
  }
  writePlaintextMap(plain)
  localStorage.setItem(LS_MIGRATED, String(Date.now()))
  logger.info(`[KeyStorage] migrated ${moved} keys to vault`)
  return moved
}

/** 明文残留检测（供 UI 显示安全提示） */
export function hasPlaintextResidue(): boolean {
  return Object.values(readPlaintextMap()).some(Boolean)
}
