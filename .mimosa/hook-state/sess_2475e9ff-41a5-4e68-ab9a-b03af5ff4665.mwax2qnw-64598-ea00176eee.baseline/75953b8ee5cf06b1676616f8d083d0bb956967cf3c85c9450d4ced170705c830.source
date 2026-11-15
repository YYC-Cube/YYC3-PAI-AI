/**
 * @file useAgent.ts
 * @description AI Agent 系统核心 Hook · 封装 agent-store 高级接口 · PDA+记忆+反思架构
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-04-08
 * @updated 2026-05-06
 * @status active
 * @tags [hook],[agent],[ai],[pda]
 *
 * @module hooks/useAgent
 */

import { useCallback, useEffect, useState } from 'react';
import {
  useAgentStore,
  type Agent,
  type AgentStatus,
  type ComplexTask,
  type SubTask,
  type ExecutionPlan,
  type CollaborationResult,
  type AgentLog,
  type MCPTool,
  type UserPreferences,
  type Experience,
  type SkillResult,
  type LearnedPattern,
  initializeDefaultAgents,
} from '../store/agent-store';

// ============================================================================
// Hook返回类型
// ============================================================================

export interface UseAgentReturn {
  // Agent状态
  agents: Agent[];
  activeAgent: Agent | null;
  activeAgentId: string | null;

  // 任务状态
  currentTask: ComplexTask | null;
  executionPlan: ExecutionPlan | null;
  taskHistory: ComplexTask[];
  isExecuting: boolean;

  // 工具状态
  tools: MCPTool[];

  // 日志状态
  logs: AgentLog[];

  // Agent操作
  initializeAgents: () => void;
  registerAgent: (agent: Omit<Agent, 'stats'>) => void;
  unregisterAgent: (agentId: string) => void;
  selectAgent: (agentId: string) => void;

  // 任务操作
  createTask: (description: string, priority?: ComplexTask['priority']) => ComplexTask;
  startTask: (task: ComplexTask) => Promise<void>;
  executeTask: (agentId: string, subtask: SubTask) => Promise<SkillResult>;
  cancelTask: (taskId: string) => void;

  // 工具操作
  registerTool: (tool: MCPTool) => void;
  executeTool: (toolId: string, input: unknown) => Promise<unknown>;

  // 记忆操作
  addToMemory: (agentId: string, experience: Experience) => void;
  updatePreferences: (agentId: string, preferences: Partial<UserPreferences>) => void;
  getAgentMemory: (agentId: string) => Agent['memory'] | null;
  getAgentExperience: (agentId: string) => Experience[];
  getAgentPatterns: (agentId: string) => LearnedPattern[];

  // 日志操作
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  getFilteredLogs: (agentId?: string, level?: AgentLog['level']) => AgentLog[];

  // Agent选择
  getBestAgent: (task: string) => Agent | null;
  getAvailableAgents: () => Agent[];
  getAgentByRole: (role: Agent['role']) => Agent[];

  // 任务分解
  decomposeTask: (task: ComplexTask) => Promise<ExecutionPlan>;

  // Agent协调
  coordinateAgents: (plan: ExecutionPlan) => Promise<CollaborationResult>;

  // 统计信息
  getAgentStats: () => {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
  };
}

// ============================================================================
// useAgent Hook实现
// ============================================================================

/**
 * useAgent Hook
 *
 * AI Agent系统核心Hook,封装所有Agent相关功能
 */
export const useAgent = (): UseAgentReturn => {
  const store = useAgentStore();

  const [isExecuting, setIsExecuting] = useState(false);

  // -------------------------------------------------------------------------
  // 初始化
  // -------------------------------------------------------------------------

  /**
   * 初始化默认Agents
   */
  const initializeAgents = useCallback(() => {
    initializeDefaultAgents();
  }, []);

  // -------------------------------------------------------------------------
  // Agent操作
  // -------------------------------------------------------------------------

  /**
   * 注册Agent
   */
  const registerAgent = useCallback((agent: Omit<Agent, 'stats'>) => {
    store.registerAgent(agent);
  }, [store]);

  /**
   * 注销Agent
   */
  const unregisterAgent = useCallback((agentId: string) => {
    store.unregisterAgent(agentId);
  }, [store]);

  /**
   * 选择Agent
   */
  const selectAgent = useCallback((agentId: string) => {
    store.selectAgent(agentId);
  }, [store]);

  // -------------------------------------------------------------------------
  // 任务操作
  // -------------------------------------------------------------------------

  /**
   * 创建任务
   */
  const createTask = useCallback((
    description: string,
    priority: ComplexTask['priority'] = 'medium'
  ): ComplexTask => {
    const task: ComplexTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description,
      priority,
      createdAt: Date.now(),
      dependencies: []
    };
    return task;
  }, []);

  /**
   * 启动任务
   */
  const startTask = useCallback(async (task: ComplexTask) => {
    setIsExecuting(true);
    try {
      await store.startTask(task);
    } finally {
      setIsExecuting(false);
    }
  }, [store]);

  /**
   * 执行子任务
   */
  const executeTask = useCallback(async (
    agentId: string,
    subtask: SubTask
  ): Promise<SkillResult> => {
    const result = await store.executeTask(agentId, subtask);
    return {
      success: result.success,
      data: result.result,
      error: result.error,
      metadata: { executionTime: result.executionTime }
    };
  }, [store]);

  /**
   * 取消任务
   */
  const cancelTask = useCallback((taskId: string) => {
    store.cancelTask(taskId);
  }, [store]);

  // -------------------------------------------------------------------------
  // 工具操作
  // -------------------------------------------------------------------------

  /**
   * 注册工具
   */
  const registerTool = useCallback((tool: MCPTool) => {
    store.registerTool(tool);
  }, [store]);

  /**
   * 执行工具
   */
  const executeTool = useCallback(async (
    toolId: string,
    input: unknown
  ): Promise<unknown> => {
    const result = await store.executeTool(toolId, input);
    return result.data;
  }, [store]);

  // -------------------------------------------------------------------------
  // 记忆操作
  // -------------------------------------------------------------------------

  /**
   * 添加到记忆
   */
  const addToMemory = useCallback((agentId: string, experience: Experience) => {
    store.addToMemory(agentId, experience);
  }, [store]);

  /**
   * 更新偏好
   */
  const updatePreferences = useCallback((
    agentId: string,
    preferences: Partial<UserPreferences>
  ) => {
    store.updatePreferences(agentId, preferences);
  }, [store]);

  /**
   * 获取Agent记忆
   */
  const getAgentMemory = useCallback((agentId: string): Agent['memory'] | null => {
    const agent = store.agents.find((a) => a.id === agentId);
    return agent ? agent.memory : null;
  }, [store.agents]);

  /**
   * 获取Agent经验
   */
  const getAgentExperience = useCallback((agentId: string): Experience[] => {
    const memory = getAgentMemory(agentId);
    return memory ? memory.learnings : [];
  }, [getAgentMemory]);

  /**
   * 获取Agent模式
   */
  const getAgentPatterns = useCallback((agentId: string): LearnedPattern[] => {
    const memory = getAgentMemory(agentId);
    return memory ? memory.patterns : [];
  }, [getAgentMemory]);

  // -------------------------------------------------------------------------
  // 日志操作
  // -------------------------------------------------------------------------

  /**
   * 添加日志
   */
  const addLog = useCallback((log: Omit<AgentLog, 'id' | 'timestamp'>) => {
    store.addLog(log);
  }, [store]);

  /**
   * 清空日志
   */
  const clearLogs = useCallback(() => {
    store.clearLogs();
  }, [store]);

  /**
   * 获取过滤后的日志
   */
  const getFilteredLogs = useCallback((
    agentId?: string,
    level?: AgentLog['level']
  ): AgentLog[] => {
    let filteredLogs = store.logs;

    if (agentId) {
      filteredLogs = filteredLogs.filter((log) => log.agentId === agentId);
    }

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    return filteredLogs;
  }, [store.logs]);

  // -------------------------------------------------------------------------
  // Agent选择
  // -------------------------------------------------------------------------

  /**
   * 获取最佳Agent
   */
  const getBestAgent = useCallback((task: string): Agent | null => {
    return store.getBestAgent(task);
  }, [store]);

  /**
   * 获取可用Agents
   */
  const getAvailableAgents = useCallback((): Agent[] => {
    return store.agents.filter((a) => a.status === 'idle');
  }, [store.agents]);

  /**
   * 根据角色获取Agents
   */
  const getAgentByRole = useCallback((role: Agent['role']): Agent[] => {
    return store.agents.filter((a) => a.role === role);
  }, [store.agents]);

  // -------------------------------------------------------------------------
  // 任务分解
  // -------------------------------------------------------------------------

  /**
   * 分解任务
   */
  const decomposeTask = useCallback(async (task: ComplexTask): Promise<ExecutionPlan> => {
    return await store.decomposeTask(task);
  }, [store]);

  // -------------------------------------------------------------------------
  // Agent协调
  // -------------------------------------------------------------------------

  /**
   * 协调Agents
   */
  const coordinateAgents = useCallback(async (plan: ExecutionPlan): Promise<CollaborationResult> => {
    return await store.coordinateAgents(plan);
  }, [store]);

  // -------------------------------------------------------------------------
  // 统计信息
  // -------------------------------------------------------------------------

  /**
   * 获取Agent统计
   */
  const getAgentStats = useCallback(() => {
    const totalAgents = store.agents.length;
    const activeAgents = store.agents.filter((a) => a.status === 'busy').length;
    const idleAgents = store.agents.filter((a) => a.status === 'idle').length;

    const totalTasksCompleted = store.agents.reduce(
      (sum, a) => sum + a.stats.tasksCompleted,
      0
    );

    const totalTasksFailed = store.agents.reduce(
      (sum, a) => sum + a.stats.tasksFailed,
      0
    );

    return {
      totalAgents,
      activeAgents,
      idleAgents,
      totalTasksCompleted,
      totalTasksFailed
    };
  }, [store.agents]);

  // -------------------------------------------------------------------------
  // 响应式数据
  // -------------------------------------------------------------------------

  const activeAgent = store.agents.find((a) => a.id === store.activeAgentId) || null;

  // -------------------------------------------------------------------------
  // 初始化
  // -------------------------------------------------------------------------

  useEffect(() => {
    // 如果没有agents,初始化默认agents
    if (store.agents.length === 0) {
      initializeAgents();
    }
  }, [initializeAgents, store.agents.length]);

  // -------------------------------------------------------------------------
  // 返回值
  // -------------------------------------------------------------------------

  return {
    // Agent状态
    agents: store.agents,
    activeAgent,
    activeAgentId: store.activeAgentId,

    // 任务状态
    currentTask: store.currentTask,
    executionPlan: store.executionPlan,
    taskHistory: store.taskHistory,
    isExecuting,

    // 工具状态
    tools: store.tools,

    // 日志状态
    logs: store.logs,

    // Agent操作
    initializeAgents,
    registerAgent,
    unregisterAgent,
    selectAgent,

    // 任务操作
    createTask,
    startTask,
    executeTask,
    cancelTask,

    // 工具操作
    registerTool,
    executeTool,

    // 记忆操作
    addToMemory,
    updatePreferences,
    getAgentMemory,
    getAgentExperience,
    getAgentPatterns,

    // 日志操作
    addLog,
    clearLogs,
    getFilteredLogs,

    // Agent选择
    getBestAgent,
    getAvailableAgents,
    getAgentByRole,

    // 任务分解
    decomposeTask,

    // Agent协调
    coordinateAgents,

    // 统计信息
    getAgentStats
  };
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建任务描述
 */
export const createTaskDescription = (
  action: string,
  subject: string,
  details?: string
): string => {
  let description = `${action} ${subject}`;
  if (details) {
    description += `. ${details}`;
  }
  return description;
};

/**
 * 格式化Agent状态
 */
export const formatAgentStatus = (status: AgentStatus): string => {
  const statusMap: Record<AgentStatus, string> = {
    idle: '空闲',
    busy: '忙碌',
    offline: '离线',
    error: '错误'
  };
  return statusMap[status] || status;
};

/**
 * 格式化执行时间
 */
export const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * 计算Agent负载百分比
 */
export const calculateAgentLoad = (currentLoad: number): number => {
  return Math.min((currentLoad / 10) * 100, 100);
};

/**
 * 获取Agent状态颜色
 */
export const getAgentStatusColor = (status: AgentStatus): string => {
  const colorMap: Record<AgentStatus, string> = {
    idle: 'bg-green-500',
    busy: 'bg-blue-500',
    offline: 'bg-gray-500',
    error: 'bg-red-500'
  };
  return colorMap[status] || 'bg-gray-500';
};

/**
 * 获取Agent图标
 */
export const getAgentIcon = (role: Agent['role']): string => {
  const iconMap: Record<Agent['role'], string> = {
    planner: '📋',
    coder: '💻',
    reviewer: '🔍',
    tester: '🧪'
  };
  return iconMap[role] || '🤖';
};

/**
 * 获取Skill名称
 */
export const getSkillName = (skillId: string): string => {
  const nameMap: Record<string, string> = {
    'code-generation': '代码生成',
    'code-refactor': '代码重构',
    'bug-fixing': 'Bug修复',
    'test-generation': '测试生成',
    'code-review': '代码审查'
  };
  return nameMap[skillId] || skillId;
};
