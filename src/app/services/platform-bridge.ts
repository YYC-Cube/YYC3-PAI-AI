/**
 * @file platform-bridge.ts
 * @description P3.4 Platform 协同桥接层 — Platform Python Agent 的 MCP 工具暴露给前端 AI
 *
 * 架构：
 *   Platform (Python) → MCP Server (Streamable HTTP) → 前端 mcp-client → AI systemPrompt
 *
 * 前端通过 MCP 协议调用 Platform 的 Python Agent 工具（无需直接 HTTP API）。
 * Platform 部署 MCP 端点后，前端一行配置即可接入全部 Agent 能力。
 *
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-10-30
 * @status active
 * @tags platform,bridge,mcp,agent,collaboration,phase-3
 */

import { createMCPClient, type MCPClient, type MCPToolDef } from './mcp-client'
import { createLogger } from '../utils/logger'

const logger = createLogger('platform-bridge')

// ===== Types =====

export interface PlatformMCPConfig {
  /** Platform MCP 端点 */
  endpoint: string
  /** Bearer token（认证后获取） */
  token?: string
  /** 自动重连 */
  autoReconnect?: boolean
}

export interface PlatformTool extends MCPToolDef {
  /** Platform 特有：工具分类 */
  category?: string
  /** 是否需要确认 */
  requiresConfirmation?: boolean
}

export interface PlatformStatus {
  connected: boolean
  toolCount: number
  categories: string[]
  lastConnected?: number
  error?: string
}

// ===== 桥接管理 =====

class PlatformBridge {
  private client: MCPClient | null = null
  private tools: PlatformTool[] = []
  private status: PlatformStatus = { connected: false, toolCount: 0, categories: [] }

  /**
   * 连接到 Platform MCP 端点
   */
  async connect(config: PlatformMCPConfig): Promise<PlatformStatus> {
    this.disconnect() // 清理旧连接

    try {
      this.client = createMCPClient(config.endpoint, config.token)
      await this.client.connect()

      // 获取工具列表
      const tools = await this.client.listTools()
      this.tools = tools.map(t => ({
        ...t,
        category: this.categorizeTool(t.name),
        requiresConfirmation: this.needsConfirmation(t.name),
      }))

      const categories = [...new Set(this.tools.map(t => t.category).filter(Boolean))] as string[]

      this.status = {
        connected: true,
        toolCount: this.tools.length,
        categories,
        lastConnected: Date.now(),
      }

      logger.info(`Platform bridge connected: ${this.tools.length} tools across ${categories.length} categories`)
      return this.status
    } catch (e) {
      this.status = {
        connected: false,
        toolCount: 0,
        categories: [],
        error: e instanceof Error ? e.message : String(e),
      }
      logger.warn('Platform bridge connection failed', e as Error)
      return this.status
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.client = null
    this.tools = []
    this.status = { connected: false, toolCount: 0, categories: [] }
  }

  /**
   * 获取连接状态
   */
  getStatus(): PlatformStatus {
    return { ...this.status }
  }

  /**
   * 获取所有 Platform 工具
   */
  getTools(): PlatformTool[] {
    return [...this.tools]
  }

  /**
   * 按分类获取工具
   */
  getToolsByCategory(category: string): PlatformTool[] {
    return this.tools.filter(t => t.category === category)
  }

  /**
   * 调用 Platform 工具
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    if (!this.client) throw new Error('Platform bridge not connected')
    if (!this.tools.some(t => t.name === name)) {
      throw new Error(`Tool "${name}" not available on Platform`)
    }

    try {
      const result = await this.client.callTool(name, args)
      return result.content
        .map(c => ('text' in c ? c.text : JSON.stringify(c)))
        .join('\n')
    } catch (e) {
      logger.warn(`Platform tool "${name}" failed`, e as Error)
      throw e
    }
  }

  /**
   * 生成注入 AI systemPrompt 的 Platform 工具清单
   */
  async buildSystemPrompt(): Promise<string> {
    if (!this.status.connected || !this.tools.length) return ''

    const byCategory = new Map<string, PlatformTool[]>()
    for (const tool of this.tools) {
      const cat = tool.category || 'general'
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(tool)
    }

    const sections = Array.from(byCategory.entries()).map(([cat, tools]) => {
      const toolLines = tools.map(t => `  - ${t.name}: ${t.description || 'No description'}`).join('\n')
      return `## ${cat}\n${toolLines}`
    })

    return `You have access to Platform Agent tools (Python). To call a tool, respond with:\n{"tool": "<name>", "arguments": {...}}\n\n${sections.join('\n\n')}`
  }

  /**
   * 工具分类（基于名称推断）
   */
  private categorizeTool(name: string): string {
    if (name.includes('file') || name.includes('fs_')) return '文件系统'
    if (name.includes('search') || name.includes('query')) return '搜索'
    if (name.includes('agent') || name.includes('task')) return 'Agent 任务'
    if (name.includes('code') || name.includes('edit')) return '代码编辑'
    if (name.includes('web') || name.includes('fetch')) return '网络'
    if (name.includes('db') || name.includes('database')) return '数据库'
    if (name.includes('knowledge') || name.includes('kb')) return '知识库'
    return '通用'
  }

  /**
   * 判断工具是否需要用户确认
   */
  private needsConfirmation(name: string): boolean {
    // 写操作需要确认
    return name.includes('write') || name.includes('delete') || name.includes('exec') || name.includes('send')
  }
}

// ===== 单例 =====

let bridgeInstance: PlatformBridge | null = null

export function getPlatformBridge(): PlatformBridge {
  if (!bridgeInstance) {
    bridgeInstance = new PlatformBridge()
  }
  return bridgeInstance
}

/**
 * 快速连接 Platform（使用默认配置）
 */
export async function connectPlatform(token?: string): Promise<PlatformStatus> {
  const endpoint = import.meta.env.VITE_PLATFORM_MCP_ENDPOINT || 'https://pai-ai.yyc3.vip/mcp'
  return getPlatformBridge().connect({ endpoint, token })
}

/**
 * 断开 Platform 连接
 */
export function disconnectPlatform(): void {
  getPlatformBridge().disconnect()
}
