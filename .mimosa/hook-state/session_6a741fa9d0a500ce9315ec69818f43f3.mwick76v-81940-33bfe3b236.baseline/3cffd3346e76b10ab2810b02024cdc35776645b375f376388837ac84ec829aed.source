/**
 * @file ide-mock-data.test.ts
 * @description IDE mock 数据与 VFS 纯函数 — vfsResolve/vfsResolveParts/vfsListDir/vfsTreeLines
 */

import { describe, it, expect } from 'vitest'
import {
  MOCK_FILE_TREE,
  SAMPLE_CODE,
  TERMINAL_HISTORY,
  MOCK_PROJECTS,
  INITIAL_VFS,
  vfsResolve,
  vfsResolveParts,
  vfsListDir,
  vfsTreeLines,
} from '../ide-mock-data'

describe('ide-mock-data 静态数据', () => {
  it('MOCK_FILE_TREE 根节点含 src 目录与三个根级文件', () => {
    expect(MOCK_FILE_TREE).toHaveLength(4)
    expect(MOCK_FILE_TREE[0].name).toBe('src')
    expect(MOCK_FILE_TREE[0].type).toBe('folder')
    const rootFiles = MOCK_FILE_TREE.filter(n => n.type === 'file').map(n => n.name)
    expect(rootFiles).toEqual(['package.json', 'tsconfig.json', 'vite.config.ts'])
  })

  it('SAMPLE_CODE 含 Panel 组件源码；TERMINAL_HISTORY 输入行以 $ 开头', () => {
    expect(SAMPLE_CODE).toContain('export function Panel')
    expect(TERMINAL_HISTORY[0]).toEqual({ type: 'input', text: '$ npm run dev' })
    expect(TERMINAL_HISTORY.every(l => l.type === 'input' || l.type === 'output')).toBe(true)
  })

  it('MOCK_PROJECTS 五条记录且 status 枚举合法；INITIAL_VFS 含根文件与嵌套目录', () => {
    expect(MOCK_PROJECTS).toHaveLength(5)
    for (const p of MOCK_PROJECTS) {
      expect(['active', 'idle']).toContain(p.status)
    }
    expect(INITIAL_VFS['package.json'].type).toBe('file')
    expect(INITIAL_VFS.src.type).toBe('dir')
    expect(INITIAL_VFS.src.children?.app.children?.components.type).toBe('dir')
  })
})

describe('vfsResolve 路径解析', () => {
  const vfs = JSON.parse(JSON.stringify(INITIAL_VFS)) as typeof INITIAL_VFS

  it('深路径命中文件节点', () => {
    const node = vfsResolve(vfs, 'src/app/components/IDEMode.tsx')
    expect(node?.type).toBe('file')
    expect(node?.content).toBe('// IDE Mode component')
  })

  it('目录路径命中 dir 节点；前导斜杠被过滤', () => {
    const node = vfsResolve(vfs, '/src/app/store')
    expect(node?.type).toBe('dir')
    expect(node?.children?.['ide-store.ts']).toBeTruthy()
  })

  it('不存在路径返回 null；文件节点下继续下钻也返回 null', () => {
    expect(vfsResolve(vfs, 'src/不存在.ts')).toBeNull()
    expect(vfsResolve(vfs, 'package.json/子路径')).toBeNull()
  })

  it('空路径返回根目录包装节点', () => {
    const node = vfsResolve(vfs, '')
    expect(node?.type).toBe('dir')
    expect(node?.children?.['README.md']).toBeTruthy()
  })
})

describe('vfsResolveParts 父节点解析', () => {
  const vfs = JSON.parse(JSON.stringify(INITIAL_VFS)) as typeof INITIAL_VFS

  it('返回父 dir 与末段文件名', () => {
    const { parent, name } = vfsResolveParts(vfs, 'src/app/App.tsx')
    expect(name).toBe('App.tsx')
    expect(parent?.type).toBe('dir')
    expect(parent?.children?.['App.tsx']).toBeTruthy()
  })

  it('空路径返回根包装与空名', () => {
    const { parent, name } = vfsResolveParts(vfs, '')
    expect(name).toBe('')
    expect(parent?.type).toBe('dir')
    expect(Object.keys(parent?.children ?? {})).toContain('package.json')
  })

  it('中途断链返回 parent=null 但仍带出末段名', () => {
    const { parent, name } = vfsResolveParts(vfs, 'src/缺失目录/文件.ts')
    expect(parent).toBeNull()
    expect(name).toBe('文件.ts')
  })
})

describe('vfsListDir 与 vfsTreeLines', () => {
  const vfs = JSON.parse(JSON.stringify(INITIAL_VFS)) as typeof INITIAL_VFS

  it('vfsListDir：目录加斜杠、文件原样；非目录返回空数组', () => {
    const appNode = vfsResolve(vfs, 'src/app')!
    const entries = vfsListDir(appNode)
    expect(entries).toContain('components/')
    expect(entries).toContain('App.tsx')
    const fileNode = vfsResolve(vfs, 'package.json')!
    expect(vfsListDir(fileNode)).toEqual([])
  })

  it('vfsTreeLines：末项用 └── 连接符，非末项用 ├──', () => {
    const rootChildren = { a: { type: 'file' as const, content: '' }, b: { type: 'dir' as const, children: { c: { type: 'file' as const, content: '' } } } }
    const lines = vfsTreeLines(rootChildren, '', [])
    expect(lines[0]).toContain('├── a')
    expect(lines[1]).toContain('└── b/') // 末项目录用 └──
    expect(lines[2]).toContain('    └── c')
    expect(lines[lines.length - 1]).toContain('└── c')
  })

  it('vfsTreeLines：真实 VFS 根目录树渲染包含 README.md 与嵌套组件目录', () => {
    const root = { type: 'dir' as const, children: vfs }
    const lines = vfsTreeLines(root.children, '', [])
    const joined = lines.join('\n')
    expect(joined).toContain('src/')
    expect(joined).toContain('README.md')
    expect(joined).toContain('components/')
    // 末项 README.md 用 └──，其余 ├──
    expect(joined).toContain('├── vite.config.ts')
    expect(joined).toContain('└── README.md')
  })
})
