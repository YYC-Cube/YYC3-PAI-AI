/**
 * @file unified-data-store.test.ts
 * @description 统一数据管理Store测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ===== Mock external service dependencies =====
const mockSecrets = vi.hoisted(() => new Map<string, string>())

vi.mock('../../services/secure-storage', () => ({
  secureStorage: {
    storeSecret: vi.fn(async (key: string, value: string) => {
      mockSecrets.set(key, value)
    }),
    readSecret: vi.fn(async (key: string) => {
      return mockSecrets.get(key) ?? null
    }),
    deleteSecret: vi.fn(async (key: string) => {
      mockSecrets.delete(key)
    }),
    getSecurityScore: vi.fn(async () => 85),
  },
}))

vi.mock('../../services/indexeddb-service', () => ({
  indexedDBService: {
    getStoreNames: vi.fn(() => []),
    getAll: vi.fn(async (_storeName: string) => []),
    getData: vi.fn(async () => null),
    open: vi.fn(async () => { }),
  },
}))

vi.mock('../../services/data-portability-manager', () => ({
  dataPortabilityManager: {
    importData: vi.fn(async (_file: File, _options: any) => ({
      success: true,
      entries: 1,
      skipped: 0,
      errors: [],
      warnings: [],
    })),
    exportData: vi.fn(async (entries: any[], _options: any) => {
      const filteredEntries = entries.map((e: any) => ({
        id: e.id,
        type: e.type,
        path: e.path,
        content: localStorage.getItem(e.path || '') || '{}',
      }))
      return {
        success: true,
        entries: filteredEntries.length,
        skipped: 0,
        errors: [],
        warnings: [],
        blob: new Blob(
          [
            JSON.stringify({
              version: '2.0.0',
              timestamp: Date.now(),
              checksum: 'abc123',
              entries: filteredEntries,
              metadata: {
                source: 'YYC3-AI-PAI',
                version: '2.0.0',
                totalEntries: filteredEntries.length,
                dataTypes: [...new Set(filteredEntries.map((e: any) => e.type))],
              },
            }),
          ],
          { type: 'application/json' }
        ),
        size: 2,
        format: 'json',
        timestamp: Date.now(),
        checksum: 'abc123',
      }
    }),
  },
}))

import { useUnifiedDataStore } from '../unified-data-store'

describe('useUnifiedDataStore', () => {
  beforeEach(() => {
    localStorage.clear()
    const store = useUnifiedDataStore.getState()
    act(() => {
      store.entries = []
      store.totalSize = 0
      store.totalEntries = 0
      store.quotas = []
      store.sync = {
        lastSync: null,
        pending: 0,
        conflicts: 0,
        errors: 0,
        isSyncing: false,
        progress: 0,
      }
      store.security = {
        vaultLocked: true,
        encryptionEnabled: false,
        initialized: false,
        keyDerivationIterations: 100000,
        lastAuditTime: Date.now(),
        securityScore: 85,
        secureItemCount: 0,
      }
      store.portability = {
        exportInProgress: false,
        importInProgress: false,
        lastExport: null,
        lastImport: null,
        supportedFormats: ['json', 'zip', 'sqlite'],
      }
      store.activeTab = 'overview'
      store.searchQuery = ''
      store.selectedEntries = []
    })
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useUnifiedDataStore.getState()
      expect(state.entries).toEqual([])
      expect(state.totalSize).toBe(0)
      expect(state.totalEntries).toBe(0)
      expect(state.activeTab).toBe('overview')
      expect(state.searchQuery).toBe('')
      expect(state.selectedEntries).toEqual([])
    })

    it('should have correct sync initial state', () => {
      const sync = useUnifiedDataStore.getState().sync
      expect(sync.lastSync).toBeNull()
      expect(sync.pending).toBe(0)
      expect(sync.conflicts).toBe(0)
      expect(sync.isSyncing).toBe(false)
    })

    it('should have correct security initial state', () => {
      const security = useUnifiedDataStore.getState().security
      expect(security.vaultLocked).toBe(true)
      expect(security.encryptionEnabled).toBe(false)
    })

    it('should have correct portability initial state', () => {
      const portability = useUnifiedDataStore.getState().portability
      expect(portability.exportInProgress).toBe(false)
      expect(portability.importInProgress).toBe(false)
      expect(portability.supportedFormats).toEqual(['json', 'zip', 'sqlite'])
    })
  })

  describe('scanData', () => {
    it('should scan yyc3_ prefixed localStorage entries', async () => {
      localStorage.setItem('yyc3_settings', JSON.stringify({ theme: 'dark' }))
      localStorage.setItem('yyc3_model_config', JSON.stringify({ model: 'gpt-4' }))
      localStorage.setItem('other_key', 'ignored')

      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      const state = useUnifiedDataStore.getState()
      expect(state.entries.length).toBe(2)
      expect(state.totalEntries).toBe(2)
      expect(state.totalSize).toBeGreaterThan(0)
    })

    it('should classify entry types by key name', async () => {
      localStorage.setItem('yyc3_settings', '{}')
      localStorage.setItem('yyc3_model_config', '{}')
      localStorage.setItem('yyc3_file_data', '{}')
      localStorage.setItem('yyc3_sync_records', '{}')
      localStorage.setItem('yyc3_backup_data', '{}')
      localStorage.setItem('yyc3_cache_data', '{}')

      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      const entries = useUnifiedDataStore.getState().entries
      const types = entries.map(e => e.type)
      expect(types).toContain('settings')
      expect(types).toContain('models')
      expect(types).toContain('files')
      expect(types).toContain('sync-records')
      expect(types).toContain('backups')
      expect(types).toContain('cache')
    })

    it('should mark encrypted entries', async () => {
      localStorage.setItem('yyc3_encrypted_data', '{}')
      localStorage.setItem('yyc3_vault_data', '{}')

      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      const entries = useUnifiedDataStore.getState().entries
      const encryptedEntries = entries.filter(e => e.encrypted)
      expect(encryptedEntries.length).toBe(2)
    })

    it('should handle empty localStorage', async () => {
      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      const state = useUnifiedDataStore.getState()
      expect(state.entries).toEqual([])
      expect(state.totalEntries).toBe(0)
    })
  })

  describe('initialize', () => {
    it('should initialize and scan data', async () => {
      localStorage.setItem('yyc3_settings', '{}')

      await act(async () => {
        await useUnifiedDataStore.getState().initialize()
      })

      const state = useUnifiedDataStore.getState()
      expect(state.entries.length).toBe(1)
      expect(state.quotas.length).toBeGreaterThan(0)
    })
  })

  describe('syncEntry', () => {
    it('should trigger sync without throwing', async () => {
      localStorage.setItem('yyc3_settings', '{}')
      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      const entryId = useUnifiedDataStore.getState().entries[0].id
      await expect(
        act(async () => {
          await useUnifiedDataStore.getState().syncEntry(entryId)
        })
      ).resolves.not.toThrow()
    })
  })

  describe('setSensitive / getSensitive', () => {
    it('should store and retrieve sensitive data', async () => {
      await act(async () => {
        await useUnifiedDataStore.getState().setSensitive('api-key-openai', 'sk-test-key-12345', {
          type: 'api-key',
          provider: 'openai',
        })
      })

      const value = await act(async () => {
        return await useUnifiedDataStore.getState().getSensitive('api-key-openai')
      })

      expect(value).toBe('sk-test-key-12345')
    })

    it('should remove sensitive data', async () => {
      await act(async () => {
        await useUnifiedDataStore.getState().setSensitive('api-key-test', 'test-value')
      })
      await act(async () => {
        await useUnifiedDataStore.getState().removeSensitive('api-key-test')
      })

      const value = await act(async () => {
        return await useUnifiedDataStore.getState().getSensitive('api-key-test')
      })
      expect(value).toBeNull()
    })
  })

  describe('removeData', () => {
    it('should remove an entry from localStorage', async () => {
      localStorage.setItem('yyc3_settings', '{}')
      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      await act(async () => {
        await useUnifiedDataStore.getState().removeData('settings')
      })

      expect(useUnifiedDataStore.getState().entries.length).toBe(0)
      expect(localStorage.getItem('yyc3_settings')).toBeNull()
    })
  })

  describe('exportData', () => {
    it('should export data as JSON blob', async () => {
      localStorage.setItem('yyc3_settings', JSON.stringify({ theme: 'dark' }))
      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      let blob: Blob | undefined
      await act(async () => {
        blob = await useUnifiedDataStore.getState().exportData('json')
      })

      expect(blob).toBeTruthy()
      expect(blob!.type).toBe('application/json')

      const text = await blob!.text()
      const data = JSON.parse(text)
      expect(data.version).toBe('2.0.0')
      expect(data.entries).toBeInstanceOf(Array)
    })

    it('should export specific entries', async () => {
      localStorage.setItem('yyc3_settings', '{}')
      localStorage.setItem('yyc3_model_config', '{}')
      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      const entryId = useUnifiedDataStore.getState().entries[0].id
      let blob: Blob | undefined
      await act(async () => {
        blob = await useUnifiedDataStore.getState().exportData('json', { entries: [entryId] })
      })

      const text = await blob!.text()
      const data = JSON.parse(text)
      expect(data.entries).toHaveLength(1)
    })

    it('should update lastExport timestamp', async () => {
      await act(async () => {
        await useUnifiedDataStore.getState().exportData('json')
      })

      expect(useUnifiedDataStore.getState().portability.lastExport).toBeGreaterThan(0)
    })
  })

  describe('importData', () => {
    it('should import data and update lastImport timestamp', async () => {
      const importData = {
        version: '1.0.0',
        entries: [{
          id: 'local:yyc3_imported',
          type: 'settings',
          path: 'yyc3_imported',
          content: '{"imported": true}',
        }],
      }
      const file = new File(
        [JSON.stringify(importData)],
        'import.json',
        { type: 'application/json' }
      )

      await act(async () => {
        await useUnifiedDataStore.getState().importData(file)
      })

      expect(useUnifiedDataStore.getState().portability.lastImport).toBeGreaterThan(0)
    })

    it('should handle import errors gracefully', async () => {
      const { dataPortabilityManager } = await import('../../services/data-portability-manager')
      vi.mocked(dataPortabilityManager.importData).mockRejectedValueOnce(new Error('Import failed'))

      const file = new File(['invalid json'], 'bad.json', { type: 'application/json' })

      await expect(
        act(async () => {
          await useUnifiedDataStore.getState().importData(file)
        })
      ).rejects.toThrow('Import failed')
    })
  })

  describe('resolveConflict', () => {
    it('should resolve conflict and update status', async () => {
      act(() => {
        useUnifiedDataStore.setState(state => {
          state.entries = [{
            id: 'test-entry',
            type: 'settings',
            location: 'local',
            status: 'conflict',
            size: 100,
            lastModified: Date.now(),
            encrypted: false,
            synced: false,
          }]
          state.sync.conflicts = 1
        })
      })

      await act(async () => {
        await useUnifiedDataStore.getState().resolveConflict('test-entry', 'local')
      })

      const entry = useUnifiedDataStore.getState().entries.find(e => e.id === 'test-entry')
      expect(entry?.status).toBe('synced')
      expect(entry?.synced).toBe(true)
      expect(useUnifiedDataStore.getState().sync.conflicts).toBe(0)
    })
  })

  describe('UI operations', () => {
    it('should set active tab', () => {
      act(() => {
        useUnifiedDataStore.getState().setActiveTab('security')
      })
      expect(useUnifiedDataStore.getState().activeTab).toBe('security')
    })

    it('should set search query', () => {
      act(() => {
        useUnifiedDataStore.getState().setSearchQuery('test')
      })
      expect(useUnifiedDataStore.getState().searchQuery).toBe('test')
    })

    it('should toggle entry selection', () => {
      act(() => {
        useUnifiedDataStore.getState().toggleEntrySelection('id1')
      })
      expect(useUnifiedDataStore.getState().selectedEntries).toContain('id1')

      act(() => {
        useUnifiedDataStore.getState().toggleEntrySelection('id1')
      })
      expect(useUnifiedDataStore.getState().selectedEntries).not.toContain('id1')
    })

    it('should select all entries', async () => {
      localStorage.setItem('yyc3_a', '{}')
      localStorage.setItem('yyc3_b', '{}')
      await act(async () => {
        await useUnifiedDataStore.getState().scanData()
      })

      act(() => {
        useUnifiedDataStore.getState().selectAllEntries()
      })

      const state = useUnifiedDataStore.getState()
      expect(state.selectedEntries.length).toBe(state.entries.length)
    })

    it('should clear selection', () => {
      act(() => {
        useUnifiedDataStore.getState().toggleEntrySelection('id1')
      })
      act(() => {
        useUnifiedDataStore.getState().clearSelection()
      })
      expect(useUnifiedDataStore.getState().selectedEntries).toEqual([])
    })
  })
})
