/**
 * @file ProjectCreateModal.tsx
 * @description 项目创建模态框组件，提供项目创建
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags modal,project,create,ui,component
 */

import React, { useCallback, useEffect, useRef } from 'react'
import {
  X, ChevronRight, ChevronLeft, Sparkles,
  Check, Loader2, FileCode, Layers, Rocket,
} from 'lucide-react'
import { useI18n } from '../i18n/context'
import { useProjectStore, PROJECT_TEMPLATES } from '../store/project-store'
import { cyberToast } from './CyberToast'
import { useThemeStore } from '../store/theme-store'
import { Z_INDEX, BLUR } from '../store/theme-store'

export function ProjectCreateModal() {
  const { locale } = useI18n()
  const store = useProjectStore()
  const { tokens: tk, isCyberpunk } = useThemeStore()
  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [store.generationLogs])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') store.closeModal()
  }, [store])

  useEffect(() => {
    if (store.modalOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [store.modalOpen, handleKeyDown])

  if (!store.modalOpen) return null

  const isZh = locale === 'zh'

  // Derived token helpers
  const glowShadow = isCyberpunk ? `0 0 40px ${tk.primaryGlow}, 0 0 80px ${tk.borderDim}` : tk.shadow
  const stepConnectorActive = tk.primary
  const stepConnectorInactive = tk.borderDim

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_INDEX.topModal, background: tk.overlayBg, backdropFilter: BLUR.md }}
      onClick={(e) => { if (e.target === e.currentTarget) store.closeModal() }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: 680,
          maxHeight: '85vh',
          background: tk.panelBg,
          border: `1px solid ${tk.cardBorder}`,
          borderRadius: tk.borderRadius,
          boxShadow: glowShadow,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: tk.cardBorder }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: tk.primaryGlow, border: `1px solid ${tk.cardBorder}` }}
            >
              <Sparkles size={16} color={tk.primary} />
            </div>
            <div>
              <h2 style={{ fontFamily: tk.fontDisplay, fontSize: '14px', color: tk.primary, letterSpacing: '1px', margin: 0, lineHeight: 1.3 }}>
                {isZh ? '创建新项目' : 'CREATE NEW PROJECT'}
              </h2>
              <p style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, letterSpacing: '2px', margin: 0 }}>
                {isZh ? '选择模板 → 填写信息 → 生成项目' : 'SELECT TEMPLATE → PROJECT INFO → GENERATE'}
              </p>
            </div>
          </div>
          <button
            onClick={store.closeModal}
            className="p-1.5 rounded-lg transition-all"
            style={{ border: `1px solid ${tk.border}` }}
          >
            <X size={14} color={tk.primary} />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-0 px-6 py-3 border-b" style={{ borderColor: tk.cardBorder }}>
          {(['template', 'info', 'generating'] as const).map((step, i) => {
            const stepNames = {
              template: isZh ? '选择模板' : 'TEMPLATE',
              info: isZh ? '项目信息' : 'PROJECT INFO',
              generating: isZh ? '生成项目' : 'GENERATE',
            }
            const stepOrder = ['template', 'info', 'generating']
            const currentIdx = stepOrder.indexOf(store.currentStep === 'done' ? 'generating' : store.currentStep)
            const isActive = stepOrder.indexOf(step) <= currentIdx
            const isCurrent = step === store.currentStep || (store.currentStep === 'done' && step === 'generating')

            return (
              <div key={step} className="flex items-center gap-0">
                {i > 0 && (
                  <div style={{ width: 40, height: 1, background: isActive ? stepConnectorActive : stepConnectorInactive, transition: 'background 0.3s' }} />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: isActive ? tk.primaryGlow : tk.borderDim,
                      border: `1px solid ${isActive ? tk.primary : tk.borderDim}`,
                      boxShadow: isCurrent && isCyberpunk ? `0 0 8px ${tk.primaryDim}` : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    {store.currentStep === 'done' && step === 'generating' ? (
                      <Check size={10} color={tk.primary} />
                    ) : (
                      <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: isActive ? tk.primary : tk.foregroundMuted }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: tk.fontMono,
                    fontSize: '9px',
                    color: isActive ? tk.primary : tk.foregroundMuted,
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>
                    {stepNames[step]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Content area */}
        <div className="overflow-y-auto neon-scrollbar" style={{ maxHeight: 'calc(85vh - 160px)' }}>
          {/* ===== STEP 1: Template Selection ===== */}
          {store.currentStep === 'template' && (
            <div className="p-6">
              <p style={{ fontFamily: tk.fontBody, fontSize: '13px', color: tk.foregroundMuted, marginBottom: 16 }}>
                {isZh ? '选择一个项目模板作为起点：' : 'Select a project template to start with:'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PROJECT_TEMPLATES.map((tpl) => {
                  const isSelected = store.selectedTemplateId === tpl.id
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => store.selectTemplate(tpl.id)}
                      className="text-left rounded-lg p-4 transition-all"
                      style={{
                        border: `1px solid ${isSelected ? tk.primary : tk.borderDim}`,
                        background: isSelected ? tk.cardHover : tk.cardBg,
                        boxShadow: isSelected && isCyberpunk ? `0 0 12px ${tk.primaryGlow}, inset 0 0 12px ${tk.borderDim}` : isSelected ? tk.shadow : 'none',
                        borderRadius: tk.borderRadius,
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <span style={{ fontSize: '20px' }}>{tpl.icon}</span>
                        <span style={{ fontFamily: tk.fontDisplay, fontSize: '12px', color: isSelected ? tk.primary : tk.foreground, letterSpacing: '0.5px' }}>
                          {tpl.name[locale]}
                        </span>
                        {isSelected && (
                          <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center" style={{ background: tk.primary }}>
                            <Check size={10} color={tk.background} />
                          </div>
                        )}
                      </div>
                      <p style={{ fontFamily: tk.fontBody, fontSize: '11px', color: tk.foregroundMuted, lineHeight: 1.4 }}>
                        {tpl.description[locale]}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tpl.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-1.5 py-0.5 rounded"
                            style={{
                              fontFamily: tk.fontMono,
                              fontSize: '8px',
                              color: tk.foregroundMuted,
                              background: tk.primaryGlow,
                              border: `1px solid ${tk.borderDim}`,
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Next button */}
              <div className="flex justify-end mt-6">
                <button
                  disabled={!store.selectedTemplateId}
                  onClick={() => store.setStep('info')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '11px',
                    letterSpacing: '1px',
                    color: store.selectedTemplateId ? tk.background : tk.foregroundMuted,
                    background: store.selectedTemplateId ? tk.primary : tk.borderDim,
                    border: `1px solid ${store.selectedTemplateId ? tk.primary : tk.borderDim}`,
                    cursor: store.selectedTemplateId ? 'pointer' : 'not-allowed',
                    boxShadow: store.selectedTemplateId && isCyberpunk ? `0 0 12px ${tk.primaryDim}` : 'none',
                    borderRadius: tk.borderRadius,
                  }}
                >
                  {isZh ? '下一步' : 'NEXT'}
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Project Info ===== */}
          {store.currentStep === 'info' && (
            <div className="p-6">
              {/* Selected template preview */}
              {(() => {
                const tpl = store.getSelectedTemplate()
                if (!tpl) return null
                return (
                  <div className="mb-5 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: tk.primaryGlow, border: `1px solid ${tk.borderDim}` }}>
                    <span style={{ fontSize: '16px' }}>{tpl.icon}</span>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '0.5px' }}>
                      {isZh ? '模板' : 'TEMPLATE'}: {tpl.name[locale]}
                    </span>
                  </div>
                )
              })()}

              {/* Project name */}
              <div className="mb-4">
                <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, opacity: 0.6, letterSpacing: '1px', display: 'block', marginBottom: 6 }}>
                  {isZh ? '项目名称' : 'PROJECT NAME'} *
                </label>
                <input
                  value={store.projectName}
                  onChange={(e) => store.setProjectName(e.target.value)}
                  placeholder={isZh ? '输入项目名称...' : 'Enter project name...'}
                  className="w-full bg-transparent outline-none px-3 py-2 rounded-lg"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '12px',
                    color: tk.primary,
                    caretColor: tk.primary,
                    border: `1px solid ${tk.inputBorder}`,
                    background: tk.inputBg,
                    borderRadius: tk.borderRadius,
                  }}
                />
              </div>

              {/* Project description */}
              <div className="mb-4">
                <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, opacity: 0.6, letterSpacing: '1px', display: 'block', marginBottom: 6 }}>
                  {isZh ? '项目描述' : 'DESCRIPTION'}
                </label>
                <textarea
                  value={store.projectDescription}
                  onChange={(e) => store.setProjectDescription(e.target.value)}
                  placeholder={isZh ? '描述项目功能与目标...' : 'Describe project features & goals...'}
                  rows={3}
                  className="w-full bg-transparent outline-none px-3 py-2 rounded-lg resize-none neon-scrollbar"
                  style={{
                    fontFamily: tk.fontBody,
                    fontSize: '12px',
                    color: tk.foreground,
                    caretColor: tk.primary,
                    border: `1px solid ${tk.inputBorder}`,
                    background: tk.inputBg,
                    lineHeight: 1.5,
                    borderRadius: tk.borderRadius,
                  }}
                />
              </div>

              {/* Tech stack preview */}
              {(() => {
                const tpl = store.getSelectedTemplate()
                if (!tpl) return null
                return (
                  <div className="mb-4">
                    <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, opacity: 0.6, letterSpacing: '1px', display: 'block', marginBottom: 6 }}>
                      {isZh ? '技术栈' : 'TECH STACK'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 rounded"
                          style={{
                            fontFamily: tk.fontMono,
                            fontSize: '10px',
                            color: tk.primary,
                            background: tk.primaryGlow,
                            border: `1px solid ${tk.border}`,
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* File structure preview */}
              {(() => {
                const tpl = store.getSelectedTemplate()
                if (!tpl) return null

                const renderFilePreview = (nodes: typeof tpl.defaultFiles, depth: number): React.JSX.Element[] => {
                  return nodes.map((node) => (
                    <div key={node.name}>
                      <div style={{ paddingLeft: depth * 14, fontFamily: tk.fontMono, fontSize: '10px', color: node.type === 'folder' ? tk.primary : tk.foregroundMuted, lineHeight: '20px' }}>
                        {node.type === 'folder' ? '📁 ' : '📄 '}{node.name}
                      </div>
                      {node.type === 'folder' && node.children && renderFilePreview(node.children, depth + 1)}
                    </div>
                  ))
                }

                return (
                  <div className="mb-4">
                    <label style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, opacity: 0.6, letterSpacing: '1px', display: 'block', marginBottom: 6 }}>
                      {isZh ? '项目目录结构' : 'FILE STRUCTURE'}
                    </label>
                    <div className="px-3 py-2 rounded-lg overflow-auto neon-scrollbar" style={{ maxHeight: 160, border: `1px solid ${tk.borderDim}`, background: tk.cardBg }}>
                      {renderFilePreview(tpl.defaultFiles, 0)}
                    </div>
                  </div>
                )
              })()}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => store.setStep('template')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{ fontFamily: tk.fontMono, fontSize: '11px', color: tk.primary, border: `1px solid ${tk.border}`, letterSpacing: '1px', borderRadius: tk.borderRadius }}
                >
                  <ChevronLeft size={12} />
                  {isZh ? '返回' : 'BACK'}
                </button>
                <button
                  disabled={!store.projectName.trim()}
                  onClick={() => store.startGeneration()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{
                    fontFamily: tk.fontMono,
                    fontSize: '11px',
                    letterSpacing: '1px',
                    color: store.projectName.trim() ? tk.background : tk.foregroundMuted,
                    background: store.projectName.trim() ? tk.primary : tk.borderDim,
                    border: `1px solid ${store.projectName.trim() ? tk.primary : tk.borderDim}`,
                    cursor: store.projectName.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: store.projectName.trim() && isCyberpunk ? `0 0 12px ${tk.primaryDim}` : 'none',
                    borderRadius: tk.borderRadius,
                  }}
                >
                  <Rocket size={12} />
                  {isZh ? '创建项目' : 'CREATE PROJECT'}
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Generating ===== */}
          {(store.currentStep === 'generating' || store.currentStep === 'done') && (
            <div className="p-6">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                    {store.currentStep === 'done'
                      ? (isZh ? '项目生成完成!' : 'PROJECT GENERATED!')
                      : (isZh ? '正在生成项目...' : 'GENERATING PROJECT...')}
                  </span>
                  <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary }}>
                    {store.generationProgress}%
                  </span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: tk.borderDim }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${store.generationProgress}%`,
                      background: `linear-gradient(90deg, ${tk.primary}, ${tk.success})`,
                      boxShadow: isCyberpunk ? `0 0 8px ${tk.primaryDim}` : 'none',
                      transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </div>
              </div>

              {/* Generation logs */}
              <div
                ref={logRef}
                className="rounded-lg overflow-y-auto neon-scrollbar p-3"
                style={{ height: 200, background: tk.codeBg, border: `1px solid ${tk.borderDim}`, borderRadius: tk.borderRadius }}
              >
                {store.generationLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2" style={{ marginBottom: 4 }}>
                    <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, whiteSpace: 'nowrap' }}>
                      [{String(i + 1).padStart(2, '0')}]
                    </span>
                    <span style={{
                      fontFamily: tk.fontMono,
                      fontSize: '10px',
                      color: log.startsWith('DONE') ? tk.success : log.includes('✓') ? tk.success : tk.primary,
                      lineHeight: 1.5,
                    }}>
                      {log}
                    </span>
                  </div>
                ))}
                {store.currentStep === 'generating' && (
                  <div className="flex items-center gap-1 mt-1">
                    <Loader2 size={10} color={tk.primary} className="animate-spin" />
                    <span style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted }}>
                      {isZh ? '处理中...' : 'Processing...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Design JSON preview (on done) */}
              {store.currentStep === 'done' && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode size={12} color={tk.primary} />
                    <span style={{ fontFamily: tk.fontMono, fontSize: '10px', color: tk.primary, letterSpacing: '1px' }}>
                      DESIGN JSON {isZh ? '已初始化' : 'INITIALIZED'}
                    </span>
                  </div>
                  <div
                    className="rounded-lg p-3 overflow-auto neon-scrollbar"
                    style={{ maxHeight: 120, background: tk.codeBg, border: `1px solid ${tk.borderDim}`, borderRadius: tk.borderRadius }}
                  >
                    <pre style={{ fontFamily: tk.fontMono, fontSize: '9px', color: tk.foregroundMuted, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(
                        {
                          version: store.getActiveProject()?.designJson.version,
                          theme: store.getActiveProject()?.designJson.theme,
                          panels: `[${store.getActiveProject()?.designJson.panels.length} panels]`,
                          components: `[${store.getActiveProject()?.designJson.components.length} components]`,
                          styles: { theme: store.getActiveProject()?.designJson.styles.theme.name },
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              )}

              {/* Done action button */}
              {store.currentStep === 'done' && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      store.closeModal()
                      cyberToast(isZh ? `项目 "${store.projectName}" 已就绪` : `Project "${store.projectName}" is ready`)
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                    style={{
                      fontFamily: tk.fontMono,
                      fontSize: '11px',
                      letterSpacing: '1px',
                      color: tk.background,
                      background: tk.primary,
                      border: `1px solid ${tk.primary}`,
                      boxShadow: isCyberpunk ? `0 0 12px ${tk.primaryDim}` : tk.shadow,
                      borderRadius: tk.borderRadius,
                    }}
                  >
                    <Layers size={12} />
                    {isZh ? '进入项目' : 'ENTER PROJECT'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
