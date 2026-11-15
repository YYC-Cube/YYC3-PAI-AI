/**
 * YYC3 Playwright E2E Configuration
 * @description 端到端测试配置 — 覆盖模式切换、面板拖拽、主题切换、AI 对话
 * @version 4.8.0
 * 对齐 Guidelines: Testing — E2E tests with Playwright
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // 增加worker数量
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  expect: {
    // 视觉回归测试的阈值（跨平台基线：字体抗锯齿差异用比例容差吸收）
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03, // 3% 像素级容差（跨 OS 字体渲染差异）
      threshold: 0.2,
    },
  },

  // 快照路径去平台后缀：单一基线跨 darwin/linux 复用（配 3% 容差）
  snapshotPathTemplate: '{testDir}/tests/{testFileDir}/visual-regression.spec.ts-snapshots/{arg}{ext}',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewport
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // 视觉回归测试专用项目
    {
      name: 'visual-regression',
      testDir: './tests',
      testMatch: /visual-regression\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // npx 形式兼容无全局 pnpm 的环境（CI runner）；本地已有 server 时直接复用
    command: 'npx -y pnpm@9 dev',
    url: 'http://localhost:3200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
