/**
 * @file key-storage.test.ts
 * @description KeyManager 接线回归：门面（保险库优先/明文降级/迁移）契约
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// key-manager 单例打桩：vault 模式可控
const vaultStore = new Map<string, string>()
let vaultUnlocked = false

vi.mock('../key-manager', () => ({
  keyManager: {
    isUnlocked: () => vaultUnlocked,
    listKeys: () => [...vaultStore.keys()].map((provider) => ({ provider, id: provider })),
    storeKey: async (provider: string, apiKey: string) => { vaultStore.set(provider, apiKey) },
    getKey: async (provider: string) => vaultStore.get(provider) ?? null,
    deleteKey: async (provider: string) => { vaultStore.delete(provider) },
  },
}))

import {
  saveProviderKey, loadProviderKey, removeProviderKey,
  loadAllProviderKeys, migratePlaintextKeysToVault, hasPlaintextResidue,
} from '../key-storage'

describe('key-storage 门面', () => {
  beforeEach(() => {
    localStorage.clear()
    vaultStore.clear()
    vaultUnlocked = false
  })

  it('未解锁 → 明文降级可读回', async () => {
    const mode = await saveProviderKey('zhipu', 'sk-plain-1')
    expect(mode).toBe('plaintext')
    expect(await loadProviderKey('zhipu')).toBe('sk-plain-1')
    expect(hasPlaintextResidue()).toBe(true)
  })

  it('解锁态 → 入保险库且清除明文残留', async () => {
    await saveProviderKey('zhipu', 'sk-legacy')      // 明文先落
    vaultUnlocked = true
    const mode = await saveProviderKey('zhipu', 'sk-vault')
    expect(mode).toBe('vault')
    expect(await loadProviderKey('zhipu')).toBe('sk-vault')
    expect(hasPlaintextResidue()).toBe(false)          // 明文被清
  })

  it('迁移：解锁后明文全量入保险库', async () => {
    await saveProviderKey('a', 'k1')
    await saveProviderKey('b', 'k2')
    vaultUnlocked = true
    const moved = await migratePlaintextKeysToVault()
    expect(moved).toBe(2)
    expect(hasPlaintextResidue()).toBe(false)
    expect(await loadProviderKey('a')).toBe('k1')
    expect(await loadProviderKey('b')).toBe('k2')
  })

  it('删除：两侧都清', async () => {
    await saveProviderKey('x', 'kx')
    vaultUnlocked = true
    await saveProviderKey('x', 'kx-v')
    await removeProviderKey('x')
    expect(await loadProviderKey('x')).toBe('')
    expect(hasPlaintextResidue()).toBe(false)
  })

  it('批量读取合并保险库与明文', async () => {
    await saveProviderKey('plain1', 'p1')      // 明文
    vaultUnlocked = true
    await saveProviderKey('vault1', 'v1')      // 入库
    const all = await loadAllProviderKeys()
    expect(all.vault1).toBe('v1')
    expect(all.plain1).toBe('p1')
  })

  it('空 Key 删除语义', async () => {
    await saveProviderKey('zhipu', 'sk-x')
    const mode = await saveProviderKey('zhipu', '')
    expect(mode).toBe('plaintext')
    expect(await loadProviderKey('zhipu')).toBe('')
  })
})
