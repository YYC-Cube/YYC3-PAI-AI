/**
 * @file project-store.ts
 * @description 项目状态管理模块，管理项目数据和操作
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags project,state-management,core
 */

import { useSyncExternalStore } from 'react'
import type { DesignRoot, FileNode } from '../types'

// ===== Project Template Types =====
export interface ProjectTemplate {
  id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  icon: string
  techStack: string[]
  defaultFiles: FileNode[]
  designJson: DesignRoot
}

export interface ProjectInfo {
  id: string
  name: string
  description: string
  templateId: string
  techStack: string[]
  createdAt: string
  updatedAt: string
  status: 'creating' | 'active' | 'archived'
  fileTree: FileNode[]
  designJson: DesignRoot
}

// ===== Default Design JSON Factory =====
function createDefaultDesignJson(templateId: string): DesignRoot {
  return {
    version: '4.7.2',
    theme: 'dark',
    tokens: 'cyberpunk-default',
    panels: [
      {
        id: 'root-panel',
        type: 'container',
        layout: { x: 0, y: 0, w: 12, h: 8 },
        style: { background: '#0a0a0a', borderRadius: 8, padding: 16 },
        children: [
          {
            id: 'header-panel',
            type: 'container',
            layout: { x: 0, y: 0, w: 12, h: 1 },
            style: { background: 'rgba(0,240,255,0.03)', padding: 8 },
          },
          {
            id: 'content-panel',
            type: 'content',
            layout: { x: 0, y: 1, w: 12, h: 6 },
            style: { padding: 16 },
          },
          {
            id: 'footer-panel',
            type: 'container',
            layout: { x: 0, y: 7, w: 12, h: 1 },
            style: { background: 'rgba(0,240,255,0.02)', padding: 8 },
          },
        ],
      },
    ],
    components: [
      {
        id: `comp-btn-${templateId}`,
        type: 'Button',
        props: { text: 'Get Started', variant: 'primary' },
        style: {
          padding: '8px 16px',
          borderRadius: 6,
          background: '#00f0ff',
          color: '#0a0a0a',
          cursor: 'pointer',
        },
      },
      {
        id: `comp-input-${templateId}`,
        type: 'Input',
        props: { placeholder: 'Enter value...', type: 'text' },
        style: {
          padding: '8px 12px',
          borderRadius: 4,
          border: '1px solid rgba(0,240,255,0.3)',
          background: 'rgba(0,240,255,0.05)',
          color: '#00f0ff',
        },
      },
    ],
    styles: {
      tokens: {
        colors: {
          primary: { 50: '#e6feff', 100: '#b3fcff', 200: '#80faff', 300: '#4df8ff', 400: '#1af5ff', 500: '#00f0ff', 600: '#00c0cc', 700: '#009099', 800: '#006066', 900: '#003033' },
          secondary: { 50: '#f5e6ff', 100: '#e0b3ff', 200: '#cc80ff', 300: '#b84dff', 400: '#a31aff', 500: '#8f00e6', 600: '#7200b8', 700: '#560089', 800: '#39005b', 900: '#1d002e' },
          success: { 50: '#e6ffe6', 100: '#b3ffb3', 200: '#80ff80', 300: '#4dff4d', 400: '#1aff1a', 500: '#00ff00', 600: '#00cc00', 700: '#009900', 800: '#006600', 900: '#003300' },
          warning: { 50: '#fffbe6', 100: '#fff3b3', 200: '#ffeb80', 300: '#ffe34d', 400: '#ffdb1a', 500: '#ffd300', 600: '#cca900', 700: '#997f00', 800: '#665500', 900: '#332a00' },
          error: { 50: '#ffe6eb', 100: '#ffb3c2', 200: '#ff8099', 300: '#ff4d70', 400: '#ff1a47', 500: '#ff0044', 600: '#cc0036', 700: '#990029', 800: '#66001b', 900: '#33000e' },
          neutral: { 50: '#f5f5f5', 100: '#e0e0e0', 200: '#c0c0c0', 300: '#a0a0a0', 400: '#808080', 500: '#606060', 600: '#404040', 700: '#303030', 800: '#1a1a1a', 900: '#0a0a0a' },
        },
        spacing: { 0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px' },
        typography: {
          fontFamily: { sans: ['Rajdhani', 'sans-serif'], mono: ['Share Tech Mono', 'monospace'] },
          fontSize: { xs: '10px', sm: '12px', base: '14px', lg: '16px', xl: '18px', '2xl': '22px', '3xl': '28px', '4xl': '36px' },
          fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
          lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
        },
        borderRadius: { none: '0px', sm: '2px', base: '4px', md: '6px', lg: '8px', xl: '12px', '2xl': '16px', full: '9999px' },
        shadows: {
          xs: '0 1px 2px rgba(0,0,0,0.3)',
          sm: '0 1px 3px rgba(0,0,0,0.4)',
          base: '0 4px 6px rgba(0,0,0,0.4)',
          md: '0 6px 10px rgba(0,0,0,0.5)',
          lg: '0 10px 15px rgba(0,0,0,0.5)',
          xl: '0 20px 25px rgba(0,0,0,0.6)',
        },
        transitions: { fast: '0.15s ease', normal: '0.3s ease', slow: '0.5s ease' },
      },
      theme: {
        name: 'cyberpunk-dark',
        mode: 'dark',
        colors: {
          background: '#0a0a0a',
          foreground: '#e0e0e0',
          primary: '#00f0ff',
          secondary: '#8f00e6',
          accent: '#ff00ff',
          muted: '#303030',
          border: 'rgba(0,240,255,0.15)',
          input: 'rgba(0,240,255,0.05)',
          ring: '#00f0ff',
        },
      },
      components: {},
    },
  }
}

// ===== Project Templates =====
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'react-app',
    name: { zh: 'React 应用', en: 'React App' },
    description: { zh: '标准 React 18 + TypeScript 单页应用', en: 'Standard React 18 + TypeScript SPA' },
    icon: '⚛️',
    techStack: ['React 18', 'TypeScript 5', 'Vite 5', 'Tailwind CSS'],
    defaultFiles: [
      {
        name: 'src', type: 'folder', children: [
          {
            name: 'app', type: 'folder', children: [
              { name: 'App.tsx', type: 'file', ext: 'tsx' },
              { name: 'types.ts', type: 'file', ext: 'ts' },
              {
                name: 'components', type: 'folder', children: [
                  { name: 'Header.tsx', type: 'file', ext: 'tsx' },
                  { name: 'Footer.tsx', type: 'file', ext: 'tsx' },
                  { name: 'MainContent.tsx', type: 'file', ext: 'tsx' },
                ]
              },
            ]
          },
          {
            name: 'styles', type: 'folder', children: [
              { name: 'theme.css', type: 'file', ext: 'css' },
              { name: 'fonts.css', type: 'file', ext: 'css' },
            ]
          },
        ]
      },
      { name: 'package.json', type: 'file', ext: 'json' },
      { name: 'tsconfig.json', type: 'file', ext: 'json' },
      { name: 'vite.config.ts', type: 'file', ext: 'ts' },
    ],
    designJson: createDefaultDesignJson('react-app'),
  },
  {
    id: 'dashboard',
    name: { zh: '数据仪表盘', en: 'Data Dashboard' },
    description: { zh: '数据可视化仪表盘，含图表与实时监控', en: 'Data visualization dashboard with charts & real-time monitoring' },
    icon: '📊',
    techStack: ['React 18', 'TypeScript 5', 'Recharts', 'Tailwind CSS'],
    defaultFiles: [
      {
        name: 'src', type: 'folder', children: [
          {
            name: 'app', type: 'folder', children: [
              { name: 'App.tsx', type: 'file', ext: 'tsx' },
              {
                name: 'components', type: 'folder', children: [
                  { name: 'Dashboard.tsx', type: 'file', ext: 'tsx' },
                  { name: 'ChartPanel.tsx', type: 'file', ext: 'tsx' },
                  { name: 'StatCard.tsx', type: 'file', ext: 'tsx' },
                  { name: 'DataTable.tsx', type: 'file', ext: 'tsx' },
                ]
              },
            ]
          },
        ]
      },
      { name: 'package.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('dashboard'),
  },
  {
    id: 'landing-page',
    name: { zh: '着陆页', en: 'Landing Page' },
    description: { zh: '响应式产品着陆页，含动画与 CTA', en: 'Responsive product landing page with animations & CTA' },
    icon: '🚀',
    techStack: ['React 18', 'TypeScript 5', 'Motion', 'Tailwind CSS'],
    defaultFiles: [
      {
        name: 'src', type: 'folder', children: [
          {
            name: 'app', type: 'folder', children: [
              { name: 'App.tsx', type: 'file', ext: 'tsx' },
              {
                name: 'components', type: 'folder', children: [
                  { name: 'Hero.tsx', type: 'file', ext: 'tsx' },
                  { name: 'Features.tsx', type: 'file', ext: 'tsx' },
                  { name: 'CTA.tsx', type: 'file', ext: 'tsx' },
                  { name: 'Footer.tsx', type: 'file', ext: 'tsx' },
                ]
              },
            ]
          },
        ]
      },
      { name: 'package.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('landing-page'),
  },
  {
    id: 'admin-panel',
    name: { zh: '管理后台', en: 'Admin Panel' },
    description: { zh: 'CRUD 管理面板，含表格、表单与权限', en: 'CRUD admin panel with tables, forms & permissions' },
    icon: '🔧',
    techStack: ['React 18', 'TypeScript 5', 'React Router', 'Tailwind CSS'],
    defaultFiles: [
      {
        name: 'src', type: 'folder', children: [
          {
            name: 'app', type: 'folder', children: [
              { name: 'App.tsx', type: 'file', ext: 'tsx' },
              {
                name: 'components', type: 'folder', children: [
                  { name: 'Sidebar.tsx', type: 'file', ext: 'tsx' },
                  { name: 'UserTable.tsx', type: 'file', ext: 'tsx' },
                  { name: 'FormEditor.tsx', type: 'file', ext: 'tsx' },
                ]
              },
              {
                name: 'pages', type: 'folder', children: [
                  { name: 'Dashboard.tsx', type: 'file', ext: 'tsx' },
                  { name: 'Users.tsx', type: 'file', ext: 'tsx' },
                  { name: 'Settings.tsx', type: 'file', ext: 'tsx' },
                ]
              },
            ]
          },
        ]
      },
      { name: 'package.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('admin-panel'),
  },
  {
    id: 'blank',
    name: { zh: '空白项目', en: 'Blank Project' },
    description: { zh: '从零开始的空白模板', en: 'Start from scratch with a blank template' },
    icon: '📄',
    techStack: ['React 18', 'TypeScript 5', 'Tailwind CSS'],
    defaultFiles: [
      {
        name: 'src', type: 'folder', children: [
          {
            name: 'app', type: 'folder', children: [
              { name: 'App.tsx', type: 'file', ext: 'tsx' },
            ]
          },
        ]
      },
      { name: 'package.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('blank'),
  },

  // ===== Phase 1.3: 自媒体内容模板 (Self-Media Content Templates) =====
  {
    id: 'wechat-article',
    name: { zh: '公众号文章', en: 'WeChat Article' },
    description: { zh: '微信公众号图文内容模板，含封面图、摘要、正文分段结构', en: 'WeChat Official Account article with cover image, summary, and section structure' },
    icon: '📱',
    techStack: ['TipTap 富文本', 'AI 写作助手', '素材管理器', 'YYC³ RichTextEditor'],
    defaultFiles: [
      {
        name: 'content', type: 'folder', children: [
          { name: 'article.md', type: 'file', ext: 'md' },
          { name: 'summary.md', type: 'file', ext: 'md' },
          { name: 'sections', type: 'folder', children: [
            { name: '01-opening.md', type: 'file', ext: 'md' },
            { name: '02-body.md', type: 'file', ext: 'md' },
            { name: '03-closing.md', type: 'file', ext: 'md' },
          ]},
        ],
      },
      {
        name: 'assets', type: 'folder', children: [
          { name: 'cover.jpg', type: 'file', ext: 'jpg' },
          { name: 'images', type: 'folder', children: [] },
        ],
      },
      { name: 'metadata.json', type: 'file', ext: 'json' },
      { name: 'publish-config.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('wechat-article'),
  },
  {
    id: 'xiaohongshu-note',
    name: { zh: '小红书笔记', en: 'Xiaohongshu Note' },
    description: { zh: '小红书图文笔记模板，封面图+多图轮播+正文+标签', en: 'Xiaohongshu image-text note with cover, carousel images, text & tags' },
    icon: '📕',
    techStack: ['图片编辑器', 'AI 文案', '标签推荐', 'YYC³ ImageGenPanel'],
    defaultFiles: [
      {
        name: 'content', type: 'folder', children: [
          { name: 'note.md', type: 'file', ext: 'md' },
          { name: 'caption.md', type: 'file', ext: 'md' },
          { name: 'tags.txt', type: 'file', ext: 'txt' },
        ],
      },
      {
        name: 'assets', type: 'folder', children: [
          { name: 'cover.png', type: 'file', ext: 'png' },
          { name: 'carousel', type: 'folder', children: [
            { name: 'slide-01.png', type: 'file', ext: 'png' },
            { name: 'slide-02.png', type: 'file', ext: 'png' },
            { name: 'slide-03.png', type: 'file', ext: 'png' },
          ]},
        ],
      },
      { name: 'metadata.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('xiaohongshu-note'),
  },
  {
    id: 'video-script',
    name: { zh: '视频脚本', en: 'Video Script' },
    description: { zh: '视频创作脚本模板，分镜+台词+时长+拍摄说明', en: 'Video production script with scenes, dialogue, timing & shooting notes' },
    icon: '🎬',
    techStack: ['AI 文案', '分镜管理', '素材管理器', 'YYC³ TipTap'],
    defaultFiles: [
      {
        name: 'content', type: 'folder', children: [
          { name: 'script.md', type: 'file', ext: 'md' },
          { name: 'outline.md', type: 'file', ext: 'md' },
          { name: 'scenes', type: 'folder', children: [
            { name: 'scene-01.md', type: 'file', ext: 'md' },
            { name: 'scene-02.md', type: 'file', ext: 'md' },
            { name: 'scene-03.md', type: 'file', ext: 'md' },
          ]},
        ],
      },
      {
        name: 'assets', type: 'folder', children: [
          { name: 'storyboard', type: 'folder', children: [] },
          { name: 'references', type: 'folder', children: [] },
        ],
      },
      { name: 'metadata.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('video-script'),
  },
  {
    id: 'zhihu-article',
    name: { zh: '知乎文章', en: 'Zhihu Article' },
    description: { zh: '知乎长文内容模板，引言+正文+结论+参考文献', en: 'Zhihu long-form article with introduction, body, conclusion & references' },
    icon: '💡',
    techStack: ['AI 写作助手', '引用管理', 'TipTap 富文本', 'YYC³ RichTextEditor'],
    defaultFiles: [
      {
        name: 'content', type: 'folder', children: [
          { name: 'article.md', type: 'file', ext: 'md' },
          { name: 'outline.md', type: 'file', ext: 'md' },
          { name: 'references', type: 'folder', children: [
            { name: 'ref-01.md', type: 'file', ext: 'md' },
          ]},
        ],
      },
      {
        name: 'assets', type: 'folder', children: [
          { name: 'images', type: 'folder', children: [] },
          { name: 'diagrams', type: 'folder', children: [] },
        ],
      },
      { name: 'metadata.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('zhihu-article'),
  },
  {
    id: 'multi-platform-post',
    name: { zh: '多平台图文', en: 'Multi-Platform Post' },
    description: { zh: '通用内容模板，一次创作适配多平台（公众号/知乎/小红书/B站）', en: 'Universal content template — create once, publish to WeChat/Zhihu/Xiaohongshu/Bilibili' },
    icon: '🌐',
    techStack: ['AI 写作助手', '格式转换', '一键发布', 'YYC³ RichTextEditor'],
    defaultFiles: [
      {
        name: 'content', type: 'folder', children: [
          { name: 'master.md', type: 'file', ext: 'md' },
          {
            name: 'versions', type: 'folder', children: [
              { name: 'wechat.md', type: 'file', ext: 'md' },
              { name: 'zhihu.md', type: 'file', ext: 'md' },
              { name: 'xiaohongshu.md', type: 'file', ext: 'md' },
            ],
          },
        ],
      },
      {
        name: 'assets', type: 'folder', children: [
          { name: 'images', type: 'folder', children: [] },
          { name: 'export', type: 'folder', children: [] },
        ],
      },
      { name: 'metadata.json', type: 'file', ext: 'json' },
      { name: 'publish-config.json', type: 'file', ext: 'json' },
    ],
    designJson: createDefaultDesignJson('multi-platform-post'),
  },
]

// ===== Creation Steps =====
export type CreationStep = 'template' | 'info' | 'generating' | 'done'

// ===== State Shape =====
interface ProjectStoreState {
  modalOpen: boolean
  currentStep: CreationStep
  selectedTemplateId: string | null
  projectName: string
  projectDescription: string
  projects: ProjectInfo[]
  activeProjectId: string | null
  generationProgress: number
  generationLogs: string[]
}

// ===== Module-level store =====
let state: ProjectStoreState = {
  modalOpen: false,
  currentStep: 'template',
  selectedTemplateId: null,
  projectName: '',
  projectDescription: '',
  projects: [],
  activeProjectId: null,
  generationProgress: 0,
  generationLogs: [],
}

/** Track generation interval so it can be cancelled on modal close */
let generationInterval: ReturnType<typeof setInterval> | null = null

type Listener = () => void
const listeners = new Set<Listener>()

function emitChange() {
  for (const listener of listeners) listener()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

// ===== Actions =====
const actions = {
  openModal: () => {
    state = { ...state, modalOpen: true, currentStep: 'template', selectedTemplateId: null, projectName: '', projectDescription: '', generationProgress: 0, generationLogs: [] }
    emitChange()
  },

  closeModal: () => {
    // Cancel any in-progress generation to prevent state updates after close
    if (generationInterval) {
      clearInterval(generationInterval)
      generationInterval = null
    }
    state = { ...state, modalOpen: false }
    emitChange()
  },

  setStep: (step: CreationStep) => {
    state = { ...state, currentStep: step }
    emitChange()
  },

  selectTemplate: (id: string) => {
    state = { ...state, selectedTemplateId: id }
    emitChange()
  },

  setProjectName: (name: string) => {
    state = { ...state, projectName: name }
    emitChange()
  },

  setProjectDescription: (desc: string) => {
    state = { ...state, projectDescription: desc }
    emitChange()
  },

  // Simulate project generation process
  startGeneration: () => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === state.selectedTemplateId)
    if (!template) return

    // Cancel any previous generation interval
    if (generationInterval) {
      clearInterval(generationInterval)
      generationInterval = null
    }

    state = { ...state, currentStep: 'generating', generationProgress: 0, generationLogs: [] }
    emitChange()

    const steps = [
      { progress: 10, log: 'INIT > Creating project directory structure...' },
      { progress: 25, log: 'INIT > Generating package.json...' },
      { progress: 35, log: 'INIT > Initializing TypeScript configuration...' },
      { progress: 50, log: 'CORE > Generating Design JSON schema...' },
      { progress: 60, log: 'CORE > Creating component templates...' },
      { progress: 72, log: 'CORE > Setting up style tokens & theme...' },
      { progress: 85, log: 'VALIDATE > Running type check (tsc --noEmit)...' },
      { progress: 92, log: 'VALIDATE > ✓ No errors found' },
      { progress: 100, log: 'DONE > Project created successfully!' },
    ]

    let i = 0
    generationInterval = setInterval(() => {
      if (i < steps.length) {
        state = {
          ...state,
          generationProgress: steps[i].progress,
          generationLogs: [...state.generationLogs, steps[i].log],
        }
        emitChange()
        i++
      } else {
        clearInterval(generationInterval!)
        generationInterval = null
        // Create the project
        const newProject: ProjectInfo = {
          id: `proj-${Date.now()}`,
          name: state.projectName || template.name.en,
          description: state.projectDescription || template.description.en,
          templateId: template.id,
          techStack: template.techStack,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
          fileTree: template.defaultFiles,
          designJson: { ...template.designJson },
        }
        state = {
          ...state,
          currentStep: 'done',
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id,
        }
        emitChange()
      }
    }, 400)
  },

  setActiveProject: (id: string | null) => {
    state = { ...state, activeProjectId: id }
    emitChange()
  },

  getActiveProject: (): ProjectInfo | null => {
    if (!state.activeProjectId) return null
    return state.projects.find((p) => p.id === state.activeProjectId) || null
  },

  getSelectedTemplate: (): ProjectTemplate | null => {
    if (!state.selectedTemplateId) return null
    return PROJECT_TEMPLATES.find((t) => t.id === state.selectedTemplateId) || null
  },
}

// ===== React Hook =====
export function useProjectStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return { ...snapshot, ...actions }
}

// ===== Direct access =====
export const projectStore = {
  getState: getSnapshot,
  ...actions,
}
