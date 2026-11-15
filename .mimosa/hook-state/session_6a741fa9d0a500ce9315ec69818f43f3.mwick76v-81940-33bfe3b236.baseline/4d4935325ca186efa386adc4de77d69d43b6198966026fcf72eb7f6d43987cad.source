/**
 * @file crdt-websocket-bridge.ts
 * @description CRDT协作WebSocket桥接层 - 集成WebSocket重连管理器到CRDT Store
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-08
 * @status stable
 * @license MIT
 */

import { createLogger } from '../utils/logger'
import {
  getWebSocketReconnectionManager,
  type ConnectionStatus,
  type ConnectionEvent,
} from './websocket-reconnection-manager'

const logger = createLogger('crdt-ws-bridge')

export interface CRDTWebSocketConfig {
  serverUrl: string
  roomId: string
  reconnect?: boolean
  maxRetries?: number
  heartbeatInterval?: number
}

export interface CRDTConnectionState {
  status: ConnectionStatus
  retryCount: number
  lastError?: string
  connectedAt?: number | null
  uptimeMs: number
}

export type CRDTConnectionCallback = (state: CRDTConnectionState) => void

class CRDTWebSocketBridge {
  private wsManager = getWebSocketReconnectionManager()
  private connectionCallbacks: Set<CRDTConnectionCallback> = new Set()
  private currentState: CRDTConnectionState = {
    status: 'disconnected',
    retryCount: 0,
    uptimeMs: 0,
  }

  constructor() {
    this.setupEventListeners()
  }

  async connect(config: CRDTWebSocketConfig): Promise<void> {
    logger.info(`Connecting to CRDT WebSocket: ${config.serverUrl}/${config.roomId}`)

    this.wsManager.updateConfig({
      maxRetries: config.maxRetries ?? 10,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitterFactor: 0.1,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatTimeout: 10000,
    })

    try {
      await this.wsManager.connect(config.serverUrl)
      logger.info('CRDT WebSocket connected successfully')
    } catch (error) {
      logger.error('Failed to connect CRDT WebSocket', error as Error)
      throw error
    }
  }

  disconnect(): void {
    logger.info('Disconnecting CRDT WebSocket')
    this.wsManager.disconnect()
  }

  send(data: unknown): boolean {
    const ws = (this.wsManager as unknown as { ws: WebSocket | null }).ws
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false
    }
    try {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data))
      return true
    } catch (error) {
      logger.error('Failed to send message via CRDT WebSocket', error as Error)
      return false
    }
  }

  onMessage(callback: (data: unknown) => void): () => void {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string)
        callback(data)
      } catch {
        callback(event.data)
      }
    }
    const ws = (this.wsManager as unknown as { ws: WebSocket | null }).ws
    if (ws) {
      ws.addEventListener('message', handler as EventListener)
    }
    return () => {
      if (ws) {
        ws.removeEventListener('message', handler as EventListener)
      }
    }
  }

  onStateChange(callback: CRDTConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)

    callback(this.currentState)

    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }

  getState(): CRDTConnectionState {
    return { ...this.currentState }
  }

  getStatus(): ConnectionStatus {
    return this.wsManager.getStatus()
  }

  getMetrics() {
    return this.wsManager.getMetrics()
  }

  isHealthy(): boolean {
    return this.wsManager.getStatus() === 'connected'
  }

  forceReconnect(): Promise<void> {
    logger.info('Forcing CRDT WebSocket reconnection')
    this.wsManager.forceReconnect()
    return Promise.resolve()
  }

  private setupEventListeners(): void {
    this.wsManager.onConnectionEvent((event: ConnectionEvent) => {
      const metrics = this.wsManager.getMetrics()

      switch (event.type) {
        case 'connected':
          this.currentState = {
            status: 'connected',
            retryCount: 0,
            connectedAt: metrics.lastConnectionTime ?? Date.now(),
            uptimeMs: metrics.uptimeMs,
          }
          break
        case 'disconnected':
          this.currentState = {
            status: 'disconnected',
            retryCount: metrics.currentRetryCount,
            lastError: metrics.lastError?.message ?? undefined,
            connectedAt: null,
            uptimeMs: metrics.uptimeMs,
          }
          break
        case 'connecting':
          this.currentState = {
            ...this.currentState,
            status: 'connecting',
          }
          break
        case 'reconnecting':
          this.currentState = {
            ...this.currentState,
            status: 'reconnecting',
            retryCount: metrics.currentRetryCount,
          }
          break
        case 'error':
          this.currentState = {
            ...this.currentState,
            status: 'disconnected',
            lastError: metrics.lastError?.message ?? undefined,
          }
          break
        default:
          break
      }

      this.notifyStateChange()
    })
  }

  private notifyStateChange(): void {
    const state = { ...this.currentState }
    for (const callback of this.connectionCallbacks) {
      try {
        callback(state)
      } catch (error) {
        logger.error('Error in state change callback', error as Error)
      }
    }
  }
}

let bridgeInstance: CRDTWebSocketBridge | null = null

export function getCRDTWebSocketBridge(): CRDTWebSocketBridge {
  if (!bridgeInstance) {
    bridgeInstance = new CRDTWebSocketBridge()
  }
  return bridgeInstance
}

export function destroyCRDTWebSocketBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.disconnect()
    bridgeInstance = null
  }
}

export default CRDTWebSocketBridge
