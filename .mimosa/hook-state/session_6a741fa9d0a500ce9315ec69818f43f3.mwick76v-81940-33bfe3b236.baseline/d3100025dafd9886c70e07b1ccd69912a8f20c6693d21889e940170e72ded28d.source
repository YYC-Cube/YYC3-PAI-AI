/**
 * @file monaco-setup.ts
 * @description Monaco 本地化装配 —— 终结 @monaco-editor/react 默认 CDN(jsdelivr) 加载
 *
 * 做两件事（消费方在动态加载编辑器前 await 本模块）：
 * 1. MonacoEnvironment.getWorker：vite ?worker 导入四类语言 worker（本地打包）；
 * 2. loader.config({ monaco })：注入本地 monaco-editor 实例，禁用 CDN 拉取。
 *
 * 注：本模块仅在 CyberEditor 等动态路径中加载，monaco 本体与 worker
 * 均进独立异步 chunk，不影响首屏。
 */

import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    switch (label) {
      case 'json': return new jsonWorker()
      case 'css': case 'scss': case 'less': return new cssWorker()
      case 'html': case 'handlebars': case 'razor': return new htmlWorker()
      case 'typescript': case 'javascript': return new tsWorker()
      default: return new editorWorker()
    }
  },
}

loader.config({ monaco })

export { monaco }
