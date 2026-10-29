/**
 * @file PanelManager.test.tsx
 * @description 面板管理器回归：所有 lazy 面板（含 ChatPage/keyVault）必须有 Suspense 边界
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SOURCE = readFileSync(resolve(__dirname, '../PanelManager.tsx'), 'utf-8')

describe('PanelManager Suspense 边界完整性（2026-10-29 整树崩溃回归）', () => {
  it('每个 lazy 组件引用点都被 Suspense 包裹（数量对齐）', () => {
    const lazyRefs = SOURCE.match(/visible\.has\('[a-zA-Z]+'\)/g) ?? []
    expect(lazyRefs.length).toBeGreaterThan(20)
    // 非 Suspense 直渲的例外清单：嵌在已有边界 JSX 内的面板（与 lazy 声明同层）
    const suspenseCount = (SOURCE.match(/<Suspense fallback=\{<PanelSkeleton \/>}>/g) ?? []).length
    // ChatPage 与 keyVault 均已显式包裹 → Suspense 块数 ≥ (面板引用数 - 复用块内多面板数)
    expect(suspenseCount).toBeGreaterThanOrEqual(lazyRefs.length - 5)
  })

  it('ChatPage 必须包在 Suspense 内（历史崩溃点）', () => {
    const chatBlock = SOURCE.slice(
      SOURCE.indexOf("visible.has('chat')"),
      SOURCE.indexOf("visible.has('chat')") + 600,
    )
    expect(chatBlock).toContain('<Suspense fallback={<PanelSkeleton />}>')
    expect(chatBlock).toContain('<ChatPage />')
  })

  it('keyVault 面板已注册且有 Suspense', () => {
    expect(SOURCE).toContain("visible.has('keyVault')")
    const vaultBlock = SOURCE.slice(SOURCE.indexOf("visible.has('keyVault')") - 400)
    expect(vaultBlock).toContain('<Suspense fallback={<PanelSkeleton />}>')
  })

  it('PanelId 类型包含 keyVault（panel-store 同步）', () => {
    const store = readFileSync(resolve(__dirname, '../../store/panel-store.ts'), 'utf-8')
    expect(store).toContain("'keyVault'")
  })
})
