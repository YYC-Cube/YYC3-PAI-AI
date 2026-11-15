/**
 * @file plugin-system.test.ts
 * @description P3.3 插件系统测试：清单验证 / 注册-激活-停用 / 权限过滤 / API 受限
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerPlugin, listPlugins, getPlugin, uninstallPlugin,
  validateManifest, hasPermission, activatePlugin, deactivatePlugin,
  getPluginStats, injectHostAPI, getPluginPanels, getPluginCommands,
  PERMISSION_LABELS, type PluginManifest,
} from '../plugin-system'

const validManifest: PluginManifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  permissions: ['chat:read', 'ui:command'],
  entry: 'pluginAPI.registerCommand("test", "Test Cmd", () => {})',
}

const fullManifest: PluginManifest = {
  ...validManifest,
  id: 'full-plugin',
  permissions: ['chat:read', 'chat:write', 'ai:invoke', 'ui:command', 'ui:panel', 'storage:read', 'storage:write'],
  entry: `
    pluginAPI.registerCommand("cmd1", "Command 1", () => {})
    pluginAPI.registerPanel("panel1", "My Panel", () => document.createElement('div'))
    pluginAPI.storage.set("key1", "value1")
  `,
}

beforeEach(() => {
  localStorage.clear()
  injectHostAPI({})
})

describe('validateManifest（清单验证）', () => {
  it('合法清单通过', () => {
    expect(() => validateManifest(validManifest)).not.toThrow()
  })

  it('ID 必须是 kebab-case', () => {
    expect(() => validateManifest({ ...validManifest, id: 'Invalid ID' })).toThrow('kebab-case')
    expect(() => validateManifest({ ...validManifest, id: 'UPPER' })).toThrow('kebab-case')
  })

  it('version 必须是 semver', () => {
    expect(() => validateManifest({ ...validManifest, version: 'abc' })).toThrow('semver')
  })

  it('未知权限报错', () => {
    expect(() => validateManifest({ ...validManifest, permissions: ['hack:system'] as never })).toThrow('Unknown permission')
  })

  it('entry 不能为空', () => {
    expect(() => validateManifest({ ...validManifest, entry: '' })).toThrow('required')
  })
})

describe('registerPlugin / listPlugins / getPlugin', () => {
  it('注册成功并可查询', () => {
    const instance = registerPlugin(validManifest)
    expect(instance.manifest.id).toBe('test-plugin')
    expect(instance.state).toBe('registered')

    const all = listPlugins()
    expect(all).toHaveLength(1)

    const found = getPlugin('test-plugin')
    expect(found?.manifest.name).toBe('Test Plugin')
  })

  it('重复 ID 报错', () => {
    registerPlugin(validManifest)
    expect(() => registerPlugin(validManifest)).toThrow('already registered')
  })

  it('卸载后可重新注册', () => {
    registerPlugin(validManifest)
    expect(uninstallPlugin('test-plugin')).toBe(true)
    expect(listPlugins()).toHaveLength(0)
    expect(uninstallPlugin('test-plugin')).toBe(false) // 不存在
    expect(() => registerPlugin(validManifest)).not.toThrow() // 重新注册 OK
  })
})

describe('hasPermission（权限检查）', () => {
  it('有声明的权限返回 true', () => {
    registerPlugin(validManifest)
    expect(hasPermission('test-plugin', 'chat:read')).toBe(true)
    expect(hasPermission('test-plugin', 'ui:command')).toBe(true)
  })

  it('未声明的权限返回 false', () => {
    registerPlugin(validManifest)
    expect(hasPermission('test-plugin', 'editor:write')).toBe(false)
    expect(hasPermission('test-plugin', 'network:fetch')).toBe(false)
  })

  it('不存在的插件返回 false', () => {
    expect(hasPermission('nonexistent', 'chat:read')).toBe(false)
  })
})

describe('activatePlugin / deactivatePlugin', () => {
  it('激活成功 → state=active → 命令/面板注册', async () => {
    registerPlugin(fullManifest)
    const instance = await activatePlugin('full-plugin')

    expect(instance.state).toBe('active')
    expect(instance.activatedAt).toBeTruthy()

    // 插件注册的命令和面板可查询
    const commands = getPluginCommands()
    expect(commands.some(c => c.id === 'cmd1')).toBe(true)

    const panels = getPluginPanels()
    expect(panels.some(p => p.id === 'panel1')).toBe(true)
  })

  it('停用 → state=inactive', async () => {
    registerPlugin(validManifest)
    await activatePlugin('test-plugin')
    deactivatePlugin('test-plugin')

    const instance = getPlugin('test-plugin')!
    expect(instance.state).toBe('inactive')
  })

  it('入口代码报错 → state=error + lastError', async () => {
    const badManifest: PluginManifest = {
      ...validManifest,
      id: 'bad-plugin',
      entry: 'throw new Error("plugin init failed")',
    }
    registerPlugin(badManifest)
    const instance = await activatePlugin('bad-plugin')

    expect(instance.state).toBe('error')
    expect(instance.lastError).toContain('plugin init failed')
  })

  it('无权限 API 调用被拒绝', async () => {
    // 只有 chat:read，没有 chat:write
    const readonlyManifest: PluginManifest = {
      ...validManifest,
      id: 'readonly-plugin',
      permissions: ['chat:read'],
      entry: 'pluginAPI.storage.set("key", "value")', // 需要 storage:write
    }
    registerPlugin(readonlyManifest)
    const instance = await activatePlugin('readonly-plugin')

    // 插件代码执行时会抛权限错误
    expect(instance.state).toBe('error')
    expect(instance.lastError).toContain('Permission denied')
  })
})

describe('getPluginStats', () => {
  it('统计正确', async () => {
    registerPlugin(validManifest) // registered
    registerPlugin(fullManifest) // will be active
    registerPlugin({ ...validManifest, id: 'bad', entry: 'throw new Error("x")' }) // will error

    await activatePlugin('full-plugin')
    await activatePlugin('bad')

    const stats = getPluginStats()
    expect(stats.total).toBe(3)
    expect(stats.active).toBe(1)
    expect(stats.error).toBe(1)
    expect(stats.inactive).toBe(1) // registered counts as inactive
  })
})

describe('PERMISSION_LABELS（权限描述）', () => {
  it('所有权限都有中文描述', () => {
    const permissions = Object.keys(PERMISSION_LABELS)
    expect(permissions.length).toBeGreaterThanOrEqual(14)
    for (const perm of permissions) {
      expect(PERMISSION_LABELS[perm as keyof typeof PERMISSION_LABELS]).toBeTruthy()
    }
  })
})
