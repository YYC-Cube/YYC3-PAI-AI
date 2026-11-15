/**
 * @file performance-store.test.ts
 * @description 性能监控Store测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { usePerformanceStore } from '../performance-store'

describe('PerformanceStore', () => {
  beforeEach(() => {
    usePerformanceStore.setState({
      webVitals: {},
      componentMetrics: [],
      suggestions: [],
      apiMetrics: new Map(),
      systemMetricsHistory: [],
      isMonitoring: false,
      performanceScore: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = usePerformanceStore.getState()
      
      expect(state.webVitals).toEqual({})
      expect(state.componentMetrics).toEqual([])
      expect(state.suggestions).toEqual([])
      expect(state.apiMetrics.size).toBe(0)
      expect(state.systemMetricsHistory).toEqual([])
      expect(state.isMonitoring).toBe(false)
      expect(state.performanceScore).toBe(0)
    })
  })

  describe('Web Vitals', () => {
    it('应该能够更新CLS指标', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('cls', 0.05)
      })
      
      expect(usePerformanceStore.getState().webVitals.cls).toBe(0.05)
    })

    it('应该能够更新LCP指标', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('lcp', 2500)
      })
      
      expect(usePerformanceStore.getState().webVitals.lcp).toBe(2500)
    })

    it('应该能够更新FID指标', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('fid', 50)
      })
      
      expect(usePerformanceStore.getState().webVitals.fid).toBe(50)
    })

    it('应该能够更新INP指标', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('inp', 100)
      })
      
      expect(usePerformanceStore.getState().webVitals.inp).toBe(100)
    })

    it('应该能够更新FCP指标', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('fcp', 1500)
      })
      
      expect(usePerformanceStore.getState().webVitals.fcp).toBe(1500)
    })

    it('应该能够更新TTFB指标', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('ttfb', 600)
      })
      
      expect(usePerformanceStore.getState().webVitals.ttfb).toBe(600)
    })

    it('应该根据良好的Web Vitals计算高分', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('cls', 0.05)
        usePerformanceStore.getState().updateWebVital('lcp', 2000)
        usePerformanceStore.getState().updateWebVital('fcp', 1500)
        usePerformanceStore.getState().updateWebVital('ttfb', 500)
      })
      
      expect(usePerformanceStore.getState().performanceScore).toBeGreaterThan(90)
    })

    it('应该根据差的Web Vitals计算低分', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('cls', 0.5)
        usePerformanceStore.getState().updateWebVital('lcp', 5000)
        usePerformanceStore.getState().updateWebVital('fcp', 4000)
        usePerformanceStore.getState().updateWebVital('ttfb', 2000)
      })
      
      expect(usePerformanceStore.getState().performanceScore).toBeLessThan(50)
    })
  })

  describe('组件性能', () => {
    it('应该能够记录组件渲染时间', () => {
      act(() => {
        usePerformanceStore.getState().recordComponentRender('TestComponent', 10)
      })
      
      const metrics = usePerformanceStore.getState().componentMetrics
      expect(metrics).toHaveLength(1)
      expect(metrics[0].name).toBe('TestComponent')
      expect(metrics[0].renderTime).toBe(10)
      expect(metrics[0].renderCount).toBe(1)
    })

    it('应该更新已存在组件的渲染次数', () => {
      act(() => {
        usePerformanceStore.getState().recordComponentRender('TestComponent', 10)
        usePerformanceStore.getState().recordComponentRender('TestComponent', 12)
      })
      
      const metrics = usePerformanceStore.getState().componentMetrics
      expect(metrics).toHaveLength(1)
      expect(metrics[0].renderCount).toBe(2)
      expect(metrics[0].renderTime).toBe(12)
    })

    it('应该检测慢组件并生成建议', () => {
      act(() => {
        usePerformanceStore.getState().recordComponentRender('SlowComponent', 50)
      })
      
      const suggestions = usePerformanceStore.getState().suggestions
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].target).toBe('SlowComponent')
      expect(suggestions[0].type).toBe('memo')
    })

    it('应该能够清除组件性能记录', () => {
      act(() => {
        usePerformanceStore.getState().recordComponentRender('TestComponent', 10)
      })
      
      expect(usePerformanceStore.getState().componentMetrics).toHaveLength(1)
      
      act(() => {
        usePerformanceStore.getState().clearComponentMetrics()
      })
      
      expect(usePerformanceStore.getState().componentMetrics).toHaveLength(0)
    })

    it('应该能够获取慢组件列表', () => {
      act(() => {
        usePerformanceStore.getState().recordComponentRender('FastComponent', 5)
        usePerformanceStore.getState().recordComponentRender('SlowComponent', 30)
        usePerformanceStore.getState().recordComponentRender('VerySlowComponent', 100)
      })
      
      const slowComponents = usePerformanceStore.getState().getSlowComponents()
      
      expect(slowComponents).toHaveLength(2)
      expect(slowComponents[0].name).toBe('VerySlowComponent')
      expect(slowComponents[1].name).toBe('SlowComponent')
    })
  })

  describe('性能建议', () => {
    it('应该能够添加性能建议', () => {
      act(() => {
        usePerformanceStore.getState().addSuggestion({
          type: 'lazy-load',
          severity: 'warning',
          title: '建议懒加载',
          description: '组件过大，建议使用懒加载',
          target: 'LargeComponent',
        })
      })
      
      const suggestions = usePerformanceStore.getState().suggestions
      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].handled).toBe(false)
    })

    it('应该避免重复添加相同的建议', () => {
      act(() => {
        usePerformanceStore.getState().addSuggestion({
          type: 'lazy-load',
          severity: 'warning',
          title: '建议懒加载',
          description: '组件过大，建议使用懒加载',
          target: 'LargeComponent',
        })
        usePerformanceStore.getState().addSuggestion({
          type: 'lazy-load',
          severity: 'warning',
          title: '建议懒加载',
          description: '组件过大，建议使用懒加载',
          target: 'LargeComponent',
        })
      })
      
      expect(usePerformanceStore.getState().suggestions).toHaveLength(1)
    })

    it('应该能够标记建议已处理', () => {
      act(() => {
        usePerformanceStore.getState().addSuggestion({
          type: 'lazy-load',
          severity: 'warning',
          title: '建议懒加载',
          description: '组件过大，建议使用懒加载',
          target: 'LargeComponent',
        })
      })
      
      act(() => {
        usePerformanceStore.getState().markSuggestionHandled('LargeComponent')
      })
      
      const suggestions = usePerformanceStore.getState().suggestions
      expect(suggestions[0].handled).toBe(true)
    })

    it('应该能够清除所有建议', () => {
      act(() => {
        usePerformanceStore.getState().addSuggestion({
          type: 'lazy-load',
          severity: 'warning',
          title: '建议1',
          description: '描述1',
          target: 'Component1',
        })
        usePerformanceStore.getState().addSuggestion({
          type: 'memo',
          severity: 'critical',
          title: '建议2',
          description: '描述2',
          target: 'Component2',
        })
      })
      
      expect(usePerformanceStore.getState().suggestions).toHaveLength(2)
      
      act(() => {
        usePerformanceStore.getState().clearSuggestions()
      })
      
      expect(usePerformanceStore.getState().suggestions).toHaveLength(0)
    })
  })

  describe('API指标', () => {
    it('应该能够更新API指标', () => {
      act(() => {
        usePerformanceStore.getState().updateAPIMetrics('/api/test', 100)
      })
      
      const metrics = usePerformanceStore.getState().apiMetrics.get('/api/test')
      expect(metrics).toBeDefined()
      expect(metrics?.avg).toBe(100)
      expect(metrics?.calls).toBe(1)
      expect(metrics?.errors).toBe(0)
    })

    it('应该正确计算移动平均', () => {
      act(() => {
        usePerformanceStore.getState().updateAPIMetrics('/api/test', 100)
        usePerformanceStore.getState().updateAPIMetrics('/api/test', 200)
      })
      
      const metrics = usePerformanceStore.getState().apiMetrics.get('/api/test')
      expect(metrics?.avg).toBeCloseTo(110)
    })

    it('应该记录API错误', () => {
      act(() => {
        usePerformanceStore.getState().updateAPIMetrics('/api/test', 100, true)
      })
      
      const metrics = usePerformanceStore.getState().apiMetrics.get('/api/test')
      expect(metrics?.errors).toBe(1)
    })

    it('应该检测慢API并生成建议', () => {
      act(() => {
        for (let i = 0; i < 10; i++) {
          usePerformanceStore.getState().updateAPIMetrics('/api/slow', 2500)
        }
      })
      
      const suggestions = usePerformanceStore.getState().suggestions
      const slowApiSuggestion = suggestions.find(s => s.target === '/api/slow')
      expect(slowApiSuggestion).toBeDefined()
      expect(slowApiSuggestion?.type).toBe('code-split')
    })

    it('应该能够清除API指标', () => {
      act(() => {
        usePerformanceStore.getState().updateAPIMetrics('/api/test', 100)
      })
      
      expect(usePerformanceStore.getState().apiMetrics.size).toBe(1)
      
      act(() => {
        usePerformanceStore.getState().clearAPIMetrics()
      })
      
      expect(usePerformanceStore.getState().apiMetrics.size).toBe(0)
    })
  })

  describe('系统指标', () => {
    it('应该能够记录系统指标', () => {
      act(() => {
        usePerformanceStore.getState().recordSystemMetrics({
          cpu: 50,
          memory: 60,
          latency: 20,
          networkSpeed: 100,
        })
      })
      
      const history = usePerformanceStore.getState().systemMetricsHistory
      expect(history).toHaveLength(1)
      expect(history[0].cpu).toBe(50)
      expect(history[0].memory).toBe(60)
      expect(history[0].timestamp).toBeDefined()
    })

    it('应该限制历史记录数量', () => {
      act(() => {
        for (let i = 0; i < 150; i++) {
          usePerformanceStore.getState().recordSystemMetrics({
            cpu: i,
            memory: 50,
            latency: 20,
            networkSpeed: 100,
          })
        }
      })
      
      const history = usePerformanceStore.getState().systemMetricsHistory
      expect(history.length).toBeLessThanOrEqual(100)
    })

    it('应该能够清除系统指标历史', () => {
      act(() => {
        usePerformanceStore.getState().recordSystemMetrics({
          cpu: 50,
          memory: 60,
          latency: 20,
          networkSpeed: 100,
        })
      })
      
      expect(usePerformanceStore.getState().systemMetricsHistory).toHaveLength(1)
      
      act(() => {
        usePerformanceStore.getState().clearSystemMetrics()
      })
      
      expect(usePerformanceStore.getState().systemMetricsHistory).toHaveLength(0)
    })

    it('应该能够获取性能趋势', () => {
      act(() => {
        for (let i = 0; i < 50; i++) {
          usePerformanceStore.getState().recordSystemMetrics({
            cpu: i,
            memory: 50,
            latency: 20,
            networkSpeed: 100,
          })
        }
      })
      
      const trend = usePerformanceStore.getState().getPerformanceTrend(10)
      expect(trend).toHaveLength(10)
      
      const trend30 = usePerformanceStore.getState().getPerformanceTrend()
      expect(trend30).toHaveLength(30)
    })
  })

  describe('监控控制', () => {
    it('应该能够开始监控', () => {
      act(() => {
        usePerformanceStore.getState().startMonitoring()
      })
      
      expect(usePerformanceStore.getState().isMonitoring).toBe(true)
    })

    it('应该能够停止监控', () => {
      act(() => {
        usePerformanceStore.getState().startMonitoring()
      })
      
      expect(usePerformanceStore.getState().isMonitoring).toBe(true)
      
      act(() => {
        usePerformanceStore.getState().stopMonitoring()
      })
      
      expect(usePerformanceStore.getState().isMonitoring).toBe(false)
    })
  })

  describe('性能评分计算', () => {
    it('应该返回当前性能评分', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('lcp', 2000)
      })
      
      const score = usePerformanceStore.getState().calculatePerformanceScore()
      expect(score).toBe(usePerformanceStore.getState().performanceScore)
    })
  })

  describe('Web Vitals建议生成', () => {
    it('应该在CLS过高时生成建议', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('cls', 0.5)
      })
      
      const suggestions = usePerformanceStore.getState().suggestions
      const clsSuggestion = suggestions.find(s => s.type === 'lazy-load')
      expect(clsSuggestion).toBeDefined()
    })

    it('应该在LCP过高时生成建议', () => {
      act(() => {
        usePerformanceStore.getState().updateWebVital('lcp', 5000)
      })
      
      const suggestions = usePerformanceStore.getState().suggestions
      const lcpSuggestion = suggestions.find(s => s.type === 'image-optimize')
      expect(lcpSuggestion).toBeDefined()
    })
  })
})
