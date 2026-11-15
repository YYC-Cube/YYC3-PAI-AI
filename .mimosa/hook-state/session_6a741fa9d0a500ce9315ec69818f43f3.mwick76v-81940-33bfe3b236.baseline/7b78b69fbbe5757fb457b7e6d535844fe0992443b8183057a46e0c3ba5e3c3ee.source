/**
 * @file project-store.test.ts
 * @description Unit test for project-store
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

import { describe, it, expect, vi, afterEach } from 'vitest'

vi.useFakeTimers()

import { projectStore, PROJECT_TEMPLATES, type CreationStep } from '../project-store'

function s() { return projectStore.getState() }

describe('Project Store — Initial State', () => {
  it('modal should be closed', () => {
    expect(s().modalOpen).toBe(false)
  })

  it('currentStep should be "template"', () => {
    expect(s().currentStep).toBe('template')
  })

  it('selectedTemplateId should be null', () => {
    expect(s().selectedTemplateId).toBeNull()
  })

  it('projectName and description should be empty', () => {
    expect(s().projectName).toBe('')
    expect(s().projectDescription).toBe('')
  })

  it('projects should be an array', () => {
    expect(Array.isArray(s().projects)).toBe(true)
  })

  it('activeProjectId should be null', () => {
    expect(s().activeProjectId).toBeNull()
  })

  it('generationProgress should be 0', () => {
    expect(s().generationProgress).toBe(0)
  })
})

describe('PROJECT_TEMPLATES', () => {
  it('should have at least 5 templates', () => {
    expect(PROJECT_TEMPLATES.length).toBeGreaterThanOrEqual(5)
  })

  it('each template should have required fields', () => {
    for (const t of PROJECT_TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.name.zh).toBeTruthy()
      expect(t.name.en).toBeTruthy()
      expect(t.description.zh).toBeTruthy()
      expect(t.description.en).toBeTruthy()
      expect(t.icon).toBeTruthy()
      expect(Array.isArray(t.techStack)).toBe(true)
      expect(t.techStack.length).toBeGreaterThan(0)
      expect(Array.isArray(t.defaultFiles)).toBe(true)
      expect(t.defaultFiles.length).toBeGreaterThan(0)
      expect(t.designJson).toBeDefined()
      expect(t.designJson.version).toBeTruthy()
    }
  })

  it('should include react-app, dashboard, landing-page, admin-panel, blank', () => {
    const ids = PROJECT_TEMPLATES.map(t => t.id)
    expect(ids).toContain('react-app')
    expect(ids).toContain('dashboard')
    expect(ids).toContain('landing-page')
    expect(ids).toContain('admin-panel')
    expect(ids).toContain('blank')
  })

  it('each template designJson should have panels, components, styles', () => {
    for (const t of PROJECT_TEMPLATES) {
      expect(t.designJson.panels).toBeDefined()
      expect(t.designJson.components).toBeDefined()
      expect(t.designJson.styles).toBeDefined()
    }
  })
})

describe('openModal / closeModal', () => {
  afterEach(() => {
    projectStore.closeModal()
  })

  it('openModal should set modalOpen=true and reset state', () => {
    projectStore.setProjectName('dirty')
    projectStore.openModal()
    expect(s().modalOpen).toBe(true)
    expect(s().currentStep).toBe('template')
    expect(s().selectedTemplateId).toBeNull()
    expect(s().projectName).toBe('')
    expect(s().projectDescription).toBe('')
    expect(s().generationProgress).toBe(0)
    expect(s().generationLogs).toEqual([])
  })

  it('closeModal should set modalOpen=false', () => {
    projectStore.openModal()
    projectStore.closeModal()
    expect(s().modalOpen).toBe(false)
  })
})

describe('setStep', () => {
  it('should update currentStep', () => {
    const steps: CreationStep[] = ['template', 'info', 'generating', 'done']
    for (const step of steps) {
      projectStore.setStep(step)
      expect(s().currentStep).toBe(step)
    }
  })
})

describe('selectTemplate', () => {
  it('should set selectedTemplateId', () => {
    projectStore.selectTemplate('react-app')
    expect(s().selectedTemplateId).toBe('react-app')
  })

  it('getSelectedTemplate should return matching template', () => {
    projectStore.selectTemplate('dashboard')
    const t = projectStore.getSelectedTemplate()
    expect(t).not.toBeNull()
    expect(t!.id).toBe('dashboard')
    expect(t!.name.en).toBe('Data Dashboard')
  })

  it('getSelectedTemplate should return null when nothing selected', () => {
    projectStore.selectTemplate('nonexistent')
    // Technically it sets the id, but getSelectedTemplate won't find it
    const t = projectStore.getSelectedTemplate()
    expect(t).toBeNull()
  })
})

describe('setProjectName / setProjectDescription', () => {
  it('should update projectName', () => {
    projectStore.setProjectName('My App')
    expect(s().projectName).toBe('My App')
  })

  it('should update projectDescription', () => {
    projectStore.setProjectDescription('A cool app')
    expect(s().projectDescription).toBe('A cool app')
  })
})

describe('startGeneration', () => {
  afterEach(() => {
    projectStore.closeModal()
  })

  it('should not start without a selected template', () => {
    projectStore.openModal()
    projectStore.startGeneration()
    // No template selected → nothing happens
    expect(s().currentStep).toBe('template')
  })

  it('should start generation with valid template', () => {
    projectStore.openModal()
    projectStore.selectTemplate('blank')
    projectStore.setProjectName('Test Project')
    projectStore.startGeneration()
    expect(s().currentStep).toBe('generating')
    expect(s().generationProgress).toBe(0)
  })

  it('generation should progress through steps', () => {
    projectStore.openModal()
    projectStore.selectTemplate('blank')
    projectStore.setProjectName('Gen Test')
    projectStore.startGeneration()

    // Advance timers to simulate generation
    vi.advanceTimersByTime(400) // step 1
    expect(s().generationProgress).toBe(10)

    vi.advanceTimersByTime(400) // step 2
    expect(s().generationProgress).toBe(25)

    vi.advanceTimersByTime(400) // step 3
    expect(s().generationProgress).toBe(35)
  })

  it('generation should complete and create project', () => {
    projectStore.openModal()
    projectStore.selectTemplate('react-app')
    projectStore.setProjectName('Complete Test')
    projectStore.setProjectDescription('A test project')
    projectStore.startGeneration()

    // Advance through all 9 steps + completion
    vi.advanceTimersByTime(400 * 10)

    expect(s().currentStep).toBe('done')
    expect(s().generationProgress).toBe(100)
    expect(s().projects.length).toBeGreaterThan(0)

    const project = s().projects[s().projects.length - 1]
    expect(project.name).toBe('Complete Test')
    expect(project.description).toBe('A test project')
    expect(project.templateId).toBe('react-app')
    expect(project.status).toBe('active')
    expect(project.fileTree.length).toBeGreaterThan(0)
    expect(project.designJson).toBeDefined()
  })

  it('should use template name if projectName is empty', () => {
    projectStore.openModal()
    projectStore.selectTemplate('dashboard')
    projectStore.setProjectName('')
    projectStore.startGeneration()

    vi.advanceTimersByTime(400 * 10)

    const project = s().projects[s().projects.length - 1]
    expect(project.name).toBe('Data Dashboard')
  })

  it('generation logs should accumulate', () => {
    projectStore.openModal()
    projectStore.selectTemplate('blank')
    projectStore.startGeneration()

    vi.advanceTimersByTime(400 * 5)
    expect(s().generationLogs.length).toBeGreaterThanOrEqual(5)
    expect(s().generationLogs[0]).toContain('INIT')
  })

  it('closeModal should cancel in-progress generation', () => {
    projectStore.openModal()
    projectStore.selectTemplate('blank')
    projectStore.startGeneration()
    vi.advanceTimersByTime(400 * 3)
    const progressBefore = s().generationProgress

    projectStore.closeModal()
    vi.advanceTimersByTime(400 * 10)

    // Progress should not have changed after close
    expect(s().generationProgress).toBe(progressBefore)
  })
})

describe('setActiveProject / getActiveProject', () => {
  afterEach(() => {
    projectStore.closeModal()
  })

  it('getActiveProject should return null when no active project', () => {
    projectStore.setActiveProject(null)
    expect(projectStore.getActiveProject()).toBeNull()
  })

  it('setActiveProject should update activeProjectId', () => {
    // Create a project first
    projectStore.openModal()
    projectStore.selectTemplate('blank')
    projectStore.setProjectName('Active Test')
    projectStore.startGeneration()
    vi.advanceTimersByTime(400 * 10)

    const project = s().projects[s().projects.length - 1]
    projectStore.setActiveProject(project.id)
    expect(s().activeProjectId).toBe(project.id)
    expect(projectStore.getActiveProject()).not.toBeNull()
    expect(projectStore.getActiveProject()!.name).toBe('Active Test')
  })

  it('getActiveProject should return null for invalid id', () => {
    projectStore.setActiveProject('nonexistent')
    expect(projectStore.getActiveProject()).toBeNull()
  })
})

describe('ProjectInfo interface', () => {
  it('should have correct shape when created', () => {
    projectStore.openModal()
    projectStore.selectTemplate('admin-panel')
    projectStore.setProjectName('Admin')
    projectStore.startGeneration()
    vi.advanceTimersByTime(400 * 10)

    const project = s().projects[s().projects.length - 1]
    expect(project.id).toMatch(/^proj-/)
    expect(project.templateId).toBe('admin-panel')
    expect(project.techStack.length).toBeGreaterThan(0)
    expect(project.createdAt).toBeTruthy()
    expect(project.updatedAt).toBeTruthy()
    expect(project.status).toBe('active')
    expect(Array.isArray(project.fileTree)).toBe(true)
    expect(project.designJson).toHaveProperty('version')
    expect(project.designJson).toHaveProperty('panels')
    expect(project.designJson).toHaveProperty('components')
    expect(project.designJson).toHaveProperty('styles')

    projectStore.closeModal()
  })
})
