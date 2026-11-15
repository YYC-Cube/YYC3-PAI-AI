/**
 * @file ai.ts
 * @description YYC³ AI Type Definitions - AI相关类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,types,typescript,llm
 */

/**
 * @description AI模型提供商
 */
export type AIModelProvider = 'openai' | 'ollama' | 'custom' | 'anthropic' | 'google' | 'cohere'

/**
 * @description 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system'

/**
 * @description 消息内容类型
 */
export type MessageContentType = 'text' | 'image_url' | 'audio_url' | 'video_url'

/**
 * @description 消息内容
 */
export interface MessageContent {
  /** 内容类型 */
  type: MessageContentType
  /** 文本内容 */
  text?: string
  /** 图像URL */
  image_url?: { url: string }
  /** 音频URL */
  audio_url?: { url: string }
  /** 视频URL */
  video_url?: { url: string }
}

/**
 * @description AI消息
 */
export interface AIMessage {
  /** 角色 */
  role: MessageRole
  /** 内容 */
  content: string | MessageContent[]
  /** 名称（可选） */
  name?: string
  /** 时间戳 */
  timestamp?: number
  /** Token使用量 */
  tokens?: number
}

/**
 * @completion 完成选项
 */
export interface CompletionOptions {
  /** 温度（0-2） */
  temperature?: number
  /** 最大Token数 */
  maxTokens?: number
  /** Top-P采样（0-1） */
  topP?: number
  /** Top-K采样 */
  topK?: number
  /** 是否流式返回 */
  stream?: boolean
  /** 停止序列 */
  stopSequences?: string[]
  /** 频率惩罚（-2.0到2.0） */
  frequencyPenalty?: number
  /** 存在惩罚（-2.0到2.0） */
  presencePenalty?: number
  /** 是否记录概率 */
  logProbs?: boolean
  /** 记录前N个概率 */
  topLogProbs?: number
}

/**
 * @description 完成响应
 */
export interface Completion {
  /** ID */
  id: string
  /** 对象类型 */
  object: string
  /** 创建时间 */
  created: number
  /** 模型名称 */
  model: string
  /** 选择列表 */
  choices: CompletionChoice[]
  /** Token使用情况 */
  usage: CompletionUsage
}

/**
 * @description 完成选项
 */
export interface CompletionChoice {
  /** 索引 */
  index: number
  /** 消息 */
  message: AIMessage
  /** 完成原因 */
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls'
}

/**
 * @description Token使用情况
 */
export interface CompletionUsage {
  /** 提示Token数 */
  promptTokens: number
  /** 完成Token数 */
  completionTokens: number
  /** 总Token数 */
  totalTokens: number
}

/**
 * @description 流式完成块
 */
export interface CompletionChunk {
  /** ID */
  id: string
  /** 对象类型 */
  object: string
  /** 创建时间 */
  created: number
  /** 模型名称 */
  model: string
  /** 选择列表 */
  choices: CompletionChoiceChunk[]
}

/**
 * @description 流式完成选项
 */
export interface CompletionChoiceChunk {
  /** 索引 */
  index: number
  /** Delta消息 */
  delta: {
    /** 角色 */
    role?: MessageRole
    /** 内容 */
    content?: string
  }
  /** 完成原因 */
  finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null
}

/**
 * @description AI模型配置
 */
export interface AIModelConfig {
  /** 模型ID */
  id: string
  /** 模型名称 */
  name: string
  /** 提供商 */
  provider: AIModelProvider
  /** API端点 */
  endpoint: string
  /** API密钥 */
  apiKey: string
  /** 是否激活 */
  isActive: boolean
  /** 是否自动检测 */
  isDetected?: boolean
  /** 创建时间 */
  createdAt?: number
  /** 更新时间 */
  updatedAt?: number
  /** 模型描述 */
  description?: string
  /** 最大Token数 */
  maxTokens?: number
  /** 支持的功能 */
  capabilities?: ModelCapabilities
}

/**
 * @description 模型能力
 */
export interface ModelCapabilities {
  /** 是否支持流式响应 */
  streaming: boolean
  /** 是否支持函数调用 */
  functionCalling: boolean
  /** 是否支持视觉输入 */
  vision: boolean
  /** 是否支持音频输入 */
  audio: boolean
  /** 支持的最大上下文长度 */
  maxContextLength: number
}

/**
 * @description 连接状态
 */
export type ConnectivityStatus = 'unknown' | 'checking' | 'online' | 'offline'

/**
 * @description 模型连接信息
 */
export interface ModelConnectivity {
  /** 模型ID */
  modelId: string
  /** 状态 */
  status: ConnectivityStatus
  /** 延迟（毫秒） */
  latencyMs?: number
  /** 最后检查时间 */
  lastChecked?: number
  /** 错误信息 */
  error?: string
}

/**
 * @description 模型测试结果
 */
export interface ModelTestResult {
  /** 是否成功 */
  success: boolean
  /** 响应内容 */
  response?: string
  /** 延迟（毫秒） */
  latencyMs: number
  /** 模型名称 */
  model: string
  /** 错误信息 */
  error?: string
}

/**
 * @description 函数定义
 */
export interface FunctionDefinition {
  /** 函数名 */
  name: string
  /** 函数描述 */
  description: string
  /** 参数Schema（JSON Schema） */
  parameters: Record<string, unknown>
}

/**
 * @description 函数调用
 */
export interface FunctionCall {
  /** 函数名 */
  name: string
  /** 参数 */
  arguments: string
}

/**
 * @description 工具调用
 */
export interface ToolCall extends FunctionCall {
  /** 类型 */
  type: 'function'
  /** 工具ID */
  id: string
}

/**
 * @description 代码生成选项
 */
export interface CodeGenOptions {
  /** 代码语言 */
  language?: string
  /** 框架 */
  framework?: string
  /** 样式方案 */
  styling?: string
  /** 关注点 */
  focus?: 'functionality' | 'ui' | 'performance'
  /** 是否包含注释 */
  includeComments?: boolean
  /** 是否包含测试 */
  includeTests?: boolean
}

/**
 * @description 生成的代码
 */
export interface GeneratedCode {
  /** 代码内容 */
  code: string
  /** 语言 */
  language: string
  /** 说明 */
  explanation?: string
  /** 组件列表 */
  components?: string[]
  /** 依赖项 */
  dependencies?: string[]
}

/**
 * @description 代码审查选项
 */
export interface CodeReviewOptions {
  /** 是否检查风格 */
  checkStyle?: boolean
  /** 是否检查安全性 */
  checkSecurity?: boolean
  /** 是否检查性能 */
  checkPerformance?: boolean
  /** 是否检查最佳实践 */
  checkBestPractices?: boolean
  /** 严重级别 */
  severity?: 'low' | 'medium' | 'high' | 'all'
}

/**
 * @description 代码审查结果
 */
export interface CodeReviewResult {
  /** 审查摘要 */
  summary: ReviewSummary
  /** 问题列表 */
  issues: ReviewIssue[]
  /** 建议列表 */
  suggestions: ReviewSuggestion[]
  /** 指标 */
  metrics: CodeMetrics
}

/**
 * @description 审查摘要
 */
export interface ReviewSummary {
  /** 总问题数 */
  totalIssues: number
  /** 按严重度分类 */
  bySeverity: Record<string, number>
  /** 按类型分类 */
  byType: Record<string, number>
  /** 评分（0-100） */
  score: number
}

/**
 * @description 审查问题
 */
export interface ReviewIssue {
  /** ID */
  id: string
  /** 类型 */
  type: 'style' | 'security' | 'performance' | 'best-practice'
  /** 严重度 */
  severity: 'low' | 'medium' | 'high'
  /** 消息 */
  message: string
  /** 位置 */
  location: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  }
  /** 代码片段 */
  code: string
  /** 修复建议 */
  fix?: string
}

/**
 * @description 审查建议
 */
export interface ReviewSuggestion {
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 优先级 */
  priority: 'low' | 'medium' | 'high'
  /** 实现难度 */
  difficulty: 'easy' | 'medium' | 'hard'
  /** 影响范围 */
  impact: 'low' | 'medium' | 'high'
}

/**
 * @description 代码指标
 */
export interface CodeMetrics {
  /** 代码行数 */
  linesOfCode: number
  /** 圈复杂度 */
  cyclomaticComplexity: number
  /** 认知复杂度 */
  cognitiveComplexity: number
  /** 函数数量 */
  functionCount: number
  /** 最大函数长度 */
  maxFunctionLength: number
  /** 代码重复率 */
  duplicationRate: number
  /** 测试覆盖率 */
  testCoverage: number
}

/**
 * @description Prompt模板
 */
export interface PromptTemplate {
  /** 模板ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板内容 */
  template: string
  /** 变量列表 */
  variables: string[]
  /** 分类 */
  category: string
  /** 描述 */
  description?: string
  /** 是否内置 */
  isBuiltIn?: boolean
}

/**
 * @description Prompt变量
 */
export interface PromptVariable {
  /** 变量名 */
  name: string
  /** 变量值 */
  value: string
  /** 是否必需 */
  required: boolean
  /** 默认值 */
  default?: string
}

/**
 * @description 多模态输入
 */
export interface MultimodalInput {
  /** 文本内容 */
  text?: string
  /** 图像数据 */
  image?: ImageData
  /** 音频数据 */
  audio?: AudioData
  /** 视频数据 */
  video?: VideoData
}

/**
 * @description 图像数据
 */
export interface ImageData {
  /** 图像URL或Base64 */
  url: string
  /** 图像格式 */
  format?: 'png' | 'jpeg' | 'gif' | 'webp'
  /** 图像宽度 */
  width?: number
  /** 图像高度 */
  height?: number
}

/**
 * @description 音频数据
 */
export interface AudioData {
  /** 音频URL或Base64 */
  url: string
  /** 音频格式 */
  format?: 'mp3' | 'wav' | 'ogg' | 'flac'
  /** 时长（秒） */
  duration?: number
}

/**
 * @description 视频数据
 */
export interface VideoData {
  /** 视频URL或Base64 */
  url: string
  /** 视频格式 */
  format?: 'mp4' | 'webm' | 'mov' | 'avi'
  /** 时长（秒） */
  duration?: number
}

/**
 * @description 图像转代码配置
 */
export interface ImageToCodeOptions {
  /** 目标框架 */
  framework?: string
  /** 样式方案 */
  styling?: string
  /** 关注点 */
  focus?: 'functionality' | 'ui' | 'responsiveness'
}

/**
 * @description 图像转代码结果
 */
export interface ImageToCodeResult {
  /** 生成的代码 */
  code: string
  /** 语言 */
  language: string
  /** 说明 */
  explanation: string
  /** 组件列表 */
  components: string[]
  /** 置信度（0-1） */
  confidence: number
}

/**
 * @description AI指标
 */
export interface AIMetrics {
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successfulRequests: number
  /** 失败请求数 */
  failedRequests: number
  /** 平均延迟（毫秒） */
  averageLatency: number
  /** 总Token数 */
  totalTokens: number
  /** 平均Token数 */
  averageTokens: number
  /** 错误率 */
  errorRate: number
  /** 成功率 */
  successRate: number
}

/**
 * @description AI使用统计
 */
export interface AIUsage {
  /** 日期 */
  date: string
  /** 请求数 */
  requests: number
  /** Token数 */
  tokens: number
  /** 成本 */
  cost?: number
  /** 时长（秒） */
  duration?: number
}

/**
 * @description 速率限制配置
 */
export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number
  /** 最大请求数 */
  maxRequests: number
  /** 是否限制Token */
  limitTokens?: boolean
  /** 最大Token数 */
  maxTokens?: number
}
