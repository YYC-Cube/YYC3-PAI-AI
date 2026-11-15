/**
 * YYC3 Visual Regression Tests
 * @description 视觉回归测试 - 确保UI渲染一致性
 * @version 1.0.0
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 视觉基线稳定性：禁用动画/过渡/光标闪烁（跨运行像素级可复现）
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      const style = document.createElement('style')
      style.textContent = `*, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }`
      document.documentElement.appendChild(style)
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('Home page visual', async ({ page }) => {
    await expect(page).toHaveScreenshot('home-page.png')
  })

  test('Agent Dashboard visual', async ({ page }) => {
    // 导航到Agent面板
    const agentBtn = page.locator('button').filter({ hasText: /Agent|代理|AI/i }).first()
    if (await agentBtn.isVisible().catch(() => false)) {
      await agentBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('agent-dashboard.png')
    }
  })

  test('WebGPU Inference Panel visual', async ({ page }) => {
    const webgpuBtn = page.locator('button').filter({ hasText: /WebGPU|AI|推理/i }).first()
    if (await webgpuBtn.isVisible().catch(() => false)) {
      await webgpuBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('webgpu-panel.png')
    }
  })

  test('CRDT Collaboration Panel visual', async ({ page }) => {
    const collabBtn = page.locator('button').filter({ hasText: /Collab|协作|Share/i }).first()
    if (await collabBtn.isVisible().catch(() => false)) {
      await collabBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('collab-panel.png')
    }
  })

  test('IDE Mode visual', async ({ page }) => {
    const ideBtn = page.locator('button').filter({ hasText: /IDE|Code|编辑/i }).first()
    if (await ideBtn.isVisible().catch(() => false)) {
      await ideBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('ide-mode.png')
    }
  })

  test('Dark theme visual', async ({ page }) => {
    // 切换到暗色主题
    const themeToggle = page.locator('button').filter({ hasText: /Theme|主题/i }).first()
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('dark-theme.png')
    }
  })

  test('Light theme visual', async ({ page }) => {
    // 确保是亮色主题
    const themeToggle = page.locator('button').filter({ hasText: /Theme|主题/i }).first()
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click() // 切换一次
      await themeToggle.click() // 再切换一次回到亮色
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('light-theme.png')
    }
  })

  test('Mobile viewport visual', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('mobile-home.png')

    // 恢复桌面视口
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test('Tablet viewport visual', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('tablet-home.png')

    // 恢复桌面视口
    await page.setViewportSize({ width: 1920, height: 1080 })
  })
})

test.describe('Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Button component visual', async ({ page }) => {
    const buttons = page.locator('button').first()
    if (await buttons.isVisible().catch(() => false)) {
      await expect(buttons).toHaveScreenshot('button-component.png')
    }
  })

  test('Input component visual', async ({ page }) => {
    const inputs = page.locator('input').first()
    if (await inputs.isVisible().catch(() => false)) {
      await expect(inputs).toHaveScreenshot('input-component.png')
    }
  })

  test('Textarea component visual', async ({ page }) => {
    const textareas = page.locator('textarea').first()
    if (await textareas.isVisible().catch(() => false)) {
      await expect(textareas).toHaveScreenshot('textarea-component.png')
    }
  })

  test('Card component visual', async ({ page }) => {
    const cards = page.locator('[data-testid*="card"], .card').first()
    if (await cards.isVisible().catch(() => false)) {
      await expect(cards).toHaveScreenshot('card-component.png')
    }
  })
})

test.describe('Responsive Design Visual Regression', () => {
  test('Desktop viewport (1920x1080)', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('desktop-1920x1080.png')
  })

  test('Laptop viewport (1366x768)', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('laptop-1366x768.png')
  })

  test('Mobile Small viewport (320x568)', async ({ page }) => {
    await page.goto('/')
    await page.setViewportSize({ width: 320, height: 568 })
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('mobile-small-320x568.png')
  })
})

test.describe('Interactive States Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Button hover state visual', async ({ page }) => {
    const button = page.locator('button').first()
    if (await button.isVisible().catch(() => false)) {
      await button.hover()
      await page.waitForTimeout(200)

      await expect(page).toHaveScreenshot('button-hover.png')
    }
  })

  test('Input focus state visual', async ({ page }) => {
    const input = page.locator('input').first()
    if (await input.isVisible().catch(() => false)) {
      await input.focus()
      await page.waitForTimeout(200)

      await expect(page).toHaveScreenshot('input-focus.png')
    }
  })
})
