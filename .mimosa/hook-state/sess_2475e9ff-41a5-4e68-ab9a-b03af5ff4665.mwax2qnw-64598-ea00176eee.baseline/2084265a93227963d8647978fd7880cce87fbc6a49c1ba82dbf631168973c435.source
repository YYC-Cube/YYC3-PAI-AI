/**
 * @file PerformanceMonitor.tsx
 * @description React Profiler组件，用于追踪子组件性能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,performance,profiling,react-profiler
 */

import { Profiler, ProfilerProps } from 'react'
import { usePerformanceStore } from '../store/performance-store'
import { createLogger } from '../utils/logger'

const logger = createLogger('performance-monitor')

/**
 * 性能监控组件属性
 */
export interface PerformanceMonitorProps extends Omit<ProfilerProps, 'onRender' | 'id'> {
  /** 监控的组件名称 */
  name: string
  /** 是否启用 */
  enabled?: boolean
  /** 慢组件阈值 (ms) */
  slowComponentThreshold?: number
}

/**
 * React Profiler回调参数 (保留用于文档参考)
 */
// interface ProfilerCallbackArgs {
//   id: string
//   phase: 'mount' | 'update'
//   actualDuration: number
//   baseDuration: number
//   startTime: number
//   commitTime: number
// }

/**
 * 性能监控组件
 *
 * 使用React Profiler API追踪组件渲染性能，自动记录慢组件并生成优化建议。
 *
 * @example
 * ```tsx
 * <PerformanceMonitor name="MyExpensiveComponent" enabled={true}>
 *   <MyExpensiveComponent />
 * </PerformanceMonitor>
 * ```
 *
 * @example 带阈值设置
 * ```tsx
 * <PerformanceMonitor
 *   name="MyList"
 *   enabled={true}
 *   slowComponentThreshold={16}
 * >
 *   <MyList items={items} />
 * </PerformanceMonitor>
 * ```
 */
export function PerformanceMonitor({
  name,
  enabled = true,
  slowComponentThreshold = 16,
  children,
  ...props
}: PerformanceMonitorProps) {
  const recordComponentRender = usePerformanceStore((state) => state.recordComponentRender)

  const handleRender = (
    _id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    if (!enabled) return

    // 记录组件渲染性能
    recordComponentRender(name, actualDuration)

    // 在开发环境下输出性能数据
    if (import.meta.env.DEV) {
      const isSlow = actualDuration > slowComponentThreshold

      if (isSlow) {
        logger.warn(
          `[Performance Monitor] Slow component detected: ${name}`,
          {
            phase,
            actualDuration: `${actualDuration.toFixed(2)}ms`,
            baseDuration: `${baseDuration.toFixed(2)}ms`,
            overhead: `${(actualDuration - baseDuration).toFixed(2)}ms`,
            startTime: `${startTime.toFixed(2)}ms`,
            commitTime: `${commitTime.toFixed(2)}ms`,
          }
        )
      } else {
        logger.debug(
          `[Performance Monitor] ${name} rendered in ${actualDuration.toFixed(2)}ms (${phase})`
        )
      }
    }
  }

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <Profiler id={name} onRender={handleRender} {...props}>
      {children}
    </Profiler>
  )
}

/**
 * 性能监控高阶组件
 *
 * 用于包装组件以自动追踪其性能。
 *
 * @example
 * ```tsx
 * const MyComponent = withPerformanceTracking(MyBaseComponent, 'MyComponent')
 * ```
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  options: { enabled?: boolean; slowThreshold?: number } = {}
) {
  const { enabled = true, slowThreshold = 16 } = options

  return function PerformanceTrackingWrapper(props: P) {
    return (
      <PerformanceMonitor
        name={componentName}
        enabled={enabled}
        slowComponentThreshold={slowThreshold}
      >
        <Component {...props} />
      </PerformanceMonitor>
    )
  }
}

/**
 * 性能监控高阶组件工厂
 *
 * 用于创建带性能追踪的组件。
 */
export function createPerformanceMonitoredComponent<P extends object>(
  Component: React.ComponentType<P>,
  defaultName?: string
) {
  return function MonitoredComponent(props: P & { __name?: string; __enabled?: boolean }) {
    const name = props.__name || defaultName || Component.name || 'AnonymousComponent'
    const enabled = props.__enabled ?? true

    return (
      <PerformanceMonitor name={name} enabled={enabled}>
        <Component {...(props as P)} />
      </PerformanceMonitor>
    )
  }
}
