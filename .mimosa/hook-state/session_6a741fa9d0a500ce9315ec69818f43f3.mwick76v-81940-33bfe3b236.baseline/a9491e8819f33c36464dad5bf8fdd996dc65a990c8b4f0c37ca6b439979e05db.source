/**
 * @file panel-store.test.ts
 * @description 面板可见性统一管理 Store 单元测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-09
 * @status active
 * @tags [test],[unit],[panel-store]
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { panelActions, type PanelId } from '../panel-store'

// ===== 测试前重置状态 =====
beforeEach(() => {
  panelActions.closeAll()
})

// ============================================================================
// open / close / toggle
// ============================================================================

describe('panelActions.open', () => {
  it('应该打开面板并标记为可见', () => {
    panelActions.open('settings')
    expect(panelActions.isVisible('settings')).toBe(true)
  })

  it('重复打开同一面板不应重复入栈', () => {
    panelActions.open('settings')
    panelActions.open('settings')
    panelActions.open('settings')

    const stack = panelActions.getStack()
    // settings 应只在栈中出现一次
    const count = stack.filter(id => id === 'settings').length
    expect(count).toBe(1)
  })

  it('打开已关闭的面板应推送至栈顶', () => {
    panelActions.open('commandPalette')
    panelActions.open('settings')
    panelActions.close('settings')
    panelActions.open('settings')

    const stack = panelActions.getStack()
    expect(stack[stack.length - 1]).toBe('settings')
  })
})

describe('panelActions.close', () => {
  it('应该关闭面板并标记为不可见', () => {
    panelActions.open('settings')
    expect(panelActions.isVisible('settings')).toBe(true)

    panelActions.close('settings')
    expect(panelActions.isVisible('settings')).toBe(false)
  })

  it('关闭已关闭的面板应该为 no-op', () => {
    expect(() => panelActions.close('notifications')).not.toThrow()
    expect(panelActions.isVisible('notifications')).toBe(false)
  })
})

describe('panelActions.toggle', () => {
  it('toggle 打开已关闭的面板', () => {
    panelActions.toggle('settings')
    expect(panelActions.isVisible('settings')).toBe(true)
  })

  it('toggle 关闭已打开的面板', () => {
    panelActions.open('settings')
    panelActions.toggle('settings')
    expect(panelActions.isVisible('settings')).toBe(false)
  })
})

// ============================================================================
// Panel Stack（面板栈）— Escape 模式核心
// ============================================================================

describe('panelActions.closeTop — 面板栈模式', () => {
  it('空栈 closeTop 返回 false', () => {
    const result = panelActions.closeTop()
    expect(result).toBe(false)
  })

  it('closeTop 应关闭栈顶面板', () => {
    panelActions.open('commandPalette')   // 栈底
    panelActions.open('settings')         // 栈顶

    const result = panelActions.closeTop()
    expect(result).toBe(true)
    expect(panelActions.isVisible('settings')).toBe(false)
    expect(panelActions.isVisible('commandPalette')).toBe(true)
  })

  it('多次 closeTop 应逐个关闭（LIFO）', () => {
    panelActions.open('commandPalette')   // 第1个
    panelActions.open('settings')         // 第2个
    panelActions.open('globalSearch')     // 第3个（栈顶）

    // 第3个 → 关闭 globalSearch
    panelActions.closeTop()
    expect(panelActions.isVisible('globalSearch')).toBe(false)
    expect(panelActions.isVisible('settings')).toBe(true)
    expect(panelActions.isVisible('commandPalette')).toBe(true)

    // 第2个 → 关闭 settings
    panelActions.closeTop()
    expect(panelActions.isVisible('settings')).toBe(false)
    expect(panelActions.isVisible('commandPalette')).toBe(true)

    // 第1个 → 关闭 commandPalette
    panelActions.closeTop()
    expect(panelActions.isVisible('commandPalette')).toBe(false)

    // 栈空
    expect(panelActions.closeTop()).toBe(false)
  })

  it('关闭中间面板后栈应保持正确顺序', () => {
    panelActions.open('commandPalette')
    panelActions.open('settings')
    panelActions.open('globalSearch')

    // 关闭 settings（中间）
    panelActions.close('settings')

    const stack = panelActions.getStack()
    expect(stack).toEqual(['commandPalette', 'globalSearch'])

    // 栈顶应为 globalSearch
    panelActions.closeTop()
    expect(panelActions.isVisible('globalSearch')).toBe(false)
    expect(panelActions.isVisible('commandPalette')).toBe(true)
  })
})

// ============================================================================
// closeAll / closeExcept
// ============================================================================

describe('panelActions.closeAll', () => {
  it('应该关闭所有面板', () => {
    panelActions.open('settings')
    panelActions.open('commandPalette')
    panelActions.open('aiAssistant')
    panelActions.open('crdtCollab')

    panelActions.closeAll()

    expect(panelActions.isVisible('settings')).toBe(false)
    expect(panelActions.isVisible('commandPalette')).toBe(false)
    expect(panelActions.isVisible('aiAssistant')).toBe(false)
    expect(panelActions.isVisible('crdtCollab')).toBe(false)
    expect(panelActions.getStack().length).toBe(0)
  })

  it('空栈 closeAll 应该为 no-op', () => {
    expect(() => panelActions.closeAll()).not.toThrow()
  })
})

describe('panelActions.closeExcept', () => {
  it('应该只保留指定面板', () => {
    panelActions.open('settings')
    panelActions.open('commandPalette')
    panelActions.open('crdtCollab')

    panelActions.closeExcept('settings')

    expect(panelActions.isVisible('settings')).toBe(true)
    expect(panelActions.isVisible('commandPalette')).toBe(false)
    expect(panelActions.isVisible('crdtCollab')).toBe(false)
  })

  it('指定面板不在栈中时应该关闭所有', () => {
    panelActions.open('settings')
    panelActions.open('commandPalette')

    panelActions.closeExcept('aiAssistant')

    expect(panelActions.isVisible('settings')).toBe(false)
    expect(panelActions.isVisible('commandPalette')).toBe(false)
  })
})

// ============================================================================
// isVisible / getStack（同步方法）
// ============================================================================

describe('同步查询方法', () => {
  it('isVisible 不需要订阅即可查询', () => {
    expect(panelActions.isVisible('settings')).toBe(false)
    panelActions.open('settings')
    expect(panelActions.isVisible('settings')).toBe(true)
  })

  it('getStack 返回栈的副本', () => {
    panelActions.open('commandPalette')
    panelActions.open('settings')

    const stack = panelActions.getStack()
    expect(stack).toEqual(['commandPalette', 'settings'])

    // 修改返回的副本不应影响内部状态
    stack.push('globalSearch' as PanelId)
    expect(panelActions.getStack()).toEqual(['commandPalette', 'settings'])
  })
})

// ============================================================================
// 全部面板 ID 覆盖
// ============================================================================

describe('全部面板 ID', () => {
  const allPanels: PanelId[] = [
    'commandPalette', 'settings', 'notifications', 'globalSearch', 'cheatSheet',
    'performance', 'aiAssistant', 'crdtCollab', 'intelligentWorkflow', 'agentWorkflow',
    'syncPanel',
    'imageGen', 'selfMediaEditor', 'publishQueue', 'trendingTopics',
    'aiWriting', 'materialManager', 'contentPreview', 'contentTemplate',
    'localModelDash', 'chat',
  ]

  it('所有面板 ID 应能正常 open/close/toggle', () => {
    for (const id of allPanels) {
      // open
      panelActions.open(id)
      expect(panelActions.isVisible(id)).toBe(true)

      // toggle close
      panelActions.toggle(id)
      expect(panelActions.isVisible(id)).toBe(false)

      // toggle open
      panelActions.toggle(id)
      expect(panelActions.isVisible(id)).toBe(true)

      // close
      panelActions.close(id)
      expect(panelActions.isVisible(id)).toBe(false)
    }
  })
})