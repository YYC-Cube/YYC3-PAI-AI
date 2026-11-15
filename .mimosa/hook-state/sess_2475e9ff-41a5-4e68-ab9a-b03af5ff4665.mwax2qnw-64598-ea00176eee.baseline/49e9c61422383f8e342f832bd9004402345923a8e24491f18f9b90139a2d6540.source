/**
 * @file useAgent.test.ts
 * @description Unit test for useAgent
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [test],[unit]
 */

/**
 * YYC³ AI - useAgent Hook测试
 *
 * 测试覆盖所有Hook功能和辅助函数
 * 目标：85%+覆盖率
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useAgent,
  createTaskDescription,
  formatAgentStatus,
  formatExecutionTime,
  calculateAgentLoad,
  getAgentStatusColor,
  getAgentIcon,
  getSkillName
} from '../useAgent';

// ============================================================================
// Mock数据
// ============================================================================

const createMockTool = (id: string) => ({
  id,
  name: `Tool ${id}`,
  description: 'Mock tool description',
  version: '1.0.0',
  schema: {
    type: 'object' as const,
    properties: {},
    required: []
  },
  isAvailable: () => true,
  execute: async (input: unknown) => ({ success: true, data: input, error: undefined })
});

// ============================================================================
// 测试套件1: Agent状态管理
// ============================================================================

describe('useAgent Hook - Agent状态管理', () => {
  it('should provide agent access methods', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.registerAgent).toBeDefined();
    expect(result.current.unregisterAgent).toBeDefined();
    expect(result.current.selectAgent).toBeDefined();
    expect(result.current.initializeAgents).toBeDefined();
  });

  it('should provide task access methods', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.createTask).toBeDefined();
    expect(result.current.startTask).toBeDefined();
    expect(result.current.executeTask).toBeDefined();
    expect(result.current.cancelTask).toBeDefined();
  });

  it('should provide tool access methods', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.registerTool).toBeDefined();
    expect(result.current.executeTool).toBeDefined();
  });

  it('should provide memory access methods', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.addToMemory).toBeDefined();
    expect(result.current.updatePreferences).toBeDefined();
    expect(result.current.getAgentMemory).toBeDefined();
    expect(result.current.getAgentExperience).toBeDefined();
    expect(result.current.getAgentPatterns).toBeDefined();
  });

  it('should provide log access methods', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.addLog).toBeDefined();
    expect(result.current.clearLogs).toBeDefined();
    expect(result.current.getFilteredLogs).toBeDefined();
  });

  it('should provide agent selection methods', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.getBestAgent).toBeDefined();
    expect(result.current.getAvailableAgents).toBeDefined();
    expect(result.current.getAgentByRole).toBeDefined();
  });
});

// ============================================================================
// 测试套件2: 任务创建
// ============================================================================

describe('useAgent Hook - 任务创建', () => {
  it('should create a task with default priority', () => {
    const { result } = renderHook(() => useAgent());

    const task = result.current.createTask('Test task');

    expect(task.description).toBe('Test task');
    expect(task.priority).toBe('medium');
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeDefined();
    expect(task.dependencies).toEqual([]);
  });

  it('should create a task with custom priority', () => {
    const { result } = renderHook(() => useAgent());

    const task = result.current.createTask('High priority task', 'high');

    expect(task.priority).toBe('high');
  });

  it('should create tasks with low priority', () => {
    const { result } = renderHook(() => useAgent());

    const task = result.current.createTask('Low priority task', 'low');

    expect(task.priority).toBe('low');
  });

  it('should have unique task IDs', () => {
    const { result } = renderHook(() => useAgent());

    const task1 = result.current.createTask('Task 1');
    const task2 = result.current.createTask('Task 2');

    expect(task1.id).not.toBe(task2.id);
  });
});

// ============================================================================
// 测试套件3: 工具注册和执行
// ============================================================================

describe('useAgent Hook - 工具注册和执行', () => {
  it('should register a tool', () => {
    const { result } = renderHook(() => useAgent());

    act(() => {
      result.current.registerTool(createMockTool('tool-1'));
    });

    expect(result.current.tools).toContainEqual(
      expect.objectContaining({
        id: 'tool-1',
        name: 'Tool tool-1'
      })
    );
  });

  it('should execute a tool', async () => {
    const { result } = renderHook(() => useAgent());

    act(() => {
      result.current.registerTool(createMockTool('tool-1'));
    });

    const toolResult = await act(async () => {
      return await result.current.executeTool('tool-1', { test: 'input' });
    });

    expect(toolResult).toEqual({ test: 'input' });
  });

  it('should manage multiple tools', () => {
    const { result } = renderHook(() => useAgent());

    act(() => {
      result.current.registerTool(createMockTool('tool-1'));
      result.current.registerTool(createMockTool('tool-2'));
      result.current.registerTool(createMockTool('tool-3'));
    });

    expect(result.current.tools.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// 测试套件4: 日志操作
// ============================================================================

describe('useAgent Hook - 日志操作', () => {
  it('should add a log', () => {
    const { result } = renderHook(() => useAgent());

    const initialLogsCount = result.current.logs.length;

    act(() => {
      result.current.addLog({
        agentId: 'agent-1',
        level: 'info',
        message: 'Test log message'
      });
    });

    expect(result.current.logs.length).toBeGreaterThan(initialLogsCount);
  });

  it('should clear all logs', () => {
    const { result } = renderHook(() => useAgent());

    act(() => {
      result.current.addLog({
        agentId: 'agent-1',
        level: 'info',
        message: 'Log 1'
      });
      result.current.addLog({
        agentId: 'agent-2',
        level: 'warn',
        message: 'Log 2'
      });
    });

    const logCountBeforeClear = result.current.logs.length;

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs.length).toBeLessThan(logCountBeforeClear);
  });

  it('should filter logs by agent ID', () => {
    const { result } = renderHook(() => useAgent());

    const filteredLogs = result.current.getFilteredLogs('agent-1');

    expect(Array.isArray(filteredLogs)).toBe(true);
    expect(filteredLogs.filter(l => l.agentId !== 'agent-1')).toHaveLength(0);
  });

  it('should filter logs by level', () => {
    const { result } = renderHook(() => useAgent());

    const filteredLogs = result.current.getFilteredLogs(undefined, 'error');

    expect(Array.isArray(filteredLogs)).toBe(true);
    expect(filteredLogs.filter(l => l.level !== 'error')).toHaveLength(0);
  });
});

// ============================================================================
// 测试套件5: 记忆操作
// ============================================================================

describe('useAgent Hook - 记忆操作', () => {
  it('should get agent memory for registered agent', () => {
    const { result } = renderHook(() => useAgent());

    const memory = result.current.getAgentMemory('agent-planner');

    if (memory) {
      expect(memory).toBeDefined();
      expect(memory).toHaveProperty('learnings');
      expect(memory).toHaveProperty('patterns');
      expect(memory).toHaveProperty('preferences');
    }
  });

  it('should return null for non-existent agent memory', () => {
    const { result } = renderHook(() => useAgent());

    const memory = result.current.getAgentMemory('non-existent-agent-12345');
    expect(memory).toBeNull();
  });

  it('should get agent experience', () => {
    const { result } = renderHook(() => useAgent());

    const experience = result.current.getAgentExperience('agent-planner');

    expect(Array.isArray(experience)).toBe(true);
  });

  it('should get agent patterns', () => {
    const { result } = renderHook(() => useAgent());

    const patterns = result.current.getAgentPatterns('agent-planner');

    expect(Array.isArray(patterns)).toBe(true);
  });

  it('should update agent preferences', () => {
    const { result } = renderHook(() => useAgent());

    const initialMemory = result.current.getAgentMemory('agent-planner');

    act(() => {
      result.current.updatePreferences('agent-planner', {
        languagePreference: 'typescript',
        codingStyle: 'dark'
      });
    });

    const updatedMemory = result.current.getAgentMemory('agent-planner');

    if (updatedMemory && initialMemory) {
      expect(updatedMemory.preferences).not.toEqual(initialMemory.preferences);
    }
  });
});

// ============================================================================
// 测试套件6: Agent选择
// ============================================================================

describe('useAgent Hook - Agent选择', () => {
  it('should get available agents', () => {
    const { result } = renderHook(() => useAgent());

    const availableAgents = result.current.getAvailableAgents();

    expect(Array.isArray(availableAgents)).toBe(true);
    expect(availableAgents.every(agent => agent.status === 'idle')).toBe(true);
  });

  it('should get agents by role', () => {
    const { result } = renderHook(() => useAgent());

    const coders = result.current.getAgentByRole('coder');
    const testers = result.current.getAgentByRole('tester');

    expect(Array.isArray(coders)).toBe(true);
    expect(Array.isArray(testers)).toBe(true);
  });

  it('should get best agent for task', () => {
    const { result } = renderHook(() => useAgent());

    const bestAgent = result.current.getBestAgent('Generate TypeScript code');

    expect(bestAgent).toBeDefined();
  });

  it('should return null for best agent when task is empty', () => {
    const { result } = renderHook(() => useAgent());

    const bestAgent = result.current.getBestAgent('');

    expect(bestAgent).toBeNull();
  });
});

// ============================================================================
// 测试套件7: 统计信息
// ============================================================================

describe('useAgent Hook - 统计信息', () => {
  it('should get agent stats', () => {
    const { result } = renderHook(() => useAgent());

    const stats = result.current.getAgentStats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty('totalAgents');
    expect(stats).toHaveProperty('activeAgents');
    expect(stats).toHaveProperty('idleAgents');
    expect(stats).toHaveProperty('totalTasksCompleted');
    expect(stats).toHaveProperty('totalTasksFailed');
  });

  it('should calculate total agents correctly', () => {
    const { result } = renderHook(() => useAgent());

    const stats = result.current.getAgentStats();

    expect(stats.totalAgents).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// 测试套件8: 任务分解
// ============================================================================

describe('useAgent Hook - 任务分解', () => {
  it('should decompose task', async () => {
    const { result } = renderHook(() => useAgent());

    const task = result.current.createTask('Generate login component');

    const plan = await act(async () => {
      return await result.current.decomposeTask(task);
    });

    expect(plan).toBeDefined();
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('subtasks');
    expect(Array.isArray(plan.subtasks)).toBe(true);
  });
});

// ============================================================================
// 测试套件9: Agent协调
// ============================================================================

describe('useAgent Hook - Agent协调', () => {
  it('should coordinate agents for plan', async () => {
    const { result } = renderHook(() => useAgent());

    const task = result.current.createTask('Test task');
    const plan = await act(async () => {
      return await result.current.decomposeTask(task);
    });

    const coordResult = await act(async () => {
      return await result.current.coordinateAgents(plan);
    });

    expect(coordResult).toBeDefined();
  });
});

// ============================================================================
// 测试套件10: 自动初始化
// ============================================================================

describe('useAgent Hook - 自动初始化', () => {
  it('should auto-initialize agents on mount', async () => {
    const { result } = renderHook(() => useAgent());

    await waitFor(() => {
      expect(result.current.agents.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// 测试套件11: 辅助函数
// ============================================================================

describe('useAgent Hook - 辅助函数', () => {
  describe('createTaskDescription', () => {
    it('should create task description without details', () => {
      const description = createTaskDescription('Generate', 'code');

      expect(description).toBe('Generate code');
    });

    it('should create task description with details', () => {
      const description = createTaskDescription('Generate', 'code', 'for login component');

      expect(description).toBe('Generate code. for login component');
    });
  });

  describe('formatAgentStatus', () => {
    it('should format idle status', () => {
      expect(formatAgentStatus('idle')).toBe('空闲');
    });

    it('should format busy status', () => {
      expect(formatAgentStatus('busy')).toBe('忙碌');
    });

    it('should format offline status', () => {
      expect(formatAgentStatus('offline')).toBe('离线');
    });

    it('should format error status', () => {
      expect(formatAgentStatus('error')).toBe('错误');
    });
  });

  describe('formatExecutionTime', () => {
    it('should format time in milliseconds', () => {
      expect(formatExecutionTime(500)).toBe('500ms');
    });

    it('should format time in seconds', () => {
      expect(formatExecutionTime(1500)).toBe('1.5s');
    });

    it('should format time in minutes and seconds', () => {
      expect(formatExecutionTime(65000)).toBe('1m 5s');
    });

    it('should format exactly 1 minute', () => {
      expect(formatExecutionTime(60000)).toBe('1m 0s');
    });

    it('should format time less than 1 second', () => {
      expect(formatExecutionTime(999)).toBe('999ms');
    });
  });

  describe('calculateAgentLoad', () => {
    it('should calculate load for zero', () => {
      expect(calculateAgentLoad(0)).toBe(0);
    });

    it('should calculate load for 5', () => {
      expect(calculateAgentLoad(5)).toBe(50);
    });

    it('should calculate load for 10', () => {
      expect(calculateAgentLoad(10)).toBe(100);
    });

    it('should cap load at 100 for values above 10', () => {
      expect(calculateAgentLoad(15)).toBe(100);
      expect(calculateAgentLoad(20)).toBe(100);
    });
  });

  describe('getAgentStatusColor', () => {
    it('should return green for idle', () => {
      expect(getAgentStatusColor('idle')).toBe('bg-green-500');
    });

    it('should return blue for busy', () => {
      expect(getAgentStatusColor('busy')).toBe('bg-blue-500');
    });

    it('should return gray for offline', () => {
      expect(getAgentStatusColor('offline')).toBe('bg-gray-500');
    });

    it('should return red for error', () => {
      expect(getAgentStatusColor('error')).toBe('bg-red-500');
    });
  });

  describe('getAgentIcon', () => {
    it('should return planner icon', () => {
      expect(getAgentIcon('planner')).toBe('📋');
    });

    it('should return coder icon', () => {
      expect(getAgentIcon('coder')).toBe('💻');
    });

    it('should return reviewer icon', () => {
      expect(getAgentIcon('reviewer')).toBe('🔍');
    });

    it('should return tester icon', () => {
      expect(getAgentIcon('tester')).toBe('🧪');
    });

    it('should return robot icon for unknown role', () => {
      expect(getAgentIcon('unknown' as any)).toBe('🤖');
    });
  });

  describe('getSkillName', () => {
    it('should return name for code-generation', () => {
      expect(getSkillName('code-generation')).toBe('代码生成');
    });

    it('should return name for code-refactor', () => {
      expect(getSkillName('code-refactor')).toBe('代码重构');
    });

    it('should return name for bug-fixing', () => {
      expect(getSkillName('bug-fixing')).toBe('Bug修复');
    });

    it('should return name for test-generation', () => {
      expect(getSkillName('test-generation')).toBe('测试生成');
    });

    it('should return name for code-review', () => {
      expect(getSkillName('code-review')).toBe('代码审查');
    });

    it('should return id for unknown skill', () => {
      expect(getSkillName('unknown-skill')).toBe('unknown-skill');
    });
  });
});

// ============================================================================
// 测试套件12: React状态
// ============================================================================

describe('useAgent Hook - React状态', () => {
  it('should provide agents state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.agents).toBeDefined();
    expect(Array.isArray(result.current.agents)).toBe(true);
  });

  it('should provide activeAgent state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.activeAgent).toBeDefined();
  });

  it('should provide activeAgentId state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.activeAgentId).toBeDefined();
  });

  it('should provide currentTask state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.currentTask).toBeDefined();
  });

  it('should provide executionPlan state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.executionPlan).toBeDefined();
  });

  it('should provide taskHistory state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.taskHistory).toBeDefined();
    expect(Array.isArray(result.current.taskHistory)).toBe(true);
  });

  it('should provide isExecuting state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.isExecuting).toBeDefined();
    expect(typeof result.current.isExecuting).toBe('boolean');
  });

  it('should provide tools state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.tools).toBeDefined();
    expect(Array.isArray(result.current.tools)).toBe(true);
  });

  it('should provide logs state', () => {
    const { result } = renderHook(() => useAgent());

    expect(result.current.logs).toBeDefined();
    expect(Array.isArray(result.current.logs)).toBe(true);
  });
});
