/**
 * @file PluginManager.test.tsx
 * @description 插件管理面板测试 — 真 plugin-system 集成（注册/激活/停用/权限展开/卸载/错误态）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { PluginManager } from '../PluginManager'
import {
  registerPlugin, listPlugins, uninstallPlugin, activatePlugin,
  type PluginManifest,
} from '../../services/plugin-system'

const manifest: PluginManifest = {
  id: 'test-plugin',
  name: '测试插件',
  version: '1.0.0',
  description: '用于面板测试的插件',
  author: 'YYC3',
  permissions: ['chat:read', 'ui:panel'],
  entry: 'void 0; /* no-op entry */',
}

const boomManifest: PluginManifest = {
  ...manifest,
  id: 'boom-plugin',
  name: '崩溃插件',
  entry: 'throw new Error("boom-test")',
}

beforeEach(() => {
  localStorage.clear()
})

describe('PluginManager（插件管理面板）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<PluginManager visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('空态渲染注册引导提示', () => {
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    expect(container.textContent).toContain('暂无已注册插件')
    expect(container.textContent).toContain('0 个 · 0 运行中')
  })

  it('注册后渲染插件行（名称/版本/状态/统计徽标）', () => {
    registerPlugin(manifest)
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    expect(container.textContent).toContain('测试插件')
    expect(container.textContent).toContain('v1.0.0')
    expect(container.textContent).toContain('已注册')
    expect(container.textContent).toContain('1 个 · 0 运行中')
  })

  it('激活插件 → 状态变为运行中', async () => {
    registerPlugin(manifest)
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    fireEvent.click(container.querySelector('[title="激活"]')!)
    await waitFor(() => expect(container.textContent).toContain('运行中'))
    expect(container.textContent).toContain('1 个 · 1 运行中')
    expect(listPlugins()[0].state).toBe('active')
  })

  it('展开行显示权限标签与元数据', () => {
    registerPlugin(manifest)
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    fireEvent.click(container.querySelector('.cursor-pointer')!)
    expect(container.textContent).toContain('读取对话消息')
    expect(container.textContent).toContain('添加自定义面板')
    expect(container.textContent).toContain('作者: YYC3')
  })

  it('停用插件 → 状态变为已停用', async () => {
    registerPlugin(manifest)
    await activatePlugin(manifest.id)
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    expect(container.textContent).toContain('运行中')
    fireEvent.click(container.querySelector('[title="停用"]')!)
    await waitFor(() => expect(container.textContent).toContain('已停用'))
    expect(listPlugins()[0].state).toBe('inactive')
  })

  it('卸载插件 → 列表回到空态', async () => {
    registerPlugin(manifest)
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    fireEvent.click(container.querySelector('[title="卸载"]')!)
    await waitFor(() => expect(container.textContent).toContain('暂无已注册插件'))
    expect(listPlugins()).toHaveLength(0)
  })

  it('入口代码抛错 → 错误态展示 lastError', async () => {
    registerPlugin(boomManifest)
    await activatePlugin(boomManifest.id)
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    expect(container.textContent).toContain('崩溃插件')
    fireEvent.click(container.querySelector('.cursor-pointer')!)
    expect(container.textContent).toContain('boom-test')
    expect(container.querySelector('[title="激活"]')).toBeTruthy()
    // 清理，避免污染其它用例
    uninstallPlugin(boomManifest.id)
  })

  it('无权限且无图标插件：展开显示「无需特殊权限」与默认图标', () => {
    registerPlugin({ ...manifest, id: 'bare-plugin', permissions: [] })
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    fireEvent.click(container.querySelector('.cursor-pointer')!)
    expect(container.textContent).toContain('无需特殊权限')
    // 无 icon 字段 → 渲染默认 Puzzle 图标（svg）
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('激活后展开显示激活日期元数据', async () => {
    registerPlugin(manifest)
    await activatePlugin(manifest.id)
    const { container } = render(<PluginManager visible onClose={() => {}} />)
    fireEvent.click(container.querySelector('.cursor-pointer')!)
    expect(container.textContent).toContain('激活:')
    expect(container.textContent).toContain('注册:')
  })
})
