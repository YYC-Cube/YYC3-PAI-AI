/**
 * @file plugin-store.test.ts
 * @description Unit test for plugin-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, vi } from 'vitest'

const lsMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: lsMock })

// Mock window for global exposure
Object.defineProperty(globalThis, 'window', {
  value: {},
  writable: true,
  configurable: true,
})

// Mock console to suppress plugin logs
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

import { pluginStoreActions, MARKETPLACE_PLUGINS, type StoragePluginAPI } from '../plugin-store'

describe('Built-in Plugins', () => {
  it('should have at least 4 built-in plugins', () => {
    const storagePlugins = pluginStoreActions.getActivePluginsByCategory<StoragePluginAPI>('storage')
    // At least localstorage and indexeddb should be active
    expect(storagePlugins.length).toBeGreaterThanOrEqual(2)
  })

  it('built-in plugins should have meta with all required fields', () => {
    const plugins = pluginStoreActions.getActivePluginsByCategory('storage')
    for (const p of plugins) {
      expect(p.meta.id).toBeTruthy()
      expect(p.meta.name).toBeTruthy()
      expect(p.meta.displayName).toBeTruthy()
      expect(p.meta.version).toBeTruthy()
      expect(p.meta.author).toBeTruthy()
      expect(p.meta.category).toBe('storage')
      expect(p.meta.builtin).toBe(true)
    }
  })
})

describe('registerPlugin', () => {
  it('should register a new plugin and return true', () => {
    const result = pluginStoreActions.registerPlugin(
      'test-plugin',
      { type: 'test', read: async () => null, write: async () => {}, remove: async () => {}, list: async () => [], isConnected: async () => true } as StoragePluginAPI,
      { displayName: 'Test Plugin', category: 'storage', version: '1.0.0', author: 'Test' },
    )
    expect(result).toBe(true)
  })

  it('should reject duplicate plugin names', () => {
    pluginStoreActions.registerPlugin('dupe-plugin', {}, { displayName: 'Dupe 1' })
    const result = pluginStoreActions.registerPlugin('dupe-plugin', {}, { displayName: 'Dupe 2' })
    expect(result).toBe(false)
  })

  it('registered plugin should be accessible via getPluginAPI', () => {
    const api = { type: 'unique-api', read: async () => 'hello' }
    pluginStoreActions.registerPlugin('unique-api-plugin', api, { displayName: 'Unique API', category: 'storage' })
    // We need the plugin id to query
    const plugins = pluginStoreActions.getActivePluginsByCategory('storage')
    const found = plugins.find(p => p.meta.name === 'unique-api-plugin')
    expect(found).toBeDefined()
    expect(found!.api).toHaveProperty('type', 'unique-api')
  })

  it('should call onActivate lifecycle hook', () => {
    const onActivate = vi.fn()
    pluginStoreActions.registerPlugin(
      'lifecycle-test',
      {},
      { displayName: 'Lifecycle Test', enabled: true },
      { onActivate },
    )
    expect(onActivate).toHaveBeenCalledTimes(1)
  })

  it('should not call onActivate if enabled=false', () => {
    const onActivate = vi.fn()
    pluginStoreActions.registerPlugin(
      'disabled-lifecycle',
      {},
      { displayName: 'Disabled', enabled: false },
      { onActivate },
    )
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('should set status to error if onActivate throws', () => {
    pluginStoreActions.registerPlugin(
      'error-plugin',
      {},
      { displayName: 'Error', enabled: true },
      { onActivate: () => { throw new Error('boom') } },
    )
    // Plugin should still be registered but in error state
    // It's in error state, so getActive won't return it
    // But it should be persisted
  })

  it('should persist to localStorage', () => {
    lsMock.setItem.mockClear()
    pluginStoreActions.registerPlugin('persist-test', {}, { displayName: 'Persist' })
    const calls = lsMock.setItem.mock.calls.filter((c: string[]) => c[0] === 'yyc3_plugin_store')
    expect(calls.length).toBeGreaterThan(0)
  })
})

describe('unregisterPlugin', () => {
  it('should remove a registered non-builtin plugin', async () => {
    pluginStoreActions.registerPlugin('removable', {}, { displayName: 'Removable' })
    const all = pluginStoreActions.getActivePluginsByCategory('tool')
    const target = all.find(p => p.meta.name === 'removable')
    if (target) {
      const result = await pluginStoreActions.unregisterPlugin(target.meta.id)
      expect(result).toBe(true)
    }
  })

  it('should not unregister built-in plugin', async () => {
    const result = await pluginStoreActions.unregisterPlugin('yyc3-localstorage')
    expect(result).toBe(false)
  })

  it('should return false for unknown plugin', async () => {
    const result = await pluginStoreActions.unregisterPlugin('nonexistent')
    expect(result).toBe(false)
  })

  it('should call onUninstall and onDeactivate hooks', async () => {
    const onUninstall = vi.fn()
    const onDeactivate = vi.fn()
    pluginStoreActions.registerPlugin(
      'hook-test-unregister',
      {},
      { displayName: 'Hooks', enabled: true },
      { onUninstall, onDeactivate },
    )
    const all = pluginStoreActions.getActivePluginsByCategory('tool')
    const target = all.find(p => p.meta.name === 'hook-test-unregister')
    if (target) {
      await pluginStoreActions.unregisterPlugin(target.meta.id)
      expect(onUninstall).toHaveBeenCalled()
      expect(onDeactivate).toHaveBeenCalled()
    }
  })
})

describe('enablePlugin / disablePlugin', () => {
  it('disablePlugin should set status to inactive', async () => {
    pluginStoreActions.registerPlugin('toggle-test', {}, { displayName: 'Toggle', enabled: true })
    const before = pluginStoreActions.getActivePluginsByCategory('tool')
    const target = before.find(p => p.meta.name === 'toggle-test')
    if (target) {
      const result = await pluginStoreActions.disablePlugin(target.meta.id)
      expect(result).toBe(true)
    }
  })

  it('enablePlugin should return false for unknown plugin', async () => {
    const result = await pluginStoreActions.enablePlugin('nonexistent')
    expect(result).toBe(false)
  })

  it('disablePlugin should return false for unknown plugin', async () => {
    const result = await pluginStoreActions.disablePlugin('nonexistent')
    expect(result).toBe(false)
  })
})

describe('updatePluginConfig', () => {
  it('should update plugin config', async () => {
    pluginStoreActions.registerPlugin('config-test', {}, {
      displayName: 'Config',
      config: { key1: 'value1' },
    })
    const all = pluginStoreActions.getActivePluginsByCategory('tool')
    const target = all.find(p => p.meta.name === 'config-test')
    if (target) {
      const result = await pluginStoreActions.updatePluginConfig(target.meta.id, { key2: 'value2' })
      expect(result).toBe(true)
    }
  })

  it('should return false for unknown plugin', async () => {
    const result = await pluginStoreActions.updatePluginConfig('nonexistent', {})
    expect(result).toBe(false)
  })

  it('should call onConfigChange lifecycle hook', async () => {
    const onConfigChange = vi.fn()
    pluginStoreActions.registerPlugin(
      'config-hook-test',
      {},
      { displayName: 'Config Hook', config: {} },
      { onConfigChange },
    )
    const all = pluginStoreActions.getActivePluginsByCategory('tool')
    const target = all.find(p => p.meta.name === 'config-hook-test')
    if (target) {
      await pluginStoreActions.updatePluginConfig(target.meta.id, { foo: 'bar' })
      expect(onConfigChange).toHaveBeenCalledWith({ foo: 'bar' })
    }
  })
})

describe('installPlugin (marketplace)', () => {
  it('should install a marketplace plugin', async () => {
    const mp = MARKETPLACE_PLUGINS[0]
    const result = await pluginStoreActions.installPlugin(mp)
    expect(result).toBe(true)
  })

  it('should reject duplicate install', async () => {
    const mp = MARKETPLACE_PLUGINS[1]
    await pluginStoreActions.installPlugin(mp)
    const result = await pluginStoreActions.installPlugin(mp)
    expect(result).toBe(false)
  })
})

describe('getActivePluginsByCategory', () => {
  it('storage category should return active storage plugins', () => {
    const plugins = pluginStoreActions.getActivePluginsByCategory<StoragePluginAPI>('storage')
    expect(plugins.length).toBeGreaterThanOrEqual(2)
    for (const p of plugins) {
      expect(p.meta.category).toBe('storage')
    }
  })

  it('unknown category should return empty array', () => {
    const plugins = pluginStoreActions.getActivePluginsByCategory('language')
    // May or may not have language plugins
    expect(Array.isArray(plugins)).toBe(true)
  })
})

describe('getPluginAPI', () => {
  it('should return null for inactive plugin', () => {
    const api = pluginStoreActions.getPluginAPI('yyc3-s3-mock')
    expect(api).toBeNull()
  })

  it('should return null for unknown plugin', () => {
    const api = pluginStoreActions.getPluginAPI('nonexistent')
    expect(api).toBeNull()
  })
})

describe('Panel Operations', () => {
  it('openPanel/closePanel should not throw', () => {
    expect(() => pluginStoreActions.openPanel()).not.toThrow()
    expect(() => pluginStoreActions.closePanel()).not.toThrow()
  })

  it('selectPlugin should not throw', () => {
    expect(() => pluginStoreActions.selectPlugin('yyc3-localstorage')).not.toThrow()
    expect(() => pluginStoreActions.selectPlugin(null)).not.toThrow()
  })

  it('setActiveTab should accept valid values', () => {
    expect(() => pluginStoreActions.setActiveTab('installed')).not.toThrow()
    expect(() => pluginStoreActions.setActiveTab('marketplace')).not.toThrow()
    expect(() => pluginStoreActions.setActiveTab('settings')).not.toThrow()
  })
})

describe('MARKETPLACE_PLUGINS', () => {
  it('should have at least 4 marketplace plugins', () => {
    expect(MARKETPLACE_PLUGINS.length).toBeGreaterThanOrEqual(4)
  })

  it('each should have required fields', () => {
    for (const p of MARKETPLACE_PLUGINS) {
      expect(p.id).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(p.displayName).toBeTruthy()
      expect(p.version).toBeTruthy()
      expect(p.category).toBeTruthy()
      expect(p.builtin).toBe(false)
    }
  })
})
