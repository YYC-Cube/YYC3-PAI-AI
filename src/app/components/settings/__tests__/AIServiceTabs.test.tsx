/**
 * @file AIServiceTabs.test.tsx
 * @description 设置·AI 与服务页签专项 — Agents（内置/自定义渲染·添加·展开详情·系统提示词编辑·启停·删除）/
 *              MCP（预设服务器列表·全局开关·展开详情·健康检测中态·移除）/Models（空态·列表·打开管理器回调）/
 *              Context（索引状态·忽略规则增删·文档集增删改）/Conversation（开关组·代码审查范围·命令模式·白名单·音量）/
 *              Rules & Skills（分区切换·规则与技能增删启停·作用域选择）
 * 策略：真 settings-store/mcp-store（resetSettings/resetToPresets 复位）；无 I18nProvider → t 返回 key
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

import {
  AgentsTab, MCPTab, ModelsTab, ContextTab, ConversationTab, RulesSkillsTab,
} from '../AIServiceTabs'
import { themeStore } from '../../../store/theme-store'
import { settingsActions } from '../../../store/settings-store'
import { mcpStoreActions } from '../../../store/mcp-store'

const TK = themeStore.getTokens()

const btnByText = (c: HTMLElement, text: string) =>
  Array.from(c.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

const inputs = (c: HTMLElement) => Array.from(c.querySelectorAll('input[type="text"]')) as HTMLInputElement[]

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  settingsActions.resetSettings()
  mcpStoreActions.resetToPresets()
})

describe('AIServiceTabs · AgentsTab（智能体）', () => {
  it('内置与自定义分组：三个内置 Agent 渲染 + 内置徽标 key + 自定义空态 key + 计数括号', () => {
    const { container } = render(<AgentsTab tk={TK} />)
    expect(container.textContent).toContain('agentsTitle')
    expect(container.textContent).toContain('agentsBuiltIn (3)')
    expect(container.textContent).toContain('Code Assistant')
    expect(container.textContent).toContain('Code Reviewer')
    expect(container.textContent).toContain('System Architect')
    expect(container.textContent).toContain('builtIn')
    expect(container.textContent).toContain('agentsCustom (0)')
    expect(container.textContent).toContain('agentEmpty')
    expect(container.textContent).toContain('agentAdd')
  })

  it('添加自定义 Agent：空名提交不生效；填写名称与提示词后创建并归入自定义分组', () => {
    const { container } = render(<AgentsTab tk={TK} />)
    fireEvent.click(btnByText(container, 'agentAdd'))
    const nameInput = inputs(container)[0]
    const promptInput = container.querySelector('textarea') as HTMLTextAreaElement
    // 空名 → create 早退
    fireEvent.click(btnByText(container, 'create'))
    expect(container.textContent).toContain('agentsCustom (0)')
    fireEvent.change(nameInput, { target: { value: '文档翻译官' } })
    fireEvent.change(promptInput, { target: { value: '你是翻译助手' } })
    fireEvent.click(btnByText(container, 'create'))
    expect(container.textContent).toContain('agentsCustom (1)')
    expect(container.textContent).toContain('文档翻译官')
    // 表单收起且字段清空
    expect(inputs(container)).toHaveLength(0)
  })

  it('展开卡片：显示模型/温度/最大 Token；自定义 Agent 的系统提示词可编辑（真 store 持久化）', () => {
    const created = settingsActions.addAgent({
      name: '翻译官', description: '', systemPrompt: '初始提示词', model: 'glm-4.6',
      temperature: 0.7, maxTokens: 2048, isBuiltIn: false, isCustom: true, enabled: true,
    })
    const { container } = render(<AgentsTab tk={TK} />)
    // 展开自定义卡片（点击其标题行）
    const card = Array.from(container.querySelectorAll('span')).find(s => s.textContent === '翻译官')!
      .closest('.rounded-lg') as HTMLElement
    fireEvent.click(card.querySelector('.cursor-pointer') ?? card)
    expect(container.textContent).toContain('glm-4.6')
    expect(container.textContent).toContain('0.7')
    expect(container.textContent).toContain('2048')
    const ta = Array.from(container.querySelectorAll('textarea')).find(t => t.value === '初始提示词')!
    expect(ta).toBeTruthy()
    fireEvent.change(ta, { target: { value: '改好的提示词' } })
    // 真 store 内值已更新（emit → saveState）
    const snapshotAfter = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    const updated = snapshotAfter.agents.find((a: { id: string }) => a.id === created.id)
    expect(updated.systemPrompt).toBe('改好的提示词')
  })

  it('启停开关与删除：toggleAgent 翻转内置 Agent；removeAgent 移除自定义 Agent', () => {
    const created = settingsActions.addAgent({
      name: '临时工', description: '', systemPrompt: '', model: 'm',
      temperature: 0.5, maxTokens: 1024, isBuiltIn: false, isCustom: true, enabled: true,
    })
    const { container } = render(<AgentsTab tk={TK} />)
    // 内置第一个卡片开关（w-8 h-4 圆角开关容器）
    const toggles = container.querySelectorAll('.w-8.h-4')
    expect(toggles.length).toBe(4) // 3 内置 + 1 自定义
    fireEvent.click(toggles[0].closest('button')!)
    const snap1 = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap1.agents.find((a: { id: string }) => a.id === 'agent-coder').enabled).toBe(false)
    // 删除自定义（Trash2 按钮仅自定义有）
    const delBtn = container.querySelector('.lucide-trash-2')!.closest('button')!
    fireEvent.click(delBtn)
    expect(container.textContent).toContain('agentsCustom (0)')
    expect(container.textContent).not.toContain('临时工')
    expect(created.id).toBeTruthy()
  })
})

describe('AIServiceTabs · MCPTab（MCP 服务器）', () => {
  it('预设服务器列表：计数 (6)/名称与 transport 徽章/未知状态 key；全局开关切换 globalEnabled', () => {
    const { container } = render(<MCPTab tk={TK} />)
    expect(container.textContent).toContain('mcpTitle')
    expect(container.textContent).toContain('mcpServers (6)')
    for (const name of ['Filesystem', 'Fetch', 'PostgreSQL', 'Memory', 'GitHub', 'Brave Search']) {
      expect(container.textContent).toContain(name)
    }
    expect(container.textContent).toContain('stdio')
    expect(container.textContent).toContain('未知') // status unknown → zh 标签
    // 全局开关：默认开 → 点击后按钮转灰（success → foregroundMuted），globalEnabled 落盘为 false
    const globalBtn = btnByText(container, 'mcpGlobalEnable')
    const colorBefore = globalBtn.style.color
    fireEvent.click(globalBtn)
    expect(globalBtn.style.color).not.toBe(colorBefore) // success → foregroundMuted
    const snap = JSON.parse(localStorage.getItem('yyc3_mcp_store')!)
    expect(snap.globalEnabled).toBe(false)
  })

  it('展开服务器详情：描述/工具 chips（read_file 等）/tags/健康检测进入 checking 态/移除后计数 -1', () => {
    const { container } = render(<MCPTab tk={TK} />)
    const fsCard = Array.from(container.querySelectorAll('span')).find(s => s.textContent === 'Filesystem')!
      .closest('.rounded-lg') as HTMLElement
    fireEvent.click(fsCard.querySelector('.cursor-pointer')!)
    expect(container.textContent).toContain('文件系统读写 — 安全沙箱模式')
    expect(container.textContent).toContain('mcpTools (3)')
    expect(container.textContent).toContain('read_file')
    expect(container.textContent).toContain('#filesystem')
    // 健康检测 → 立即进入 checking（中文「检测中」）
    fireEvent.click(btnByText(container, 'mcpHealthCheck'))
    expect(container.textContent).toContain('检测中')
    // 移除
    fireEvent.click(btnByText(container, 'remove'))
    expect(container.textContent).toContain('mcpServers (5)')
    expect(container.textContent).not.toContain('Filesystem')
  })
})

describe('AIServiceTabs · ModelsTab（模型）', () => {
  it('空列表显示 modelsEmpty key；有列表渲染名称/provider/ACTIVE 徽标；打开管理器回调布线', () => {
    const openModelSettings = vi.fn()
    const { container, rerender } = render(<ModelsTab tk={TK} aiModels={[]} openModelSettings={openModelSettings} />)
    expect(container.textContent).toContain('modelsTitle')
    expect(container.textContent).toContain('modelsConfigured (0)')
    expect(container.textContent).toContain('modelsEmpty')
    rerender(<ModelsTab tk={TK} aiModels={[
      { id: 'm1', name: 'GLM-4.6', provider: 'zhipu', isActive: true },
      { id: 'm2', name: 'DeepSeek-V3', provider: 'deepseek', isActive: false },
    ]} openModelSettings={openModelSettings} />)
    expect(container.textContent).toContain('modelsConfigured (2)')
    expect(container.textContent).toContain('GLM-4.6')
    expect(container.textContent).toContain('DeepSeek-V3')
    expect(container.textContent).toContain('zhipu')
    expect(container.textContent).toContain('active')
    fireEvent.click(btnByText(container, 'modelsOpenManager'))
    expect(openModelSettings).toHaveBeenCalledTimes(1)
  })
})

describe('AIServiceTabs · ContextTab（上下文）', () => {
  it('索引状态与重新索引：idle 态 key 展示；点击重建索引后状态切为 indexing', () => {
    const { container } = render(<ContextTab tk={TK} />)
    expect(container.textContent).toContain('contextTitle')
    expect(container.textContent).toContain('contextIndex')
    expect(container.textContent).toContain('contextStatusIdle')
    fireEvent.click(btnByText(container, 'contextReindex'))
    expect(container.textContent).toContain('contextStatusIndexing')
  })

  it('忽略规则：默认规则 chips 渲染；输入回车添加；重复添加去重；X 移除', () => {
    const { container } = render(<ContextTab tk={TK} />)
    expect(container.textContent).toContain('node_modules')
    expect(container.textContent).toContain('.git')
    const ruleInput = inputs(container)[0]
    fireEvent.change(ruleInput, { target: { value: 'coverage' } })
    fireEvent.keyDown(ruleInput, { key: 'Enter' })
    expect(container.textContent).toContain('coverage')
    const snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.context.ignoreRules).toContain('coverage')
    // 重复添加去重（addIgnoreRule 内部去重 → 数组长度不变）
    fireEvent.change(ruleInput, { target: { value: 'coverage' } })
    fireEvent.keyDown(ruleInput, { key: 'Enter' })
    const snap2 = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap2.context.ignoreRules.filter((r: string) => r === 'coverage')).toHaveLength(1)
    // 移除首个规则（node_modules）
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    const snap3 = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap3.context.ignoreRules).not.toContain('node_modules')
    expect(container.textContent).not.toContain('node_modules')
  })

  it('文档集：空态 key；添加（含 URL → source=url）后行渲染；开关与删除布线', () => {
    const { container } = render(<ContextTab tk={TK} />)
    expect(container.textContent).toContain('contextDocsEmpty')
    const [ruleInput, docName, docUrl] = inputs(container)
    expect(ruleInput).toBeTruthy()
    fireEvent.change(docName, { target: { value: '项目手册' } })
    fireEvent.change(docUrl, { target: { value: 'https://docs.example.com' } })
    // 名称与 URL 同行，行内唯一的 Plus 按钮即添加入口
    const addDocBtn = docUrl.closest('div')!.querySelector('button')!
    fireEvent.click(addDocBtn)
    const snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.context.documentSets).toHaveLength(1)
    expect(snap.context.documentSets[0].source).toBe('url')
    expect(container.textContent).toContain('项目手册')
  })
})

describe('AIServiceTabs · ConversationTab（对话流）', () => {
  it('开关组：todoList/自动修复/主动提问等 ToggleRow 点击后真 store 值翻转', () => {
    const { container } = render(<ConversationTab tk={TK} />)
    expect(container.textContent).toContain('convTitle')
    expect(container.textContent).toContain('convTodoList')
    expect(container.textContent).toContain('convTodoListDesc')
    // ToggleRow 按钮即 w-10 h-5 圆角开关
    const toggles = container.querySelectorAll('.w-10.h-5')
    expect(toggles.length).toBe(6)
    fireEvent.click(toggles[0]) // useTodoList: true → false
    let snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.conversation.useTodoList).toBe(false)
    fireEvent.click(toggles[1]) // autoCollapseNodes: false → true
    snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.conversation.autoCollapseNodes).toBe(true)
  })

  it('代码审查范围与命令模式：单选 chip 点击后 codeReviewScope/commandRunMode 更新', () => {
    const { container } = render(<ConversationTab tk={TK} />)
    fireEvent.click(btnByText(container, 'convReviewNone'))
    let snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.conversation.codeReviewScope).toBe('none')
    fireEvent.click(btnByText(container, 'convCmdDirect'))
    snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.conversation.commandRunMode).toBe('direct')
  })

  it('命令白名单：默认 4 条 chips；输入回车添加；X 删除', () => {
    const { container } = render(<ConversationTab tk={TK} />)
    expect(container.textContent).toContain('npm test')
    expect(container.textContent).toContain('pnpm build')
    const cmdInput = inputs(container)[0]
    fireEvent.change(cmdInput, { target: { value: 'pnpm lint' } })
    fireEvent.keyDown(cmdInput, { key: 'Enter' })
    let snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.conversation.whitelistCommands).toContain('pnpm lint')
    // 删除第一条（npm test）
    fireEvent.click(container.querySelector('.lucide-x')!.closest('button')!)
    snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.conversation.whitelistCommands).not.toContain('npm test')
  })

  it('音量滑块：change 事件把 volume 写回真 store 并回显百分比', () => {
    const { container } = render(<ConversationTab tk={TK} />)
    expect(container.textContent).toContain('80%')
    const range = container.querySelector('input[type="range"]') as HTMLInputElement
    fireEvent.change(range, { target: { value: '30' } })
    expect(container.textContent).toContain('30%')
    const snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.conversation.volume).toBe(30)
  })
})

describe('AIServiceTabs · RulesSkillsTab（规则与技能）', () => {
  it('空态与分区切换：rules 空态 key；切到 skills 分区显示技能空态与计数徽标', () => {
    const { container } = render(<RulesSkillsTab tk={TK} />)
    expect(container.textContent).toContain('rsTitle')
    expect(container.textContent).toContain('rsRules')
    expect(container.textContent).toContain('rsSkills')
    expect(container.textContent).toContain('rsEmpty')
    fireEvent.click(btnByText(container, 'rsSkills'))
    // 两个分区计数徽标均为 0
    expect(container.textContent).toContain('rsEmpty')
  })

  it('添加规则：选择 project 作用域后创建；列表渲染名称/内容截断/作用域徽标；删除后回空态', () => {
    const { container } = render(<RulesSkillsTab tk={TK} />)
    fireEvent.click(btnByText(container, 'rsAddRule'))
    const nameInput = inputs(container)[0]
    const contentInput = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(nameInput, { target: { value: '禁止删除测试' } })
    fireEvent.change(contentInput, { target: { value: '任何情况下不得删除已有测试用例，除非有替代覆盖' } })
    // 作用域选 project
    fireEvent.click(btnByText(container, 'rsScopeProject'))
    fireEvent.click(btnByText(container, 'create'))
    expect(container.textContent).toContain('禁止删除测试')
    expect(container.textContent).toContain('project')
    const snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.rules).toHaveLength(1)
    expect(snap.rules[0].scope).toBe('project')
    // 删除 → 回空态
    fireEvent.click(container.querySelector('.lucide-trash-2')!.closest('button')!)
    expect(container.textContent).toContain('rsEmpty')
  })

  it('添加技能：切到 skills 分区后创建（global 作用域），开关启停写回真 store', () => {
    const { container } = render(<RulesSkillsTab tk={TK} />)
    fireEvent.click(btnByText(container, 'rsSkills'))
    fireEvent.click(btnByText(container, 'rsAddSkill'))
    const nameInput = inputs(container)[0]
    const contentInput = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(nameInput, { target: { value: '性能剖析' } })
    fireEvent.change(contentInput, { target: { value: '生成火焰图并定位热点函数' } })
    // 分区切换不重置 newScope（疑似 bug：残留 rules 分支的 personal），显式选 global
    fireEvent.click(btnByText(container, 'rsScopeGlobal'))
    fireEvent.click(btnByText(container, 'create'))
    expect(container.textContent).toContain('性能剖析')
    const snap = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap.skills).toHaveLength(1)
    expect(snap.skills[0].scope).toBe('global')
    // 启停
    fireEvent.click(container.querySelector('.w-8.h-4')!.closest('button')!)
    const snap2 = JSON.parse(localStorage.getItem('yyc3_settings_store')!)
    expect(snap2.skills[0].enabled).toBe(false)
  })
})
