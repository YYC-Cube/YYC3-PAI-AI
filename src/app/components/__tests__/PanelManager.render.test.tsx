/**
 * @file PanelManager.render.test.tsx
 * @description 面板渲染管理器真渲染测试 — 全 lazy 面板 stub + 真 panel-store 集成
 * （取代旧 PanelManager.test.tsx 的源码正则断言：那是 0% 覆盖的根因）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { stubPanel } = vi.hoisted(() => {
  const stubPanel = (id: string) => {
    const C = (props: Record<string, unknown>) => (
      <div data-testid={`panel-${id}`}>
        <button data-testid={`close-${id}`} onClick={() => (props.onClose as () => void)?.()} />
        <span data-testid={`props-${id}`}>{JSON.stringify({ ...props, onClose: undefined, visible: undefined, children: undefined })}</span>
      </div>
    )
    return C
  }
  return { stubPanel }
})

// —— 21 个 lazy 面板模块统一 stub（路径相对本测试文件解析）——
vi.mock('../CommandPalette', () => ({ CommandPalette: stubPanel('commandPalette') }))
vi.mock('../SettingsPanel', () => ({ SettingsPanel: stubPanel('settings') }))
vi.mock('../NotificationCenter', () => ({ NotificationCenter: stubPanel('notifications') }))
vi.mock('../GlobalSearch', () => ({ GlobalSearch: stubPanel('globalSearch') }))
vi.mock('../PerformanceDashboard', () => ({ PerformanceDashboard: stubPanel('performance') }))
vi.mock('../AIAssistantPanel', () => ({ AIAssistantPanel: stubPanel('aiAssistant') }))
vi.mock('../CRDTCollabPanel', () => ({ CRDTCollabPanel: stubPanel('crdtCollab') }))
vi.mock('../IntelligentWorkflowPanel', () => ({ IntelligentWorkflowPanel: stubPanel('intelligentWorkflow') }))
vi.mock('../AgentWorkflowPanel', () => ({ AgentWorkflowPanel: stubPanel('agentWorkflow') }))
vi.mock('../SyncPanel', () => ({ SyncPanel: stubPanel('sync') }))
vi.mock('../ImageGenPanel', () => ({ ImageGenPanel: stubPanel('imageGen') }))
vi.mock('../SelfMediaEditor', () => ({ SelfMediaEditor: stubPanel('selfMedia') }))
vi.mock('../PublishQueue', () => ({ PublishQueue: stubPanel('publishQueue') }))
vi.mock('../TrendingTopics', () => ({ TrendingTopics: stubPanel('trendingTopics') }))
vi.mock('../AIWritingPanel', () => ({ AIWritingPanel: stubPanel('aiWriting') }))
vi.mock('../MaterialManager', () => ({ MaterialManager: stubPanel('materialManager') }))
vi.mock('../ContentPreview', () => ({ ContentPreview: stubPanel('contentPreview') }))
vi.mock('../ContentTemplatePanel', () => ({ ContentTemplatePanel: stubPanel('contentTemplate') }))
vi.mock('../LocalModelDashboard', () => ({ LocalModelDashboard: stubPanel('localModelDashboard') }))
vi.mock('../../../components/Chat/ChatPage', () => ({ default: stubPanel('chat') }))
vi.mock('../KeyManagerPanel', () => ({ KeyManagerPanel: stubPanel('keyVault') }))

import { PanelManager } from '../PanelManager'
import { panelActions, type PanelId } from '../../store/panel-store'

const renderManager = (over: Partial<Parameters<typeof PanelManager>[0]> = {}) =>
  render(
    <PanelManager
      commands={[]}
      searchFileMap={{}}
      onSearchSelectFile={() => {}}
      onSearchReplace={() => {}}
      onClearPendingPublish={() => {}}
      {...over}
    />,
  )

beforeEach(() => {
  panelActions.closeAll()
})

describe('PanelManager 真渲染（lazy stub + 真 panel-store）', () => {
  it('无面板打开 → 不渲染任何面板', () => {
    const { container } = renderManager()
    expect(container.querySelectorAll('[data-testid^="panel-"]')).toHaveLength(0)
  })

  it('commandPalette 打开 → 渲染 + commands 透传 + 关闭布线', async () => {
    const commands = [{ id: 'c1', label: '测试命令' }] as never
    panelActions.open('commandPalette')
    renderManager({ commands })
    await waitFor(() => expect(screen.getByTestId('panel-commandPalette')).toBeTruthy())
    expect(screen.getByTestId('props-commandPalette').textContent).toContain('测试命令')
    // 关闭按钮 → panelActions.close → 面板卸载（DOM 即真值，无需读 store hook）
    fireEvent.click(screen.getByTestId('close-commandPalette'))
    await waitFor(() => expect(screen.queryByTestId('panel-commandPalette')).toBeNull())
  })

  it('chat 面板（历史崩溃点）：打开渲染正常，Suspense 边界内挂载', async () => {
    panelActions.open('chat')
    renderManager()
    await waitFor(() => expect(screen.getByTestId('panel-chat')).toBeTruthy())
  })

  it('keyVault 面板：无 props 自治挂载，store 关闭即卸载', async () => {
    panelActions.open('keyVault')
    renderManager()
    await waitFor(() => expect(screen.getByTestId('panel-keyVault')).toBeTruthy())
    // KeyManagerPanel 不接 onClose（面板自管可见性）→ 直驱 store 验证卸载
    panelActions.close('keyVault')
    await waitFor(() => expect(screen.queryByTestId('panel-keyVault')).toBeNull())
  })

  it('多面板同时打开（栈序）全部渲染', async () => {
    for (const id of ['settings', 'notifications', 'chat', 'keyVault'] as PanelId[]) {
      panelActions.open(id)
    }
    renderManager()
    for (const id of ['settings', 'notifications', 'chat', 'keyVault']) {
      await waitFor(() => expect(screen.getByTestId(`panel-${id}`)).toBeTruthy())
    }
  })

  it('globalSearch：searchFileMap / onSelectFile / onReplace 透传', async () => {
    panelActions.open('globalSearch')
    renderManager({
      searchFileMap: { 'a.ts': 'export const A = 1' },
      onSearchSelectFile: () => {},
      onSearchReplace: () => {},
    })
    await waitFor(() => expect(screen.getByTestId('panel-globalSearch')).toBeTruthy())
    const props = screen.getByTestId('props-globalSearch').textContent!
    expect(props).toContain('export const A = 1')
    expect(props).toContain('fileContentMap')
  })

  it('publishQueue：pendingPublish 内容与标题透传', async () => {
    panelActions.open('publishQueue')
    renderManager({
      pendingPublishContent: '# 待发布正文',
      pendingPublishTitle: '标题甲',
      onClearPendingPublish: () => {},
    })
    await waitFor(() => expect(screen.getByTestId('panel-publishQueue')).toBeTruthy())
    const props = screen.getByTestId('props-publishQueue').textContent!
    expect(props).toContain('待发布正文')
    expect(props).toContain('标题甲')
  })

  it('toggle 语义：关闭已开面板', async () => {
    panelActions.open('settings')
    renderManager()
    await waitFor(() => expect(screen.getByTestId('panel-settings')).toBeTruthy())
    panelActions.toggle('settings')
    await waitFor(() => expect(screen.queryByTestId('panel-settings')).toBeNull())
  })
})
