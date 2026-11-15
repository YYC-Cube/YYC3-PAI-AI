/**
 * @file useChatSession.ts
 * @description 功能3：多会话管理 — 新建/切换/删除/自动标题，localStorage 持久化
 */

import { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { ChatMessage, ChatSession } from '../../types/chat'

const SESSION_STORE_KEY = 'yyc3-chat-sessions'

export function useChatSession() {
  const [sessionList, setSessionList] = useState<ChatSession[]>([])
  const [currentSid, setCurrentSid] = useState('')
  const [initialized, setInitialized] = useState(false)

  // 初始化：读取 localStorage（坏数据防御：损坏存储丢弃重建，不崩溃）
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_STORE_KEY)
    let arr: ChatSession[] = []
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) arr = parsed as ChatSession[]
    } catch {
      localStorage.removeItem(SESSION_STORE_KEY)
    }
    setSessionList(arr)
    if (arr.length > 0) {
      setCurrentSid(arr[0].sid)
    } else {
      createNewSession()
    }
    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 持久化保存
  const saveToLocal = useCallback((list: ChatSession[]) => {
    localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(list))
  }, [])

  // 新建会话
  const createNewSession = useCallback(() => {
    const now = Date.now()
    const month = new Date().getMonth() + 1
    const day = new Date().getDate()
    const sid = uuidv4()
    const newItem: ChatSession = {
      sid,
      title: `会话 ${month}-${day}`,
      createAt: now,
      updateAt: now,
      list: [],
    }
    const next = [...sessionList, newItem]
    saveToLocal(next)
    setSessionList(next)
    setCurrentSid(sid)
    return sid
  }, [sessionList, saveToLocal])

  // 删除会话
  const delSession = useCallback((sid: string) => {
    let next = sessionList.filter(s => s.sid !== sid)
    if (currentSid === sid) {
      if (next.length > 0) {
        setCurrentSid(next[0].sid)
      } else {
        // 全部删除后自动新建
        const now = Date.now()
        const month = new Date().getMonth() + 1
        const day = new Date().getDate()
        const nsid = uuidv4()
        const newItem: ChatSession = {
          sid: nsid,
          title: `会话 ${month}-${day}`,
          createAt: now,
          updateAt: now,
          list: [],
        }
        next = [newItem]
        setCurrentSid(nsid)
      }
    }
    saveToLocal(next)
    setSessionList(next)
  }, [sessionList, currentSid, saveToLocal])

  // 更新当前会话消息
  const updateCurrentMsg = useCallback((newMsgList: ChatMessage[]) => {
    const next = sessionList.map(s => {
      if (s.sid === currentSid) {
        const firstUser = newMsgList.find(m => m.role === 'user')
        return {
          ...s,
          list: newMsgList,
          updateAt: Date.now(),
          title: firstUser ? firstUser.content.slice(0, 22) : s.title,
        }
      }
      return s
    })
    saveToLocal(next)
    setSessionList(next)
  }, [sessionList, currentSid, saveToLocal])

  // 获取当前会话消息
  const getCurrentMsg = useCallback((): ChatMessage[] => {
    const cur = sessionList.find(s => s.sid === currentSid)
    return cur?.list || []
  }, [sessionList, currentSid])

  // 切换会话
  const switchSession = useCallback((sid: string) => {
    setCurrentSid(sid)
  }, [])

  return {
    sessionList,
    currentSid,
    initialized,
    createNewSession,
    delSession,
    switchSession,
    updateCurrentMsg,
    getCurrentMsg,
  }
}
