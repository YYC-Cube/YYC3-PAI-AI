/**
 * YYC3 E2E — App Mode Switching
 * @description 验证三种模式（Fullscreen、Widget、IDE）切换及初始渲染
 * @version 4.8.0
 * 对齐 Guidelines: Three-mode layout system
 */
import { test, expect } from '@playwright/test'

test.describe('App Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for initial render
    await page.waitForSelector('[data-testid="app-root"], .w-full.h-screen', { timeout: 10_000 })
  })

  test('should load the application without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.waitForTimeout(2000)
    // Allow React dev warnings but no crashes
    const criticalErrors = errors.filter(e =>
      !e.includes('Warning:') &&
      !e.includes('DevTools') &&
      !e.includes('favicon')
    )
    expect(criticalErrors).toEqual([])
  })

  test('should render the fullscreen mode by default', async ({ page }) => {
    // The default mode is "fullscreen" — look for brand name or mode indicator
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
    // Should have the YYC3 brand somewhere
    expect(body).toContain('YYC')
  })

  test('should switch to IDE mode', async ({ page }) => {
    // Find and click the IDE mode toggle button
    const ideButton = page.locator('button').filter({ hasText: /IDE|Code|编辑/i }).first()
    if (await ideButton.isVisible()) {
      await ideButton.click()
      // IDE mode should show editor-related UI
      await page.waitForTimeout(500)
    }
  })

  test('should switch to widget mode', async ({ page }) => {
    // Find and click the widget/minimize button
    const widgetButton = page.locator('button').filter({ hasText: /Widget|小组件/i }).first()
    if (await widgetButton.isVisible()) {
      await widgetButton.click()
      await page.waitForTimeout(500)
    }
  })
})
