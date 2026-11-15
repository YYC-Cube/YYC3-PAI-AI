/**
 * @file websocket-reconnection-manager.ts
 * @description WebSocket智能重连管理器，提供指数退避、心跳检测、自动重连功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'

const logger = createLogger('ws-reconnect')

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting'

export interface ReconnectionConfig {
  /** 是否启用自动重连 */
  enabled?: boolean
  /** 初始重连延迟（毫秒） */
  initialDelay?: number
  /** 最大重连延迟（毫秒） */
  maxDelay?: number
  /** 退避因子（指数增长倍率） */
  backoffFactor?: number
  /** 抖动因子（0-1，用于避免同时重连） */
  jitterFactor?: number
  /** 最大重试次数（0=无限） */
  maxRetries?: number
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number
  /** 心跳超时（毫秒） */
  heartbeatTimeout?: number
}

export interface ConnectionMetrics {
  totalConnections: number
  totalDisconnections: number
  totalReconnections: number
  failedReconnections: number
  averageReconnectionTime: number
  lastConnectionTime: number | null
  lastDisconnectionTime: number | null
  lastError: Error | null
  currentRetryCount: number
  uptimeMs: number
}

export interface ConnectionEvent {
  type: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'reconnect_failed' | 'reconnect_success' | 'heartbeat_missed' | 'error'
  timestamp: number
  data?: unknown
  error?: Error
}

type ConnectionEventListener = (event: ConnectionEvent) => void

const DEFAULT_CONFIG: Required<ReconnectionConfig> = {
  enabled: true,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitterFactor: 0.2,
  maxRetries: 10,
  heartbeatInterval: 30000,
  heartbeatTimeout: 10000,
}

class WebSocketReconnectionManager {
  private config: Required<ReconnectionConfig>

  private status: ConnectionStatus = 'disconnected'
  private retryCount = 0
  private currentDelay = DEFAULT_CONFIG.initialDelay

  private ws: WebSocket | null = null
  private url: string | null = null
  private protocols?: string | string[]

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null

  private listeners: Set<ConnectionEventListener> = new Set()

  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    totalDisconnections: 0,
    totalReconnections: 0,
    failedReconnections: 0,
    averageReconnectionTime: 0,
    lastConnectionTime: null,
    lastDisconnectionTime: null,
    lastError: null,
    currentRetryCount: 0,
    uptimeMs: 0,
  }

  private connectionStartTime: number | null = null
  private uptimeInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: ReconnectionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  connect(url: string, protocols?: string | string[]): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.status === 'connected' || this.status === 'connecting') {
        if (this.ws) {
          resolve(this.ws)
          return
        }
      }

      this.url = url
      this.protocols = protocols
      this.setStatus('connecting')
      this.emit({ type: 'connecting', timestamp: Date.now() })

      try {
        const ws = new WebSocket(url, protocols)

        ws.onopen = () => {
          this.handleOpen(ws)
          resolve(ws)
        }

        ws.onclose = (event) => {
          this.handleClose(event)
        }

        ws.onerror = (_event) => {
          const error = new Error(`WebSocket error`)
          this.handleError(error)
          reject(error)
        }

        this.ws = ws
      } catch (error) {
        this.handleError(error as Error)
        reject(error)
      }
    })
  }

  disconnect(code?: number, reason?: string): void {
    this.clearTimers()
    this.setStatus('disconnecting')

    if (this.ws) {
      try {
        this.ws.close(code || 1000, reason || 'Normal closure')
      } catch (e) {
        logger.warn('Error closing WebSocket', e as Error)
      }
      this.ws = null
    }

    this.setStatus('disconnected')
    this.metrics.totalDisconnections++
    this.metrics.lastDisconnectionTime = Date.now()
    this.emit({
      type: 'disconnected',
      timestamp: Date.now(),
      data: { code, reason },
    })

    this.stopUptimeTracking()
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics }
  }

  getConfig(): Required<ReconnectionConfig> {
    return { ...this.config }
  }

  updateConfig(updates: Partial<ReconnectionConfig>): void {
    this.config = { ...this.config, ...updates }
    logger.info('Configuration updated', updates)
  }

  onConnectionEvent(listener: ConnectionEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  forceReconnect(): void {
    logger.info('Force reconnection requested')
    this.disconnect(4000, 'Force reconnect')
    if (this.url) {
      this.scheduleReconnect(0)
    }
  }

  reset(): void {
    this.disconnect()
    this.retryCount = 0
    this.currentDelay = this.config.initialDelay
    this.metrics = {
      totalConnections: 0,
      totalDisconnections: 0,
      totalReconnections: 0,
      failedReconnections: 0,
      averageReconnectionTime: 0,
      lastConnectionTime: null,
      lastDisconnectionTime: null,
      lastError: null,
      currentRetryCount: 0,
      uptimeMs: 0,
    }
    this.listeners.clear()
    logger.info('Reconnection manager reset')
  }

  private handleOpen(ws: WebSocket): void {
    this.ws = ws
    this.setStatus('connected')
    this.retryCount = 0
    this.currentDelay = this.config.initialDelay

    this.metrics.totalConnections++
    this.metrics.lastConnectionTime = Date.now()
    this.metrics.currentRetryCount = 0

    this.emit({ type: 'connected', timestamp: Date.now() })
    logger.info(`WebSocket connected to ${this.url}`)

    this.startHeartbeat()
    this.startUptimeTracking()

    // 设置WebSocket事件处理器（覆盖构造函数中的临时处理器）
    ws.onclose = (event) => this.handleClose(event)
    ws.onerror = (_event) => {
      const error = new Error('WebSocket error after connection')
      this.handleError(error)
    }
  }

  private handleClose(event: CloseEvent): void {
    this.ws = null
    this.stopHeartbeat()
    this.stopUptimeTracking()

    const wasConnected = this.status === 'connected'
    this.setStatus('disconnected')

    this.metrics.totalDisconnections++
    this.metrics.lastDisconnectionTime = Date.now()

    if (wasConnected && event.code !== 1000 && this.config.enabled) {
      logger.info(
        `WebSocket closed unexpectedly (code: ${event.code}), scheduling reconnection...`
      )
      this.scheduleReconnect()
    } else {
      this.emit({
        type: 'disconnected',
        timestamp: Date.now(),
        data: { code: event.code, reason: event.reason },
      })
    }
  }

  private handleError(error: Error): void {
    this.metrics.lastError = error
    this.emit({
      type: 'error',
      timestamp: Date.now(),
      error,
    })
    logger.error('WebSocket error', error)
  }

  private scheduleReconnect(delay?: number): void {
    if (!this.config.enabled) {
      logger.info('Auto-reconnection is disabled')
      return
    }

    if (this.config.maxRetries > 0 && this.retryCount >= this.config.maxRetries) {
      logger.error(
        `Max retries (${this.config.maxRetries}) reached, giving up`
      )
      this.metrics.failedReconnections++
      this.emit({
        type: 'reconnect_failed',
        timestamp: Date.now(),
        data: { retryCount: this.retryCount, maxRetries: this.config.maxRetries },
      })
      return
    }

    const reconnectDelay = delay ?? this.calculateNextDelay()
    this.retryCount++
    this.metrics.currentRetryCount = this.retryCount

    this.setStatus('reconnecting')
    this.emit({
      type: 'reconnecting',
      timestamp: Date.now(),
      data: {
        attempt: this.retryCount,
        delay: reconnectDelay,
        maxRetries: this.config.maxRetries,
      },
    })

    logger.info(
      `Scheduling reconnect #${this.retryCount} in ${reconnectDelay}ms`
    )

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnect(reconnectDelay)
    }, reconnectDelay)
  }

  private async attemptReconnect(_scheduledDelay: number): Promise<void> {
    const startTime = performance.now()

    try {
      if (!this.url) {
        throw new Error('No URL configured for reconnection')
      }

      await this.connect(this.url, this.protocols)

      const duration = performance.now() - startTime
      this.metrics.totalReconnections++

      // 更新平均重连时间
      const totalReconnectTime =
        this.metrics.averageReconnectionTime *
        (this.metrics.totalReconnections - 1) +
        duration
      this.metrics.averageReconnectionTime =
        totalReconnectTime / this.metrics.totalReconnections

      this.emit({
        type: 'reconnect_success',
        timestamp: Date.now(),
        data: {
          attempt: this.retryCount,
          duration: Math.round(duration),
        },
      })

      logger.info(
        `Successfully reconnected after ${Math.round(duration)}ms (attempt #${this.retryCount})`
      )
    } catch (error) {
      const duration = performance.now() - startTime
      this.metrics.failedReconnections++
      this.metrics.lastError = error as Error

      logger.error(
        `Reconnection attempt #${this.retryCount} failed after ${Math.round(duration)}ms`,
        error as Error
      )

      this.emit({
        type: 'reconnect_failed',
        timestamp: Date.now(),
        error: error as Error,
        data: { attempt: this.retryCount, duration: Math.round(duration) },
      })

      this.scheduleReconnect()
    }
  }

  private calculateNextDelay(): number {
    let delay = this.currentDelay * this.config.backoffFactor
    delay = Math.min(delay, this.config.maxDelay)

    // 添加抖动以避免多个客户端同时重连
    if (this.config.jitterFactor > 0) {
      const jitter = delay * this.config.jitterFactor * (Math.random() * 2 - 1)
      delay += jitter
    }

    this.currentDelay = delay
    return Math.round(delay)
  }

  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval || !this.ws) return

    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, this.config.heartbeatInterval)
  }

  private sendHeartbeat(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    try {
      this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))

      // 设置心跳超时检测
      this.heartbeatTimeoutTimer = setTimeout(() => {
        logger.warn('Heartbeat timeout detected')
        this.emit({
          type: 'heartbeat_missed',
          timestamp: Date.now(),
        })

        // 认为连接已断开，触发重连
        if (this.ws) {
          this.ws.close(4001, 'Heartbeat timeout')
        }
      }, this.config.heartbeatTimeout)
    } catch (error) {
      logger.error('Failed to send heartbeat', error as Error)
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }
  }

  private startUptimeTracking(): void {
    this.connectionStartTime = Date.now()
    this.uptimeInterval = setInterval(() => {
      if (this.connectionStartTime) {
        this.metrics.uptimeMs = Date.now() - this.connectionStartTime
      }
    }, 1000)
  }

  private stopUptimeTracking(): void {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval)
      this.uptimeInterval = null
    }
    this.connectionStartTime = null
  }

  private setStatus(status: ConnectionStatus): void {
    const oldStatus = this.status
    this.status = status
    if (oldStatus !== status) {
      logger.debug(`Status changed: ${oldStatus} -> ${status}`)
    }
  }

  private emit(event: ConnectionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        logger.error('Error in connection event listener', error as Error)
      }
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopHeartbeat()
    this.stopUptimeTracking()
  }
}

let instance: WebSocketReconnectionManager | null = null

export function getWebSocketReconnectionManager(config?: ReconnectionConfig): WebSocketReconnectionManager {
  if (!instance) {
    instance = new WebSocketReconnectionManager(config)
  } else if (config) {
    instance.updateConfig(config)
  }
  return instance
}

export function destroyWebSocketReconnectionManager(): void {
  if (instance) {
    instance.reset()
    instance = null
  }
}

export default WebSocketReconnectionManager
