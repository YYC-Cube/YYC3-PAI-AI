/**
 * @file MaterialManager.test.tsx
 * @description 素材管理器专项 — localStorage 持久化/分类与搜索筛选/文件导入/详情编辑/删除联动 IDB/跨面板插入回调
 * 策略：真 theme-store + 真 self-media-store（Provider 模式）；indexedDB-service 用 vi.mock 桩
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { useEffect } from 'react'

vi.mock('../../services/indexeddb-service', () => ({
  indexedDBService: {
    set: vi.fn(),
    delete: vi.fn(),
  },
}))

import { MaterialManager, type MaterialItem } from '../MaterialManager'
import { indexedDBService } from '../../services/indexeddb-service'
import {
  SelfMediaStoreProvider,
  useSelfMediaStore,
  type PanelActions,
} from '../../store/self-media-store'

// ── Fixtures / Helpers ──

const mat = (over: Partial<MaterialItem> = {}): MaterialItem => ({
  id: 'mat_' + Math.random().toString(36).slice(2, 8),
  type: 'text',
  name: '示例素材',
  content: '示例内容',
  tags: [],
  category: 'text',
  size: 1024,
  createdAt: Date.now() - 60_000,
  updatedAt: Date.now() - 60_000,
  ...over,
})

const seedMaterials = (items: MaterialItem[]) => {
  localStorage.setItem('yyc3_materials', JSON.stringify(items))
}

const readLS = (): MaterialItem[] => JSON.parse(localStorage.getItem('yyc3_materials') || '[]')

const btnByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find(b => (b.textContent || '').includes(text))!

/** 类型筛选按钮（文案后拼计数，如「图片1」）— 精确匹配标签，避免命中侧栏分类「图片素材」 */
const typeFilterBtn = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll('button')).find(
    b => (b.textContent || '').replace(/\d+$/, '').trim() === label,
  )!

/** 真 self-media-store 注入器：向 Context 注册 panelActions（App.tsx 同款注入路径） */
function PanelActionsHarness({ actions }: { actions: PanelActions }) {
  const { setPanelActions } = useSelfMediaStore()
  useEffect(() => { setPanelActions(actions) }, [actions, setPanelActions])
  return null
}

beforeEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  // resetAllMocks 清空实现 → 重新注入异步桩，保证 .catch()/await 链路可用
  vi.mocked(indexedDBService.set).mockResolvedValue(undefined)
  vi.mocked(indexedDBService.delete).mockResolvedValue(undefined)
  // jsdom 无 Clipboard API：注入桩供「复制」用例断言
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  })
})

describe('MaterialManager（素材管理器）', () => {
  it('visible=false 时返回 null（懒加载面板契约）', () => {
    const { container } = render(<MaterialManager visible={false} onClose={() => {}} />)
    expect(container.firstElementChild).toBeNull()
  })

  it('visible 渲染骨架：标题/五分类/类型筛选/导入入口 + 空态提示', () => {
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    expect(container.textContent).toContain('素材管理器')
    expect(container.textContent).toContain('0 个素材')
    expect(container.textContent).toContain('还没有素材')
    for (const name of ['全部', '图片素材', '音频素材', '代码片段', '文本片段']) {
      expect(container.textContent).toContain(name)
    }
    expect(container.textContent).toContain('类型筛选')
    expect(container.textContent).toContain('导入素材')
    expect(btnByText(container, '导入素材')).toBeTruthy()
  })

  it('种子素材渲染：结果计数/分类计数/图片缩略图，网格↔列表视图切换', () => {
    seedMaterials([
      mat({ type: 'image', name: '封面图.png', url: 'data:image/png;base64,AAA', category: 'image' }),
      mat({ type: 'code', name: 'hook.ts', content: 'export {}', category: 'code' }),
      mat({ type: 'text', name: '登录页文案', content: '立即开始' }),
    ])
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    expect(container.textContent).toContain('3 个结果')
    expect(container.textContent).toContain('封面图.png')
    // 图片素材以 data URL 渲染缩略图
    expect(container.querySelector('img')!.getAttribute('src')).toBe('data:image/png;base64,AAA')
    // 分类计数：全部=3 / 图片素材=1
    expect(btnByText(container, '全部').textContent!.replace(/\D/g, '')).toBe('3')
    expect(btnByText(container, '图片素材').textContent!.replace(/\D/g, '')).toBe('1')
    // 切换列表视图 → 表格表头出现
    const listBtn = container.querySelector('.lucide-list')!.closest('button')!
    fireEvent.click(listBtn)
    expect(container.querySelector('table')).toBeTruthy()
    expect(container.textContent).toContain('登录页文案')
    expect(container.textContent).toContain('大小')
  })

  it('搜索过滤：命中名称只剩一条；无命中显示「没有匹配的素材」', () => {
    seedMaterials([mat({ name: '封面图', content: 'cover' }), mat({ name: '登录页文案', content: 'copy' })])
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    const search = container.querySelector('input[placeholder="搜索素材..."]') as HTMLInputElement
    fireEvent.change(search, { target: { value: '封面' } })
    expect(container.textContent).toContain('1 个结果')
    expect(container.textContent).toContain('封面图')
    expect(container.textContent).not.toContain('登录页文案')
    fireEvent.change(search, { target: { value: 'zzz不存在的关键词' } })
    expect(container.textContent).toContain('没有匹配的素材')
    expect(container.textContent).toContain('试试其他关键词')
  })

  it('分类与类型筛选联动：点击「图片素材」仅剩图片；类型筛选可切换回全部', () => {
    seedMaterials([
      mat({ type: 'image', name: '海报图', category: 'image', url: 'data:image/png;base64,BBB' }),
      mat({ type: 'text', name: '口播稿' }),
      mat({ type: 'code', name: 'snip.ts', category: 'code' }),
    ])
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    // 分类过滤
    fireEvent.click(btnByText(container, '图片素材'))
    expect(container.textContent).toContain('1 个结果')
    expect(container.textContent).toContain('海报图')
    expect(container.textContent).not.toContain('口播稿')
    // 回到全部
    fireEvent.click(btnByText(container, '全部'))
    expect(container.textContent).toContain('3 个结果')
    // 底部类型筛选（精确匹配「图片」按钮，含计数 1）
    fireEvent.click(typeFilterBtn(container, '图片'))
    expect(container.textContent).toContain('1 个结果')
    // 再点同一类型 → 取消过滤回全部
    fireEvent.click(typeFilterBtn(container, '图片'))
    expect(container.textContent).toContain('3 个结果')
  })

  it('「+ 文本」新建素材：计数 +1、详情面板打开、localStorage 持久化', async () => {
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    fireEvent.click(btnByText(container, '+ 文本'))
    await waitFor(() => expect(container.textContent).toContain('文本片段 1'))
    expect(container.textContent).toContain('1 个素材')
    // 新建后自动选中 → 详情面板出现
    expect(container.textContent).toContain('素材详情')
    const saved = readLS()
    expect(saved).toHaveLength(1)
    expect(saved[0].type).toBe('text')
    expect(saved[0].content).toBe('在此输入文本内容...')
  })

  it('导入文件：txt 走 readAsText、png 走 readAsDataURL，素材入列并持久化', async () => {
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const txt = new File(['hello import'], 'note.txt', { type: 'text/plain' })
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [txt, png] })
    fireEvent.change(input)
    await waitFor(() => expect(container.textContent).toContain('note.txt'))
    expect(container.textContent).toContain('logo.png')
    expect(container.textContent).toContain('2 个素材')
    // 文本内容被真正读取；图片以 data URL 预览
    const saved = readLS()
    expect(saved.find(m => m.name === 'note.txt')!.content).toBe('hello import')
    expect(container.querySelector('img')!.getAttribute('src')).toContain('data:image/png;base64,')
    // 代码扩展名识别为 code 类型
    expect(saved.find(m => m.name === 'logo.png')!.type).toBe('image')
  })

  it('详情面板：点击卡片打开、名称回显、改名持久化、复制走 clipboard', async () => {
    seedMaterials([mat({ name: '旧名字', content: '待复制内容' })])
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    fireEvent.click(Array.from(container.querySelectorAll('p')).find(p => p.textContent === '旧名字')!)
    await waitFor(() => expect(container.textContent).toContain('素材详情'))
    // 名称输入框回显
    const nameInput = Array.from(container.querySelectorAll('input')).find(
      i => i.value === '旧名字',
    ) as HTMLInputElement
    expect(nameInput).toBeTruthy()
    fireEvent.change(nameInput, { target: { value: '新名字' } })
    // 修改落到 localStorage（状态已更新；详情字段回显滞后见疑似 bug 清单）
    await waitFor(() => expect(readLS()[0].name).toBe('新名字'))
    // 复制按钮 → clipboard.writeText 收到素材内容，按钮切换「已复制」
    fireEvent.click(btnByText(container, '复制'))
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('待复制内容'),
    )
    expect(container.textContent).toContain('已复制')
  })

  it('删除素材：普通条目移出列表；storedInIDB 大文件条目联动清理 IndexedDB', async () => {
    seedMaterials([
      mat({ name: '普通素材', createdAt: 1000, updatedAt: 1000 }),
      mat({
        id: 'mat_idb_big',
        name: '大文件素材',
        storedInIDB: true,
        content: '__idb_ref:mat_idb_big',
        createdAt: 2000,
        updatedAt: 2000, // 较新 → 列表首位（updatedAt 倒序）
      }),
    ])
    const { container } = render(<MaterialManager visible onClose={() => {}} />)
    // 列表按 updatedAt 倒序：首卡为大文件素材
    const trashBtn = container.querySelector('.lucide-trash-2')!.closest('button')!
    fireEvent.click(trashBtn)
    await waitFor(() => expect(container.textContent).toContain('1 个素材'))
    expect(container.textContent).not.toContain('大文件素材')
    expect(indexedDBService.delete).toHaveBeenCalledWith('files', 'mat_idb_big')
    expect(readLS()).toHaveLength(1)
    expect(readLS()[0].name).toBe('普通素材')
  })

  it('跨面板联动：onInsertContent 以 markdown 图片回调；panelActions（真 store）承接预览与 AI 改写', async () => {
    const onInsertContent = vi.fn()
    const actions: PanelActions = {
      openAIWriting: vi.fn(),
      openMaterialManager: vi.fn(),
      openContentPreview: vi.fn(),
      openEditor: vi.fn(),
      openPublishQueue: vi.fn(),
      openTrendingTopics: vi.fn(),
    }
    seedMaterials([
      mat({ type: 'image', name: '封面图', url: 'data:image/png;base64,CCC', category: 'image' }),
      mat({ type: 'text', name: '口播稿', content: '大家好' }),
    ])
    const { container } = render(
      <SelfMediaStoreProvider>
        <PanelActionsHarness actions={actions} />
        <MaterialManager visible onClose={() => {}} onInsertContent={onInsertContent} />
      </SelfMediaStoreProvider>,
    )
    // 图片素材插入 → markdown 图片语法
    fireEvent.click(btnByText(container, '插入'))
    expect(onInsertContent).toHaveBeenCalledWith('![封面图](data:image/png;base64,CCC)', 'image')
    // 文本素材详情 → 预览 / AI改写 走真 self-media-store 注入的 panelActions
    fireEvent.click(Array.from(container.querySelectorAll('p')).find(p => p.textContent === '口播稿')!)
    await waitFor(() => expect(container.textContent).toContain('素材详情'))
    fireEvent.click(btnByText(container, '预览'))
    expect(actions.openContentPreview).toHaveBeenCalledWith({ content: '大家好', title: '口播稿' })
    fireEvent.click(btnByText(container, 'AI改写'))
    expect(actions.openAIWriting).toHaveBeenCalledWith({ topic: '大家好', mode: 'rewrite' })
  })
})
