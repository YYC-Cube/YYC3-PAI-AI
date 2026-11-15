/**
 * @file translations.test.ts
 * @description Unit test for translations
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

/**
 * YYC3 i18n Translations — Completeness Tests
 * @description 验证所有翻译 section 的中英双语键完整性
 * @version 4.8.0
 */
import { describe, it, expect } from 'vitest'
import { translations } from '../translations'

const sections = Object.keys(translations) as (keyof typeof translations)[]

describe('Translation Completeness', () => {
  it('should have at least 30 translation sections', () => {
    expect(sections.length).toBeGreaterThanOrEqual(30)
  })

  sections.forEach((section) => {
    describe(`Section: ${section}`, () => {
      const entries = Object.entries(translations[section])

      it('should have at least one entry', () => {
        expect(entries.length).toBeGreaterThan(0)
      })

      entries.forEach(([key, value]) => {
        it(`"${key}" should have both zh and en translations`, () => {
          expect(value).toBeDefined()
          expect(typeof (value as any).zh).toBe('string')
          expect(typeof (value as any).en).toBe('string')
          expect((value as any).zh.length).toBeGreaterThan(0)
          expect((value as any).en.length).toBeGreaterThan(0)
        })
      })
    })
  })
})

describe('Critical Translation Keys', () => {
  it('ide section should contain panel DnD keys', () => {
    const ide = translations.ide as Record<string, { zh: string; en: string }>
    expect(ide.dragToSwap).toBeDefined()
    expect(ide.dropToSwap).toBeDefined()
    expect(ide.panelContent).toBeDefined()
    expect(ide.resetLayout).toBeDefined()
  })

  it('ide section should contain terminal expand keys', () => {
    const ide = translations.ide as Record<string, { zh: string; en: string }>
    expect(ide.terminalExpand).toBeDefined()
    expect(ide.terminalCollapse).toBeDefined()
    expect(ide.terminalRightOnly).toBeDefined()
    expect(ide.terminalWide).toBeDefined()
  })

  it('all section names should not contain truncated content', () => {
    const placeholderKeys = [
      'enterCommand', 'chatPlaceholder', 'searchFiles', 'terminalPlaceholder',
      'diagRunning', 'aiDiagGenerating', 'testSending', 'scanning',
      'aiThinking', 'deployStarted', 'cliAccess', 'quickAction',
      'syncing', 'syncingProgress', 'exporting', 'importing',
      'placeholder', 'searchPlaceholder', 'systemPromptPlaceholder',
      'contentPlaceholder', 'cmdPlaceholder', 'layoutNamePlaceholder',
      'layoutImportPlaceholder', 'passphrasePlaceholder',
      'search', 'placeholder', 'recording',
      'commitPlaceholder', 'inferring', 'searchPlaceholder',
      'aiThinkingText', 'aiScanning', 'aiAnalyzing', 'aiConnecting',
      'aiThinkingText', 'aiProcessing', 'aiGenerating', 'aiScanning'
    ]
    
    for (const section of sections) {
      const entries = Object.entries(translations[section])
      for (const [key, value] of entries) {
        const v = value as { zh: string; en: string }
        // Check for common truncation signs, but allow placeholders with ellipsis
        if (placeholderKeys.includes(key)) continue
        expect(v.zh).not.toMatch(/\.\.\.$/)
        expect(v.en).not.toMatch(/\.\.\.$/)
      }
    }
  })
})
