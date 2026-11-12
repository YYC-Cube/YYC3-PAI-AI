/**
 * @file LivePreview.deep.test.tsx
 * @description 实时预览（LivePreview）专项 — 语言探测/八类预览文档构建/Markdown 净化/四种预览模式与防抖/
 *              iframe 渲染耗时/自动刷新/设备模拟/工具开关/控制台/消息通道来源校验/快照历史
 * 策略：真 theme-store + 真 preview-store + 真 DOMPurify，零 vi.mock。
 *       preview-store 是模块级单例且无 reset API → 每例 vi.resetModules() + 动态 import 取全新实例
 *       （顺带覆盖 localStorage 设置恢复）。iframe 消息以 window MessageEvent 注入——组件只监听 window 的
 *       message 事件，不触碰 contentWindow。全程假时钟。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'

// ── 模块装载 ──

type Booted = {
  LivePreview: typeof import('../LivePreview').LivePreview
  store: typeof import('../../store/preview-store').previewStoreActions
  I18nProvider: typeof import('../../i18n/context').I18nProvider
  tk: import('../../store/theme-store').ThemeTokens
}

/** 取一套全新的模块实例；settings 作为持久化设置，在 store 初始化前写入 localStorage */
async function boot(settings?: Record<string, unknown>): Promise<Booted> {
  if (settings) localStorage.setItem('yyc3_preview_settings', JSON.stringify(settings))
  vi.resetModules()
  const [preview, store, i18n, theme] = await Promise.all([
    import('../LivePreview'),
    import('../../store/preview-store'),
    import('../../i18n/context'),
    import('../../store/theme-store'),
  ])
  return {
    LivePreview: preview.LivePreview,
    store: store.previewStoreActions,
    I18nProvider: i18n.I18nProvider,
    tk: theme.THEMES.cyberpunk,
  }
}

/** vi.resetAllMocks() 会清掉 setup.ts 中 matchMedia 桩的实现；theme-store 模块顶层要调用它，重载前须重新桩定 */
const restubMatchMedia = () => {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList)
}

// ── Fixtures / Helpers ──

const SNIPPET = '<h1>预览标题</h1><p>正文段落</p>'

const iframeOf = (root: HTMLElement) => root.querySelector('iframe')

const srcdoc = (root: HTMLElement) => iframeOf(root)?.getAttribute('srcdoc') ?? ''

/** 推进假时钟并冲刷微任务（jsdom 以微任务派发 iframe 的 load，需落在 act 内） */
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })

/** CyberTooltip 包裹层：按 tooltip 文案定位 */
const tipWrap = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll('div.relative.group')).find(w => w.lastElementChild?.textContent === label)

const tipBtn = (root: HTMLElement, label: string) =>
  tipWrap(root, label)!.querySelector('button') as HTMLButtonElement

/** 工具栏内 letter-spacing 为 1px 的两个标签：[0] 模式/状态文案，[1] 语言徽标 */
const toolbarLabels = (root: HTMLElement) => root.querySelectorAll('span[style*="letter-spacing: 1px"]')
const statusLabel = (root: HTMLElement) => toolbarLabels(root)[0].textContent
const langBadge = (root: HTMLElement) => toolbarLabels(root)[1].textContent

const deviceBtn = (root: HTMLElement) => tipBtn(root, '设备模拟')

const deviceMenu = (root: HTMLElement) => root.querySelector('div.absolute.top-full')

const pickDevice = (root: HTMLElement, name: string) => {
  fireEvent.click(deviceBtn(root))
  const item = Array.from(deviceMenu(root)!.querySelectorAll('button'))
    .find(b => b.querySelector('span')?.textContent === name)!
  fireEvent.click(item)
}

/** 设备外框（宽度/圆角随设备与缩放变化） */
const frameBox = (root: HTMLElement) =>
  root.querySelector('div[style*="transition: width 0.3s"]') as HTMLElement

const notch = (root: HTMLElement) => root.querySelector('div.rounded-full[style*="width: 40px"]')

/** 模拟预览 iframe 向父窗口 postMessage（srcdoc 沙箱 iframe 的 origin 为 'null'） */
const post = (data: unknown, origin = 'null') =>
  act(() => { window.dispatchEvent(new MessageEvent('message', { data, origin })) })

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  restubMatchMedia()
  vi.useFakeTimers()
})

afterEach(() => {
  // 先在假时钟下卸载（清掉防抖/自动刷新定时器），再还原真时钟
  cleanup()
  vi.useRealTimers()
})

describe('LivePreview（实时预览）', () => {
  it('空代码：占位提示且不渲染 iframe；工具栏骨架（中/英文）；展开按钮仅在提供回调时渲染并随状态换文案', async () => {
    const { LivePreview, I18nProvider } = await boot()
    const { container, rerender, unmount } = render(<LivePreview code="   " fileName="index.html" />)
    expect(iframeOf(container)).toBeNull()
    expect(container.textContent).toContain('输入代码开始预览')
    expect(statusLabel(container)).toBe('实时')
    expect(langBadge(container)).toBe('HTML')
    expect(deviceBtn(container).textContent).toContain('自适应')
    expect(container.textContent).toContain('100%')
    // 未提供 onToggleExpand → 不渲染展开/收起
    expect(tipWrap(container, '展开')).toBeUndefined()
    expect(tipWrap(container, '收起')).toBeUndefined()

    const onToggleExpand = vi.fn()
    rerender(<LivePreview code="   " fileName="index.html" onToggleExpand={onToggleExpand} />)
    fireEvent.click(tipBtn(container, '展开'))
    expect(onToggleExpand).toHaveBeenCalledTimes(1)
    rerender(<LivePreview code="   " fileName="index.html" onToggleExpand={onToggleExpand} isExpanded />)
    expect(tipWrap(container, '展开')).toBeUndefined()
    fireEvent.click(tipBtn(container, '收起'))
    expect(onToggleExpand).toHaveBeenCalledTimes(2)
    unmount()

    // 英文 locale（真 I18nProvider）
    localStorage.setItem('yyc3-locale', 'en')
    const en = render(
      <I18nProvider>
        <LivePreview code="" fileName="index.html" onToggleExpand={onToggleExpand} />
      </I18nProvider>,
    )
    expect(en.container.textContent).toContain('START TYPING TO PREVIEW')
    expect(statusLabel(en.container)).toBe('LIVE')
    expect(tipBtn(en.container, 'DEVICE').textContent).toContain('AUTO')
    expect(tipWrap(en.container, 'EXPAND')).toBeTruthy()
  })

  it('语言探测：扩展名映射到预览语言，未知/无扩展名回退 HTML，language 属性显式覆盖', async () => {
    const { LivePreview } = await boot()
    const { container, rerender } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    const cases: Array<[string, string]> = [
      ['page.htm', 'HTML'], ['theme.scss', 'CSS'], ['theme.less', 'CSS'],
      ['main.js', 'JAVASCRIPT'], ['util.mjs', 'JAVASCRIPT'], ['types.ts', 'TYPESCRIPT'],
      ['App.tsx', 'REACT'], ['Card.jsx', 'REACT'], ['README.md', 'MARKDOWN'], ['doc.mdx', 'MARKDOWN'],
      ['logo.svg', 'SVG'], ['data.json', 'JSON'], ['App.vue', 'VUE'],
      ['UPPER.HTML', 'HTML'], ['Makefile', 'HTML'], ['notes.txt', 'HTML'],
    ]
    for (const [fileName, lang] of cases) {
      rerender(<LivePreview code={SNIPPET} fileName={fileName} />)
      expect(langBadge(container), fileName).toBe(lang)
    }
    rerender(<LivePreview code={SNIPPET} fileName="notes.txt" language="markdown" />)
    expect(langBadge(container)).toBe('MARKDOWN')
  })

  it('HTML 文档构建：片段包裹基础样式与桥接脚本；完整文档原样保留、仅在 </body> 前注入；iframe 沙箱不含同源权限', async () => {
    const { LivePreview, tk } = await boot()
    const { container, rerender } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    const frame = iframeOf(container)!
    expect(frame.getAttribute('title')).toBe('Live Preview')
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts allow-modals')

    const doc = srcdoc(container)
    expect(doc.startsWith('<!DOCTYPE html><html><head><style>')).toBe(true)
    expect(doc).toContain(`<body>${SNIPPET}`)
    // 主题令牌注入基础样式
    expect(doc).toContain(`font-family: ${tk.fontBody}; background: ${tk.background}; color: ${tk.foreground};`)
    // 控制台捕获 / 错误上报 / 滚动同步 桥接脚本
    for (const marker of ["type: 'yyc3-console'", "type: 'yyc3-error'", "type: 'yyc3-scroll'", "'yyc3-scroll-to'"]) {
      expect(doc).toContain(marker)
    }

    const full = '<!DOCTYPE html><html><head><title>完整文档</title></head><body><main>主体</main></body></html>'
    rerender(<LivePreview code={full} fileName="index.html" />)
    const fullDoc = srcdoc(container)
    expect(fullDoc.startsWith('<!DOCTYPE html><html><head><title>完整文档</title></head><body><main>主体</main>')).toBe(true)
    expect(fullDoc.endsWith('</body></html>')).toBe(true)
    // 不注入基础样式，只在 </body> 前追加桥接脚本
    expect(fullDoc).not.toContain('box-sizing: border-box')
    expect(fullDoc).toContain("type: 'yyc3-console'")
    expect(fullDoc.indexOf("type: 'yyc3-console'")).toBeLessThan(fullDoc.lastIndexOf('</body>'))
  })

  it('各语言文档构建：CSS 示例页 / JS 输出面板 / TS 类型擦除 / React UMD+Babel / JSON 解析脚本 / SVG 居中 / 未知类型转义', async () => {
    const { LivePreview } = await boot()
    const { container, rerender } = render(<LivePreview code=".btn { color: red; }" fileName="style.css" />)
    // CSS：代码进入 <style>，并附带示例元素
    let doc = srcdoc(container)
    expect(doc).toContain('.btn { color: red; }</style>')
    expect(doc).toContain('<button class="btn">Button</button>')
    expect(doc).toContain('Card Component')

    // JavaScript：输出面板 + try/catch 包裹用户代码
    rerender(<LivePreview code={"console.log('hi')"} fileName="main.js" />)
    doc = srcdoc(container)
    expect(doc).toContain('<div id="output"></div>')
    expect(doc).toContain("console.log('hi')")
    expect(doc).toContain("errDiv.className = 'error-display'")

    // TypeScript：变量类型标注、interface、type 别名被擦除
    const tsCode = 'const n: number = 1;\ninterface User { id: string }\ntype ID = string;\nconsole.log(n)'
    rerender(<LivePreview code={tsCode} fileName="main.ts" />)
    doc = srcdoc(container)
    expect(doc).toContain('const n = 1;')
    expect(doc).not.toContain('interface User')
    expect(doc).not.toContain('type ID')
    expect(doc).toContain('console.log(n)')

    // React：UMD 运行时 + Babel；import 移除、export 改写
    const reactCode = [
      "import { useState } from 'react';",
      "export const title = 'Hi';",
      'export default function App() { return <div>{title}</div> }',
    ].join('\n')
    rerender(<LivePreview code={reactCode} fileName="App.tsx" />)
    doc = srcdoc(container)
    for (const url of [
      'https://unpkg.com/react@18/umd/react.development.js',
      'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
      'https://unpkg.com/@babel/standalone/babel.min.js',
    ]) {
      expect(doc).toContain(url)
    }
    expect(doc).toContain('<script type="text/babel" data-presets="react,typescript">')
    expect(doc).toContain('// [import removed for preview]')
    expect(doc).not.toContain("from 'react'")
    expect(doc).toContain("const title = 'Hi';")
    expect(doc).toContain('const __Default = function App() { return <div>{title}</div> }')

    // JSON：源码以字符串字面量嵌入解析脚本
    const jsonCode = '{"name":"yyc3","count":2}'
    rerender(<LivePreview code={jsonCode} fileName="data.json" />)
    doc = srcdoc(container)
    expect(doc).toContain('<pre id="json-output"></pre>')
    expect(doc).toContain(`JSON.parse(${JSON.stringify(jsonCode)})`)

    // SVG：原样内嵌 + 居中样式
    const svgCode = '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>'
    rerender(<LivePreview code={svgCode} fileName="logo.svg" />)
    doc = srcdoc(container)
    expect(doc).toContain(`<body>${svgCode}`)
    expect(doc).toContain('max-height: 90vh')

    // 未知类型（vue）：转义后放入 <pre>
    rerender(<LivePreview code="<template><p>{{ msg }}</p></template>" fileName="App.vue" />)
    doc = srcdoc(container)
    expect(doc).toContain('<pre style="padding:16px;">&lt;template&gt;&lt;p&gt;{{ msg }}&lt;/p&gt;&lt;/template&gt;</pre>')
  })

  it('Markdown 渲染与净化：标题/强调/列表/引用/分隔线/链接/代码块进入文档；脚本、事件属性与 javascript: 链接被剥离', async () => {
    const { LivePreview } = await boot()
    const md = [
      '# 一级标题',
      '## 二级标题',
      '### 三级标题',
      '',
      '**粗体** 与 *斜体* 与 ***粗斜体*** 及 `行内代码`',
      '',
      '- 列表项甲',
      '- 列表项乙',
      '',
      '> 引用内容',
      '',
      '---',
      '',
      '[安全链接](https://example.com/docs)',
      '',
      '```js',
      'const answer = 42',
      '```',
      '',
      '<script>steal("token")</script>',
      '<img src="https://img.example.com/a.png" onerror="steal()">',
      '[坏链接](javascript:steal)',
    ].join('\n')
    const { container } = render(<LivePreview code={md} fileName="README.md" />)
    const doc = srcdoc(container)
    for (const html of [
      '<h1>一级标题</h1>', '<h2>二级标题</h2>', '<h3>三级标题</h3>',
      '<strong>粗体</strong>', '<em>斜体</em>', '<strong><em>粗斜体</em></strong>', '<code>行内代码</code>',
      '<li>列表项甲</li>', '<li>列表项乙</li>', '<blockquote>引用内容</blockquote>', '<hr>',
      '<code class="lang-js">const answer = 42',
    ]) {
      expect(doc).toContain(html)
    }
    expect(doc).toMatch(/<ul>\s*<li>列表项甲<\/li>/)
    expect(doc).toMatch(/<a [^>]*href="https:\/\/example\.com\/docs"[^>]*>安全链接<\/a>/)
    // 净化：<script> 整段移除、onerror 属性剥离但图片保留、javascript: 链接失效但文字保留
    expect(doc).not.toContain('steal')
    expect(doc).toContain('<img src="https://img.example.com/a.png">')
    expect(doc).toContain('坏链接')
  })

  it('预览模式循环：实时→手动→延迟→智能→实时并逐次持久化；手动模式不做防抖重挂载，点刷新才重挂载', async () => {
    const { LivePreview, store } = await boot()
    const { container, rerender } = render(<LivePreview code="" fileName="index.html" />)
    const cycle = () => fireEvent.click(tipBtn(container, '切换预览模式'))
    const persistedMode = () => JSON.parse(localStorage.getItem('yyc3_preview_settings') ?? '{}').mode
    expect(statusLabel(container)).toBe('实时')
    expect(tipWrap(container, '刷新预览')).toBeUndefined()

    const sequence: Array<[string, string]> = [
      ['manual', '手动'], ['delayed', '延迟'], ['smart', '智能'], ['realtime', '实时'],
    ]
    for (const [mode, label] of sequence) {
      cycle()
      expect(store.getState().mode).toBe(mode)
      expect(statusLabel(container)).toBe(label)
      expect(persistedMode()).toBe(mode)
      // 刷新按钮仅手动模式可见
      expect(Boolean(tipWrap(container, '刷新预览'))).toBe(mode === 'manual')
    }

    // 手动模式 + 有代码：不进入「更新中」，代码变更后也不做防抖重挂载
    cycle()
    rerender(<LivePreview code={SNIPPET} fileName="index.html" />)
    const mounted = iframeOf(container)
    expect(mounted).toBeTruthy()
    expect(statusLabel(container)).toBe('手动')
    rerender(<LivePreview code={`${SNIPPET}<p>追加</p>`} fileName="index.html" />)
    await advance(5000)
    expect(statusLabel(container)).toBe('手动')
    expect(iframeOf(container)).toBe(mounted)

    // 点击刷新：进入「更新中」并重挂载，100ms 后回落
    fireEvent.click(tipBtn(container, '刷新预览'))
    expect(statusLabel(container)).toBe('更新中')
    expect(iframeOf(container)).not.toBe(mounted)
    expect(srcdoc(container)).toContain('<p>追加</p>')
    await advance(100)
    expect(statusLabel(container)).toBe('手动')
  })

  it('实时模式防抖：挂载/变更即进入「更新中」，150ms 后重挂载 iframe 并回落；连续变更重置防抖窗口', async () => {
    const { LivePreview, store } = await boot()
    const { container, rerender } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    const first = iframeOf(container)
    expect(statusLabel(container)).toBe('更新中')
    expect(store.getState().isUpdating).toBe(true)
    await advance(149)
    expect(iframeOf(container)).toBe(first)
    await advance(1)
    const second = iframeOf(container)
    expect(second).not.toBe(first)
    expect(statusLabel(container)).toBe('实时')
    expect(store.getState().isUpdating).toBe(false)

    // 连续两次变更：第二次变更重置 150ms 窗口
    rerender(<LivePreview code={`${SNIPPET}<i>A</i>`} fileName="index.html" />)
    expect(statusLabel(container)).toBe('更新中')
    await advance(100)
    rerender(<LivePreview code={`${SNIPPET}<i>B</i>`} fileName="index.html" />)
    await advance(100)
    expect(iframeOf(container)).toBe(second)
    expect(statusLabel(container)).toBe('更新中')
    await advance(50)
    expect(iframeOf(container)).not.toBe(second)
    expect(srcdoc(container)).toContain('<i>B</i>')
    expect(statusLabel(container)).toBe('实时')
  })

  it('延迟/智能模式的防抖时长与自动刷新：延迟用 store.delay（300→800）；智能按代码长度 100/300/600ms；自动刷新按间隔重挂载', async () => {
    const { LivePreview, store } = await boot({ mode: 'delayed' })
    const { container, rerender } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    /** 断言 iframe 恰在 ms 毫秒时重挂载（ms−1 时仍是旧节点） */
    const remountsAfter = async (ms: number) => {
      const before = iframeOf(container)
      await advance(ms - 1)
      expect(iframeOf(container), `${ms}ms 之前不应重挂载`).toBe(before)
      await advance(1)
      expect(iframeOf(container), `${ms}ms 时应重挂载`).not.toBe(before)
    }
    // 延迟模式：持久化设置恢复为 delayed，默认 300ms
    expect(statusLabel(container)).toBe('更新中')
    await remountsAfter(300)
    expect(statusLabel(container)).toBe('延迟')
    act(() => store.setDelay(800))
    await remountsAfter(800)

    // 智能模式：< 500 字符 100ms；500–1999 字符 300ms；≥ 2000 字符 600ms
    act(() => store.setMode('smart'))
    await remountsAfter(100)
    rerender(<LivePreview code={SNIPPET + 'x'.repeat(1000)} fileName="index.html" />)
    await remountsAfter(300)
    rerender(<LivePreview code={SNIPPET + 'x'.repeat(3000)} fileName="index.html" />)
    await remountsAfter(600)
    expect(statusLabel(container)).toBe('智能')

    // 自动刷新：每个间隔重挂载一次；置 0 后停止
    act(() => store.setAutoRefreshInterval(1000))
    await remountsAfter(1000)
    await remountsAfter(1000)
    act(() => store.setAutoRefreshInterval(0))
    const settled = iframeOf(container)
    await advance(5000)
    expect(iframeOf(container)).toBe(settled)
  })

  it('渲染耗时：防抖触发到 iframe load 的间隔写入徽标，并按 <100 / <500 / ≥500ms 三档着色', async () => {
    const { LivePreview, store, tk } = await boot()
    const { container, rerender } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    expect(container.querySelector('svg.lucide-gauge')).toBeNull()
    /**
     * 触发一次防抖刷新，并让新 iframe 在 loadMs 毫秒后完成加载：
     * jsdom 以微任务派发 load，故先同步拨快假时钟（微任务尚未执行），再在 act 内冲刷。
     */
    const refreshAndLoad = async (loadMs: number) => {
      act(() => { vi.advanceTimersByTime(150) })
      vi.advanceTimersByTime(loadMs)
      await act(async () => {})
    }
    const gaugeColor = () => container.querySelector('svg.lucide-gauge')!.getAttribute('stroke')

    await refreshAndLoad(42)
    expect(store.getState().renderTime).toBe(42)
    expect(tipWrap(container, '渲染耗时')!.textContent).toContain('42ms')
    expect(gaugeColor()).toBe(tk.success)

    rerender(<LivePreview code={`${SNIPPET}<b>1</b>`} fileName="index.html" />)
    await refreshAndLoad(250)
    expect(tipWrap(container, '渲染耗时')!.textContent).toContain('250ms')
    expect(gaugeColor()).toBe(tk.warning)

    rerender(<LivePreview code={`${SNIPPET}<b>2</b>`} fileName="index.html" />)
    await refreshAndLoad(800)
    expect(tipWrap(container, '渲染耗时')!.textContent).toContain('800ms')
    expect(gaugeColor()).toBe(tk.error)
  })

  it('设备模拟：菜单列出八种预设；选择后尺寸/设备外壳/旋转联动；遮罩点击关闭菜单；关闭边框去掉外壳', async () => {
    const { LivePreview, store } = await boot()
    const { container } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    await advance(150)
    // 自适应：满宽、视口高度、无旋转按钮
    expect(frameBox(container).style.width).toBe('100%')
    expect(iframeOf(container)!.style.height).toBe('calc(100vh - 200px)')
    expect(tipWrap(container, '旋转')).toBeUndefined()

    // 打开菜单：8 项预设（自适应不带尺寸），遮罩点击关闭
    fireEvent.click(deviceBtn(container))
    const items = Array.from(deviceMenu(container)!.querySelectorAll('button'))
    expect(items.map(b => b.querySelector('span')!.textContent)).toEqual([
      '自适应', '桌面端', '笔记本', 'iPad Pro', 'iPad', 'iPhone 15', 'iPhone SE', 'Android',
    ])
    expect(items[0].textContent).toBe('自适应')
    expect(items[5].textContent).toContain('393×852')
    fireEvent.click(container.querySelector('div.fixed.inset-0')!)
    expect(deviceMenu(container)).toBeNull()

    // iPhone 15：尺寸、大圆角、刘海条；选择后菜单收起
    pickDevice(container, 'iPhone 15')
    expect(store.getState().deviceId).toBe('iphone-15')
    expect(deviceMenu(container)).toBeNull()
    expect(deviceBtn(container).textContent).toContain('393×852')
    expect(frameBox(container).style.width).toBe('393px')
    expect(frameBox(container).style.borderRadius).toBe('28px')
    expect(iframeOf(container)!.style.height).toBe('852px')
    expect(notch(container)).toBeTruthy()
    // 旋转：宽高互换，再转回竖屏
    fireEvent.click(tipBtn(container, '旋转'))
    expect(store.getState().orientation).toBe('landscape')
    expect(deviceBtn(container).textContent).toContain('852×393')
    expect(frameBox(container).style.width).toBe('852px')
    expect(iframeOf(container)!.style.height).toBe('393px')
    fireEvent.click(tipBtn(container, '旋转'))
    expect(store.getState().orientation).toBe('portrait')

    // iPad：中圆角、无刘海
    pickDevice(container, 'iPad')
    expect(deviceBtn(container).textContent).toContain('768×1024')
    expect(frameBox(container).style.borderRadius).toBe('16px')
    expect(notch(container)).toBeNull()

    // 桌面端：浏览器外壳带地址栏
    pickDevice(container, '桌面端')
    expect(frameBox(container).style.borderRadius).toBe('8px')
    expect(container.textContent).toContain('localhost:5173/index.html')

    // 关闭设备边框：外壳与圆角消失
    fireEvent.click(tipBtn(container, '设备边框'))
    expect(store.getState().showDeviceFrame).toBe(false)
    expect(container.textContent).not.toContain('localhost:5173/index.html')
    expect(frameBox(container).style.borderRadius).toBe('0px')

    // 回到自适应：旋转按钮消失、恢复满宽
    pickDevice(container, '自适应')
    expect(tipWrap(container, '旋转')).toBeUndefined()
    expect(frameBox(container).style.width).toBe('100%')
  })

  it('工具开关：从 localStorage 恢复设置；滚动同步图标切换；网格层仅在非自适应设备渲染；缩放步进并钳制在 25%–200%', async () => {
    const { LivePreview, store } = await boot({
      deviceId: 'iphone-se', showGridLines: true, zoom: 0.5, scrollSyncEnabled: false,
    })
    const { container } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    await advance(150)
    const grid = () => container.querySelector('div.absolute.inset-0.pointer-events-none')
    const zoomButton = (icon: string) => container.querySelector(`svg.lucide-zoom-${icon}`)!.closest('button')!
    const zoomText = () => zoomButton('out').nextElementSibling!.textContent
    // 持久化设置恢复：设备、缩放（尺寸按缩放折算）、网格、滚动同步关闭
    expect(deviceBtn(container).textContent).toContain('375×667')
    expect(zoomText()).toBe('50%')
    expect(frameBox(container).style.width).toBe('187.5px')
    expect(iframeOf(container)!.style.height).toBe('333.5px')
    expect(grid()).toBeTruthy()
    expect(container.querySelector('svg.lucide-link-2-off')).toBeTruthy()

    // 滚动同步：图标由断开切为连接
    fireEvent.click(tipBtn(container, '滚动同步'))
    expect(store.getState().scrollSyncEnabled).toBe(true)
    expect(container.querySelector('svg.lucide-link-2-off')).toBeNull()
    expect(container.querySelector('svg.lucide-link-2')).toBeTruthy()

    // 网格线：关 → 开；切回自适应后即便开启也不渲染
    fireEvent.click(tipBtn(container, '网格线'))
    expect(grid()).toBeNull()
    fireEvent.click(tipBtn(container, '网格线'))
    expect(grid()).toBeTruthy()
    pickDevice(container, '自适应')
    expect(store.getState().showGridLines).toBe(true)
    expect(grid()).toBeNull()

    // 缩放：±10% 步进，上限 200%、下限 25%
    fireEvent.click(zoomButton('in'))
    expect(zoomText()).toBe('60%')
    for (let i = 0; i < 20; i++) fireEvent.click(zoomButton('in'))
    expect(zoomText()).toBe('200%')
    expect(store.getState().zoom).toBe(2)
    for (let i = 0; i < 30; i++) fireEvent.click(zoomButton('out'))
    expect(zoomText()).toBe('25%')
    expect(store.getState().zoom).toBe(0.25)
  })

  it('控制台面板：开关与空态；四类消息入列并计数；错误数徽标；清空与关闭', async () => {
    const { LivePreview, store } = await boot()
    const { container } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    await advance(150)
    const panel = () =>
      Array.from(container.querySelectorAll<HTMLElement>('div.border-t')).find(d => d.style.height === '150px')
    const errorBadge = () => tipBtn(container, '控制台').querySelector('span')
    expect(panel()).toBeUndefined()

    fireEvent.click(tipBtn(container, '控制台'))
    expect(panel()!.textContent).toContain('暂无输出')
    expect(panel()!.textContent).toContain('(0)')
    expect(errorBadge()).toBeNull()

    post({ type: 'yyc3-console', logType: 'log', message: '普通日志' })
    post({ type: 'yyc3-console', logType: 'info', message: '提示信息' })
    post({ type: 'yyc3-console', logType: 'warn', message: '警告信息' })
    post({ type: 'yyc3-console', logType: 'error', message: '错误甲' })
    post({ type: 'yyc3-console', logType: 'error', message: '错误乙' })
    const text = panel()!.textContent!
    for (const part of ['[LOG]', '普通日志', '[INFO]', '提示信息', '[WARN]', '警告信息', '[ERROR]', '错误甲', '错误乙', '(5)']) {
      expect(text).toContain(part)
    }
    expect(text).not.toContain('暂无输出')
    // 工具栏控制台按钮上的错误数徽标
    expect(errorBadge()!.textContent).toBe('2')

    // 清空
    fireEvent.click(tipBtn(container, '清空'))
    expect(store.getState().consoleEntries).toHaveLength(0)
    expect(panel()!.textContent).toContain('暂无输出')
    expect(errorBadge()).toBeNull()

    // 面板内 X 关闭
    fireEvent.click(panel()!.querySelector('svg.lucide-x')!.closest('button')!)
    expect(panel()).toBeUndefined()
    expect(store.getState().consoleVisible).toBe(false)
  })

  it('消息通道：第三方来源与非对象数据被拒收、同源放行；yyc3-error 置错误态并入控制台，下次刷新清除；yyc3-scroll 回调受滚动同步开关控制', async () => {
    const { LivePreview, store } = await boot()
    const onScrollSync = vi.fn()
    const { container, rerender } = render(
      <LivePreview code={SNIPPET} fileName="index.html" onScrollSync={onScrollSync} />,
    )
    await advance(150)

    // 来源校验：第三方页面伪造的三类消息一律丢弃
    post({ type: 'yyc3-console', logType: 'log', message: '伪造日志' }, 'https://evil.example.com')
    post({ type: 'yyc3-error', message: '伪造错误' }, 'https://evil.example.com')
    post({ type: 'yyc3-scroll', ratio: 0.9 }, 'https://evil.example.com')
    // 形状校验：非对象 / 空数据 / 未知类型
    post('yyc3-console')
    post(null)
    post({ type: 'unknown-type', message: 'x' })
    expect(store.getState().consoleEntries).toHaveLength(0)
    expect(store.getState().error).toBeNull()
    expect(onScrollSync).not.toHaveBeenCalled()
    // 同源消息放行
    post({ type: 'yyc3-console', logType: 'log', message: '同源日志' }, window.location.origin)
    expect(store.getState().consoleEntries.map(e => e.message)).toEqual(['同源日志'])

    // 错误上报：写入错误态、工具栏出现告警图标（tooltip 截断为前 100 字符）、同时入控制台
    const longMessage = `ReferenceError: ${'x'.repeat(150)}`
    post({ type: 'yyc3-error', message: longMessage, line: 3, column: 7, stack: 'at <anonymous>:3:7' })
    expect(store.getState().error).toEqual({ message: longMessage, line: 3, column: 7, stack: 'at <anonymous>:3:7' })
    const alertIcon = container.querySelector('svg.lucide-triangle-alert')!
    expect(alertIcon.closest('div.relative.group')!.lastElementChild!.textContent).toBe(longMessage.slice(0, 100))
    expect(store.getState().consoleEntries.map(e => [e.type, e.message])).toContainEqual(['error', longMessage])
    // 下一次防抖刷新清除错误态
    rerender(<LivePreview code={`${SNIPPET}<p>修复</p>`} fileName="index.html" onScrollSync={onScrollSync} />)
    await advance(150)
    expect(store.getState().error).toBeNull()
    expect(container.querySelector('svg.lucide-triangle-alert')).toBeNull()

    // 滚动同步：开启时回调收到比例；关闭后不再回调
    post({ type: 'yyc3-scroll', ratio: 0.42 })
    expect(onScrollSync).toHaveBeenCalledTimes(1)
    expect(onScrollSync).toHaveBeenCalledWith(0.42)
    fireEvent.click(tipBtn(container, '滚动同步'))
    post({ type: 'yyc3-scroll', ratio: 0.8 })
    expect(onScrollSync).toHaveBeenCalledTimes(1)
  })

  it('快照与历史面板：空态与导航禁用；保存快照后列表/语言标签/前进后退/点击定位；关闭面板', async () => {
    const { LivePreview, store } = await boot()
    const { container, rerender } = render(<LivePreview code={SNIPPET} fileName="index.html" />)
    await advance(150)
    const panel = () => container.querySelector('div.absolute.bottom-0.right-0')
    /** 面板头部三个按钮：[0] 后退 [1] 前进 [2] 关闭 */
    const navButtons = () => Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button:not(.w-full)'))
    const entries = () => Array.from(panel()!.querySelectorAll<HTMLButtonElement>('button.w-full'))
    expect(panel()).toBeNull()

    // 空态：无快照，前进/后退均禁用
    fireEvent.click(tipBtn(container, '预览历史'))
    expect(panel()!.textContent).toContain('暂无快照')
    expect(navButtons()).toHaveLength(3)
    expect(navButtons()[0].disabled).toBe(true)
    expect(navButtons()[1].disabled).toBe(true)

    // 两次快照（HTML → CSS）
    fireEvent.click(tipBtn(container, '保存快照'))
    rerender(<LivePreview code=".a { color: red; }" fileName="style.css" />)
    fireEvent.click(tipBtn(container, '保存快照'))
    expect(store.getState().history.map(s => [s.code, s.language])).toEqual([
      [SNIPPET, 'html'], ['.a { color: red; }', 'css'],
    ])
    expect(store.getState().historyIndex).toBe(1)
    expect(entries()).toHaveLength(2)
    expect(entries()[0].textContent).toContain('快照 #1')
    expect(entries()[0].textContent).toContain('— HTML')
    expect(entries()[1].textContent).toContain('快照 #2')
    expect(entries()[1].textContent).toContain('— CSS')

    // 位于最新：可后退、不可前进；后退到首条后反之
    expect(navButtons()[0].disabled).toBe(false)
    expect(navButtons()[1].disabled).toBe(true)
    fireEvent.click(navButtons()[0])
    expect(store.getState().historyIndex).toBe(0)
    expect(navButtons()[0].disabled).toBe(true)
    expect(navButtons()[1].disabled).toBe(false)
    fireEvent.click(navButtons()[1])
    expect(store.getState().historyIndex).toBe(1)
    // 点击条目定位到该快照
    fireEvent.click(entries()[0])
    expect(store.getState().historyIndex).toBe(0)

    // 关闭面板
    fireEvent.click(navButtons()[2])
    expect(panel()).toBeNull()
  })
})
