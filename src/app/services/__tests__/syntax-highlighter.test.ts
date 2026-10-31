/**
 * @file syntax-highlighter.test.ts
 * @description 语法高亮服务单元测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-27
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,syntax,highlight,shiki
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SyntaxHighlighter,
  getGlobalHighlighter,
  highlightCode,
  detectLanguage,
} from '../syntax-highlighter'

// ===== Setup =====
describe('SyntaxHighlighter', () => {
  let highlighter: SyntaxHighlighter

  beforeEach(() => {
    highlighter = new SyntaxHighlighter({
      theme: 'github-dark',
      defaultLanguage: 'javascript',
      enableCache: true,
      largeFileThreshold: 100,
      incrementalThreshold: 500,
    })
  })

  afterEach(async () => {
    await highlighter.destroy()
  })

  // ===== Initialization Tests =====
  describe('Initialization', () => {
    it('should initialize the highlighter', async () => {
      await highlighter.initialize()
      expect(highlighter).toBeDefined()
    })

    it('should handle multiple initialize calls', async () => {
      await highlighter.initialize()
      await highlighter.initialize()
      // Should not throw
    })

    it('should initialize with custom config', async () => {
      const customHighlighter = new SyntaxHighlighter({
        theme: 'github-light',
        defaultLanguage: 'python',
        enableCache: false,
      })

      await customHighlighter.initialize()
      await customHighlighter.destroy()

      expect(customHighlighter).toBeDefined()
    })
  })

  // ===== Highlight Tests =====
  describe('Highlight', () => {
    beforeEach(async () => {
      await highlighter.initialize()
    })

    it('should highlight JavaScript code', async () => {
      const code = 'const x = 1;'
      const result = await highlighter.highlight(code, 'javascript')

      expect(result).toBeDefined()
      expect(result.html).toContain('x')
      expect(result.language).toBe('javascript')
      expect(result.cached).toBe(false)
    })

    it('should highlight TypeScript code', async () => {
      const code = 'const x: number = 1;'
      const result = await highlighter.highlight(code, 'typescript')

      expect(result).toBeDefined()
      expect(result.html).toContain('x')
      expect(result.language).toBe('typescript')
    })

    it('should cache highlighted results', async () => {
      const code = 'const x = 1;'
      const language = 'javascript'

      // First call - not cached
      const result1 = await highlighter.highlight(code, language)
      expect(result1.cached).toBe(false)

      // Second call - cached
      const result2 = await highlighter.highlight(code, language)
      expect(result2.cached).toBe(true)

      // Results should be the same
      expect(result2.html).toBe(result1.html)
    })

    it('should limit cache size', async () => {
      // Disable cache size limit for this test
      const largeHighlighter = new SyntaxHighlighter({
        theme: 'github-dark',
        defaultLanguage: 'javascript',
        enableCache: true,
      })
      await largeHighlighter.initialize()

      // Add many items to cache
      const code = 'const x = 1;'
      for (let i = 0; i < 1010; i++) {
        await largeHighlighter.highlight(`${code} // ${i}`, 'javascript')
      }

      // Cache should be limited to 1000 items
      const stats = largeHighlighter.getCacheStats()
      expect(stats.size).toBeLessThanOrEqual(1000)

      await largeHighlighter.destroy()
    })

    it('should return process time', async () => {
      const code = 'const x = 1;'
      const result = await highlighter.highlight(code, 'javascript')

      expect(result.processTime).toBeGreaterThanOrEqual(0)
      expect(typeof result.processTime).toBe('number')
    })
  })

  // ===== Incremental Highlight Tests =====
  describe('Incremental Highlight', () => {
    beforeEach(async () => {
      await highlighter.initialize()
    })

    it('should highlight incremental ranges', async () => {
      const ranges = [
        { startLine: 0, endLine: 10, code: 'const x = 1;' },
        { startLine: 10, endLine: 20, code: 'const y = 2;' },
      ]

      const results = await highlighter.highlightIncremental(ranges, 'javascript')

      expect(results).toHaveLength(2)
      expect(results[0].html).toContain('x')
      expect(results[1].html).toContain('y')
      expect(results[0].incremental).toBe(true)
      expect(results[1].incremental).toBe(true)
    })

    it('should cache incremental results', async () => {
      const ranges = [
        { startLine: 0, endLine: 10, code: 'const x = 1;' },
      ]

      // First call
      const results1 = await highlighter.highlightIncremental(ranges, 'javascript')
      expect(results1[0].cached).toBe(false)

      // Second call
      const results2 = await highlighter.highlightIncremental(ranges, 'javascript')
      expect(results2[0].cached).toBe(true)
    })

    it('should fall back to full highlight for large code', async () => {
      const largeCode = 'x'.repeat(600) // Exceeds incremental threshold of 500
      const ranges = [
        { startLine: 0, endLine: 10, code: largeCode },
      ]

      const results = await highlighter.highlightIncremental(ranges, 'javascript')

      expect(results).toHaveLength(1)
      expect(results[0].incremental).toBe(false) // Should fall back to full highlight
    })
  })

  // ===== Large File Highlight Tests =====
  describe('Large File Highlight', () => {
    beforeEach(async () => {
      await highlighter.initialize()
    })

    it('should highlight small files normally', async () => {
      const code = 'const x = 1;'
      const result = await highlighter.highlightLarge(code, 'javascript')

      expect(result).toBeDefined()
      expect(result.html).toContain('x')
    })

    it('should highlight large files in batches', async () => {
      const lines = Array(150).fill('const x = 1;') // Exceeds threshold of 100
      const code = lines.join('\n')

      const progressCallback = vi.fn()
      const result = await highlighter.highlightLarge(code, 'javascript', progressCallback)

      expect(result).toBeDefined()
      expect(result.html).toContain('x')
      expect(progressCallback).toHaveBeenCalled()
    })

    it('should call progress callback for each batch', async () => {
      const lines = Array(150).fill('const x = 1;')
      const code = lines.join('\n')

      const progressCallback = vi.fn()
      await highlighter.highlightLarge(code, 'javascript', progressCallback)

      // Should have been called at least once
      expect(progressCallback).toHaveBeenCalled()

      // Progress values should be between 0 and 100
      progressCallback.mock.calls.forEach((call) => {
        const progress = call[0]
        expect(progress).toBeGreaterThanOrEqual(0)
        expect(progress).toBeLessThanOrEqual(100)
      })
    })
  })

  // ===== Cache Management Tests =====
  describe('Cache Management', () => {
    beforeEach(async () => {
      await highlighter.initialize()
    })

    it('should clear cache', async () => {
      const code = 'const x = 1;'

      // Add to cache
      await highlighter.highlight(code, 'javascript')

      // Clear cache
      highlighter.clearCache()

      // Highlight again - should not be cached
      const result = await highlighter.highlight(code, 'javascript')
      expect(result.cached).toBe(false)
    })

    it('should return cache stats', async () => {
      const code = 'const x = 1;'
      await highlighter.highlight(code, 'javascript')

      const stats = highlighter.getCacheStats()
      expect(stats.size).toBeGreaterThan(0)
    })
  })

  // ===== Language Detection Tests =====
  describe('Language Detection', () => {
    it('should detect JavaScript from file name', () => {
      const language = detectLanguage('script.js')
      expect(language).toBe('javascript')
    })

    it('should detect TypeScript from file name', () => {
      const language = detectLanguage('component.tsx')
      expect(language).toBe('typescript')
    })

    it('should detect Python from file name', () => {
      const language = detectLanguage('module.py')
      expect(language).toBe('python')
    })

    it('should return plaintext for unknown extensions', () => {
      const language = detectLanguage('file.unknown')
      expect(language).toBe('plaintext')
    })
  })

  // ===== Utility Functions Tests =====
  describe('Utility Functions', () => {
    it('should get global highlighter', () => {
      const global = getGlobalHighlighter()
      expect(global).toBeDefined()
    })

    it('should return same global highlighter instance', () => {
      const global1 = getGlobalHighlighter()
      const global2 = getGlobalHighlighter()
      expect(global1).toBe(global2)
    })

    it('should highlight code using shortcut function', async () => {
      const code = 'const x = 1;'
      const html = await highlightCode(code, 'javascript')

      expect(html).toContain('x')
    })
  })

  // ===== Performance Tests =====
  describe('Performance', () => {
    beforeEach(async () => {
      await highlighter.initialize()
    })

    it('should highlight small code quickly', async () => {
      const code = 'const x = 1;'
      const start = performance.now()
      await highlighter.highlight(code, 'javascript')
      const elapsed = performance.now() - start

      // 性能冒烟上界：旧阈值 100ms 为墙钟断言，全量套件并行抢占下必超（实测 ~390ms）；
      // 量级语义用宽松上界表达，功能正确性另有专测
      expect(elapsed).toBeLessThan(2000)
    })

    it('should handle large code efficiently', async () => {
      const lines = Array(1000).fill('const x = 1;')
      const code = lines.join('\n')

      const start = performance.now()
      await highlighter.highlightLarge(code, 'javascript')
      const elapsed = performance.now() - start

      // Should complete within reasonable time
      expect(elapsed).toBeLessThan(5000) // 5 seconds max
    })
  })
})

// ===== Global Highlighter Tests =====
describe('Global Highlighter', () => {
  it('should maintain singleton instance', () => {
    const instance1 = getGlobalHighlighter()
    const instance2 = getGlobalHighlighter()

    expect(instance1).toBe(instance2)
  })
})
