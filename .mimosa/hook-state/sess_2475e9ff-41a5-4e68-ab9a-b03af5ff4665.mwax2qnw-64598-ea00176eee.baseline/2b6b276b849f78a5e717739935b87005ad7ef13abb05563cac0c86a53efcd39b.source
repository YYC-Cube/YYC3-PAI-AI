/**
 * @file useStreamText.ts
 * @description 功能2：AI 流式打字机输出 — 分片逐字渲染、打字动画、不阻塞界面
 * 可快速结束动画直接全量填充
 */

import { useState, useRef, useCallback } from 'react'

export function useStreamText() {
  const [renderText, setRenderText] = useState('')
  const finishRef = useRef(false)

  /** 开始流式填入 */
  const startStream = useCallback(async (fullStr: string, speed = 12) => {
    finishRef.current = false
    setRenderText('')
    let cur = ''
    for (let i = 0; i < fullStr.length; i++) {
      if (finishRef.current) break
      cur += fullStr[i]
      setRenderText(cur)
      await new Promise(r => setTimeout(r, speed))
    }
  }, [])

  /** 立刻结束流式，全量填充 */
  const fastFinish = useCallback((fullStr: string) => {
    finishRef.current = true
    setRenderText(fullStr)
  }, [])

  return { renderText, startStream, fastFinish }
}