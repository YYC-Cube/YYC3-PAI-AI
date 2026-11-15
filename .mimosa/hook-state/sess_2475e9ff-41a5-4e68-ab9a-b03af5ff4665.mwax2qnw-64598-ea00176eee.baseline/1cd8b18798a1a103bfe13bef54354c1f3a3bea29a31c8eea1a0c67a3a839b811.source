/**
 * @file main.tsx
 * @description main组件/模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags main,entry,react
 */

import { enableMapSet } from 'immer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/index.css'
import { createLogger } from './app/utils/logger'

const logger = createLogger('main')

// 清除旧的 PWA Service Worker（YYC³ Music 项目残留）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      reg.unregister()
    }
  })
}

enableMapSet()

const rootElement = document.getElementById('root')

function showBootError(message: string) {
  const splash = document.getElementById('yyc3-splash')
  if (splash) {
    splash.innerHTML = `
      <div style="text-align:center;padding:24px;">
        <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
        <div style="font-size:16px;color:#ff0044;margin-bottom:8px;">启动失败</div>
        <div class="splash-error">${message}</div>
      </div>
    `
  }
}

if (!rootElement) {
  showBootError('找不到 #root 挂载点，请检查 index.html 是否完整。')
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  } catch (error) {
    showBootError(error instanceof Error ? error.message : String(error))
    logger.error('React 启动失败:', error)
  }
}
