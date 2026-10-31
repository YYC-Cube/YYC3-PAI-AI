/**
 * @file monaco-setup.test.ts
 * @description Monaco 本地化装配测试 — worker 标签路由 + loader 本地注入（mock ?worker 与 monaco）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { workerCtor, makeWorker } = vi.hoisted(() => {
  const workerCtor = vi.fn()
  const makeWorker = (name: string) => class { constructor() { workerCtor(name) } }
  return { workerCtor, makeWorker }
})

vi.mock('@monaco-editor/react', () => ({
  loader: { config: vi.fn() },
}))

vi.mock('monaco-editor', () => ({ __monacoNamespace: true }))

vi.mock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({ default: makeWorker('editor') }))
vi.mock('monaco-editor/esm/vs/language/json/json.worker?worker', () => ({ default: makeWorker('json') }))
vi.mock('monaco-editor/esm/vs/language/css/css.worker?worker', () => ({ default: makeWorker('css') }))
vi.mock('monaco-editor/esm/vs/language/html/html.worker?worker', () => ({ default: makeWorker('html') }))
vi.mock('monaco-editor/esm/vs/language/typescript/ts.worker?worker', () => ({ default: makeWorker('typescript') }))

import { loader } from '@monaco-editor/react'
import { monaco } from '../monaco-setup'

/** 模块把装配挂到 self.MonacoEnvironment */
const getWorker = (label: string): Worker => (self as unknown as { MonacoEnvironment: { getWorker: (id: string, label: string) => Worker } }).MonacoEnvironment.getWorker('unused', label)

beforeEach(() => {
  workerCtor.mockClear()
  // loader.config 仅在模块装配时调用一次，不可 clear（首个用例断言的就是这条记录）
})

describe('monaco-setup 本地化装配', () => {
  it('loader.config 注入本地 monaco 实例（禁用 CDN）', () => {
    expect(loader.config).toHaveBeenCalledWith({ monaco })
  })

  it('json 标签路由到 json worker', () => {
    const w = getWorker('json')
    expect(workerCtor).toHaveBeenCalledWith('json')
    expect(w).toBeTruthy()
  })

  it('css/scss/less 三个标签共用 css worker', () => {
    getWorker('css')
    getWorker('scss')
    getWorker('less')
    expect(workerCtor.mock.calls.filter(c => c[0] === 'css')).toHaveLength(3)
  })

  it('html/handlebars/razor 共用 html worker', () => {
    getWorker('html')
    getWorker('handlebars')
    getWorker('razor')
    expect(workerCtor.mock.calls.filter(c => c[0] === 'html')).toHaveLength(3)
  })

  it('typescript/javascript 共用 ts worker', () => {
    getWorker('typescript')
    getWorker('javascript')
    expect(workerCtor.mock.calls.filter(c => c[0] === 'typescript')).toHaveLength(2)
  })

  it('未知标签回退 editor worker', () => {
    getWorker('yaml')
    expect(workerCtor).toHaveBeenLastCalledWith('editor')
  })
})
