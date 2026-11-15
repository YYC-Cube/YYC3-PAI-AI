/**
 * @file self-media-store.test.tsx
 * @description 自媒体跨面板通信层测试 — Provider 状态流（真实消费组件树）+ 无 Provider 降级
 *
 * 注：断言经真实子组件消费（renderHook 的 result.current 与本 Provider 的 useMemo 组合
 * 存在读取怪癖，真实树才是生产语义）。
 */

import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { SelfMediaStoreProvider, useSelfMediaStore } from '../self-media-store'
import type { ContentTemplate } from '../../components/ContentTemplatePanel'

const template = (over: Partial<ContentTemplate> = {}): ContentTemplate => ({
  id: 'tpl-1',
  name: '小红书种草笔记',
  description: '种草模板',
  platform: 'xiaohongshu',
  icon: (() => null) as never,
  color: '#ff2442',
  sections: [
    { id: 's1', title: '开头钩子', type: 'paragraph', required: true, placeholder: '' },
    { id: 's2', title: '产品卖点', type: 'list', required: true, placeholder: '' },
    { id: 's3', title: '可选附录', type: 'quote', required: false, placeholder: '' },
  ],
  variables: [],
  ...over,
})

/** 消费探针：暴露关心的状态片段与操作按钮 */
function Probe() {
  const s = useSelfMediaStore()
  return (
    <div>
      <span data-testid="v-current">{s.currentContent || '∅'}</span>
      <span data-testid="v-tpl">{s.activeTemplate?.id ?? '∅'}</span>
      <span data-testid="v-topic">{s.templateWritingTopic || '∅'}</span>
      <span data-testid="v-mode">{s.templateWritingMode ?? '∅'}</span>
      <span data-testid="v-pubC">{s.pendingPublishContent ?? '∅'}</span>
      <span data-testid="v-pubT">{s.pendingPublishTitle ?? '∅'}</span>
      <span data-testid="v-prevC">{s.pendingPreviewContent ?? '∅'}</span>
      <span data-testid="v-prevT">{s.pendingPreviewTitle ?? '∅'}</span>
      <span data-testid="v-prevP">{s.pendingPreviewPlatform ?? '∅'}</span>
      <span data-testid="v-ins">{s.insertCallback ? 'ins-set' : 'ins-null'}</span>
      <span data-testid="v-wins">{s.writingInsertCallback ? 'wins-set' : 'wins-null'}</span>
      <span data-testid="v-acts">{s.panelActions ? 'acts-set' : 'acts-null'}</span>
      <span data-testid="v-adapt">{JSON.stringify(s.platformAdaptations)}</span>
      <button data-testid="b-apply" onClick={() => s.applyTemplate(template())}>apply</button>
      <button data-testid="b-clearTpl" onClick={() => s.clearTemplateTopic()}>clearTpl</button>
      <button data-testid="b-topic" onClick={() => { s.setPendingAIWritingTopic('帮我写一篇开箱'); s.setPendingAIWritingMode('title') }}>topic</button>
      <button data-testid="b-pub" onClick={() => s.setPendingPublish('正文一', '标题一')}>pub1</button>
      <button data-testid="b-pub2" onClick={() => s.setPendingPublish('正文二')}>pub2</button>
      <button data-testid="b-pub3" onClick={() => s.setPendingPublish(null, null)}>pub3</button>
      <button data-testid="b-prev" onClick={() => { s.setPendingPreviewContent('<h1>预览</h1>'); s.setPendingPreviewTitle('预览标题'); s.setPendingPreviewPlatform('bilibili') }}>prev</button>
      <button data-testid="b-adapt" onClick={() => { s.addPlatformAdaptation('wechat', '微信版'); s.addPlatformAdaptation('douyin', '抖音版') }}>adapt</button>
      <button data-testid="b-adapt2" onClick={() => s.addPlatformAdaptation('wechat', '微信版v2')}>adapt2</button>
      <button data-testid="b-adaptClr" onClick={() => s.clearAdaptations()}>adaptClr</button>
      <button data-testid="b-handles" onClick={() => { s.setInsertCallback(vi.fn()); s.setWritingInsertCallback(vi.fn()); s.setPanelActions({ openAIWriting: () => {}, openMaterialManager: () => {}, openContentPreview: () => {}, openEditor: () => {}, openPublishQueue: () => {}, openTrendingTopics: () => {} }) }}>handles</button>
      <button data-testid="b-current" onClick={() => s.setCurrentContent('<p>正文</p>')}>cur</button>
    </div>
  )
}

const mount = () => render(
  <SelfMediaStoreProvider><Probe /></SelfMediaStoreProvider>,
)
const txt = (id: string) => document.querySelector(`[data-testid="${id}"]`)!.textContent!
const click = (id: string) => act(() => { document.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!.click() })

describe('SelfMediaStoreProvider 状态流（真实消费树）', () => {
  it('初始态全空', () => {
    mount()
    expect(txt('v-current')).toBe('∅')
    expect(txt('v-tpl')).toBe('∅')
    expect(txt('v-topic')).toBe('∅')
    expect(txt('v-mode')).toBe('∅')
    expect(txt('v-pubC')).toBe('∅')
    expect(txt('v-adapt')).toBe('{}')
    expect(txt('v-acts')).toBe('acts-null')
  })

  it('applyTemplate：置模板 + 大纲主题（仅必需段落）+ mode=outline', () => {
    mount()
    click('b-apply')
    expect(txt('v-tpl')).toBe('tpl-1')
    expect(txt('v-mode')).toBe('outline')
    const topic = txt('v-topic')
    expect(topic).toContain('平台：xiaohongshu')
    expect(topic).toContain('模板：小红书种草笔记')
    expect(topic).toContain('- 开头钩子')
    expect(topic).toContain('- 产品卖点')
    expect(topic).not.toContain('可选附录')
    expect(topic).toContain('大纲和内容方案')
  })

  it('clearTemplateTopic 复位主题/模式，模板保留', () => {
    mount()
    click('b-apply')
    click('b-clearTpl')
    expect(txt('v-topic')).toBe('∅')
    expect(txt('v-mode')).toBe('∅')
    expect(txt('v-tpl')).toBe('tpl-1')
  })

  it('setPendingAIWritingTopic/Mode 直设路径', () => {
    mount()
    click('b-topic')
    expect(txt('v-topic')).toBe('帮我写一篇开箱')
    expect(txt('v-mode')).toBe('title')
  })

  it('setPendingPublish 三段语义：覆盖/缺省保留/显式清空', () => {
    mount()
    click('b-pub')
    expect(txt('v-pubC')).toBe('正文一')
    expect(txt('v-pubT')).toBe('标题一')
    click('b-pub2')
    expect(txt('v-pubC')).toBe('正文二')
    expect(txt('v-pubT')).toBe('标题一')
    click('b-pub3')
    expect(txt('v-pubC')).toBe('∅')
    expect(txt('v-pubT')).toBe('∅')
  })

  it('预览三态独立设置', () => {
    mount()
    click('b-prev')
    expect(txt('v-prevC')).toBe('<h1>预览</h1>')
    expect(txt('v-prevT')).toBe('预览标题')
    expect(txt('v-prevP')).toBe('bilibili')
  })

  it('平台适配：累积/覆盖同平台/清空', () => {
    mount()
    click('b-adapt')
    expect(JSON.parse(txt('v-adapt'))).toEqual({ wechat: '微信版', douyin: '抖音版' })
    click('b-adapt2')
    expect(JSON.parse(txt('v-adapt')).wechat).toBe('微信版v2')
    click('b-adaptClr')
    expect(txt('v-adapt')).toBe('{}')
  })

  it('三类句柄注入（insert/writing/panelActions）', () => {
    mount()
    click('b-handles')
    expect(txt('v-ins')).toBe('ins-set')
    expect(txt('v-wins')).toBe('wins-set')
    expect(txt('v-acts')).toBe('acts-set')
  })

  it('currentContent 编辑流', () => {
    mount()
    click('b-current')
    expect(txt('v-current')).toBe('<p>正文</p>')
  })
})

describe('useSelfMediaStore 无 Provider 降级', () => {
  it('只读 no-op 快照，调用不抛错且状态不可变', () => {
    let captured: ReturnType<typeof useSelfMediaStore> | null = null
    const Lonely = () => { captured = useSelfMediaStore(); return null }
    render(<Lonely />)
    const s = captured!
    expect(s.currentContent).toBe('')
    expect(s.activeTemplate).toBeNull()
    expect(s.panelActions).toBeNull()
    expect(() => s.setCurrentContent('x')).not.toThrow()
    expect(() => s.applyTemplate(template())).not.toThrow()
    expect(() => s.setPendingPublish('c')).not.toThrow()
    expect(() => s.addPlatformAdaptation('p', 'c')).not.toThrow()
    expect(() => s.setInsertCallback(() => {})).not.toThrow()
    // no-op 语义：任何调用后快照不变
    expect(s.currentContent).toBe('')
    expect(s.platformAdaptations).toEqual({})
  })
})
