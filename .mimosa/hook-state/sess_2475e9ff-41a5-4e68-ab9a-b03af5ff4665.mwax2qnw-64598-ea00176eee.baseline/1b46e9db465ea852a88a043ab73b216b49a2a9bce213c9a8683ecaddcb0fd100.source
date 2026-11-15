/**
 * @file agent-store.ts
 * @description AI Agent 工作流系统核心状态管理 · PDA+记忆+反思架构 · 多Agent协作
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-04-08
 * @updated 2026-05-06
 * @status active
 * @tags [store],[agent],[ai],[workflow]
 *
 * @module store/agent-store
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { produce } from 'immer';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Agent角色类型
 */
export type AgentRole = 'planner' | 'coder' | 'reviewer' | 'tester';

/**
 * Agent状态
 */
export type AgentStatus = 'idle' | 'busy' | 'offline' | 'error';

/**
 * Agent能力(Skill)
 */
export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  execute: (input: unknown) => Promise<SkillResult>;
  requiredTools: string[];
  canHandle: (task: string) => number; // 返回置信度0-1
}

/**
 * 技能执行结果
 */
export interface SkillResult {
  success: boolean;
  data: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Agent记忆
 */
export interface AgentMemory {
  context: ConversationContext[];
  learnings: Experience[];
  preferences: UserPreferences;
  patterns: LearnedPattern[];
}

/**
 * 对话上下文
 */
export interface ConversationContext {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 经验
 */
export interface Experience {
  task: string;
  approach: string;
  outcome: 'success' | 'failure' | 'partial';
  timestamp: number;
  feedback?: string;
  learnings: string[];
}

/**
 * 用户偏好
 */
export interface UserPreferences {
  codingStyle: string;
  frameworkPreference: string[];
  languagePreference: string;
  autoOptimize: boolean;
  verboseMode: boolean;
}

/**
 * 学习到的模式
 */
export interface LearnedPattern {
  id: string;
  pattern: string;
  frequency: number;
  lastUsed: number;
  successRate: number;
}

/**
 * MCP工具
 */
export interface MCPTool {
  id: string;
  name: string;
  description: string;
  schema: {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties: Record<string, unknown>;
    required: string[];
  };
  execute: (input: unknown) => Promise<ToolOutput>;
  isAvailable: () => boolean;
}

/**
 * 工具输出
 */
export interface ToolOutput {
  success: boolean;
  data: unknown;
  error?: string;
}

/**
 * Agent实体
 */
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: string[];
  currentLoad: number;
  status: AgentStatus;
  skills: AgentSkill[];
  memory: AgentMemory;
  stats: {
    tasksCompleted: number;
    tasksFailed: number;
    avgExecutionTime: number;
    lastActive: number;
  };
}

/**
 * 复杂任务
 */
export interface ComplexTask {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  deadline?: number;
  dependencies: string[];
  metadata?: Record<string, unknown>;
}

/**
 * 子任务
 */
export interface SubTask {
  id: string;
  parentTaskId: string;
  description: string;
  assignedAgentId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies: string[];
  result?: unknown;
}

/**
 * 执行计划
 */
export interface ExecutionPlan {
  id: string;
  taskId: string;
  subtasks: SubTask[];
  agentAssignments: Map<string, string[]>; // Agent ID -> SubTask IDs
  estimatedDuration: number;
  createdAt: number;
}

/**
 * 协作结果
 */
export interface CollaborationResult {
  success: boolean;
  results: Map<string, SubTaskResult>;
  totalTime: number;
  errors: Error[];
}

/**
 * 子任务结果
 */
export interface SubTaskResult {
  taskId: string;
  agentId: string;
  result: unknown;
  executionTime: number;
  success: boolean;
  error?: string;
}

/**
 * Agent日志
 */
export interface AgentLog {
  id: string;
  agentId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Agent状态
 */
export interface AgentState {
  // Agents
  agents: Agent[];
  activeAgentId: string | null;

  // Tasks & Plans
  currentTask: ComplexTask | null;
  executionPlan: ExecutionPlan | null;
  taskHistory: ComplexTask[];

  // Tools
  tools: MCPTool[];

  // Logs
  logs: AgentLog[];

  // Actions
  registerAgent: (agent: Omit<Agent, 'stats'>) => void;
  unregisterAgent: (agentId: string) => void;

  startTask: (task: ComplexTask) => Promise<CollaborationResult>;
  executeTask: (agentId: string, task: SubTask) => Promise<SubTaskResult>;
  completeTask: (taskId: string, result: unknown) => void;
  cancelTask: (taskId: string) => void;

  // Tool Management
  registerTool: (tool: MCPTool) => void;
  executeTool: (toolId: string, input: unknown) => Promise<ToolOutput>;

  // Memory Management
  addToMemory: (agentId: string, experience: Experience) => void;
  updatePreferences: (agentId: string, preferences: Partial<UserPreferences>) => void;
  learnPattern: (agentId: string, pattern: string, success: boolean) => void;

  // Log Management
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;

  // Agent Selection
  selectAgent: (agentId: string) => void;
  getBestAgent: (task: string) => Agent | null;

  // Task Decomposition
  decomposeTask: (task: ComplexTask) => Promise<ExecutionPlan>;

  // Agent Coordination
  coordinateAgents: (plan: ExecutionPlan) => Promise<CollaborationResult>;
}

// ============================================================================
// 预定义Skills
// ============================================================================

/**
 * 代码生成Skill
 */
const codeGenerationSkill: AgentSkill = {
  id: 'code-generation',
  name: '代码生成',
  description: '基于自然语言描述生成代码',
  requiredTools: ['ai-model'],
  canHandle: (task: string) => {
    const keywords = ['生成', '创建', '编写', 'build', 'create'];
    return keywords.some(kw => task.includes(kw)) ? 0.95 : 0;
  },
  execute: async (_input: unknown) => {
    // 实际实现在useAgent hook中
    return {
      success: true,
      data: { code: '// Generated code placeholder' },
      metadata: { skillId: 'code-generation' }
    };
  }
};

/**
 * 代码重构Skill
 */
const codeRefactorSkill: AgentSkill = {
  id: 'code-refactor',
  name: '代码重构',
  description: '优化代码结构和质量',
  requiredTools: ['ai-model', 'ast-parser'],
  canHandle: (task: string) => {
    const keywords = ['重构', '优化', 'refactor', 'optimize'];
    return keywords.some(kw => task.includes(kw)) ? 0.9 : 0;
  },
  execute: async (_input: unknown) => {
    return {
      success: true,
      data: { refactoredCode: '// Refactored code placeholder' },
      metadata: { skillId: 'code-refactor' }
    };
  }
};

/**
 * Bug修复Skill
 */
const bugFixSkill: AgentSkill = {
  id: 'bug-fixing',
  name: 'Bug修复',
  description: '分析错误并提供修复建议',
  requiredTools: ['ai-model', 'error-analyzer'],
  canHandle: (task: string) => {
    const keywords = ['修复', 'bug', '错误', 'error', 'fix'];
    return keywords.some(kw => task.includes(kw)) ? 0.92 : 0;
  },
  execute: async (_input: unknown) => {
    return {
      success: true,
      data: { fixedCode: '// Fixed code placeholder' },
      metadata: { skillId: 'bug-fixing' }
    };
  }
};

/**
 * 测试生成Skill
 */
const testGenerationSkill: AgentSkill = {
  id: 'test-generation',
  name: '测试生成',
  description: '自动生成单元测试',
  requiredTools: ['ai-model', 'coverage-analyzer'],
  canHandle: (task: string) => {
    const keywords = ['测试', 'test', '单元测试', 'unit test'];
    return keywords.some(kw => task.includes(kw)) ? 0.88 : 0;
  },
  execute: async (_input: unknown) => {
    return {
      success: true,
      data: { testCode: '// Test code placeholder' },
      metadata: { skillId: 'test-generation' }
    };
  }
};

/**
 * 代码审查Skill
 */
const codeReviewSkill: AgentSkill = {
  id: 'code-review',
  name: '代码审查',
  description: '检查代码质量和最佳实践',
  requiredTools: ['ai-model', 'linter'],
  canHandle: (task: string) => {
    const keywords = ['审查', 'review', '检查', 'check', 'quality'];
    return keywords.some(kw => task.includes(kw)) ? 0.85 : 0;
  },
  execute: async (_input: unknown) => {
    return {
      success: true,
      data: { reviewComments: [] },
      metadata: { skillId: 'code-review' }
    };
  }
};

// ============================================================================
// 预定义Agent角色
// ============================================================================

/**
 * 规划Agent
 */
const plannerAgentSkills: AgentSkill[] = [
  codeGenerationSkill
];

/**
 * 编码Agent
 */
const coderAgentSkills: AgentSkill[] = [
  codeGenerationSkill,
  codeRefactorSkill,
  bugFixSkill
];

/**
 * 审核Agent
 */
const reviewerAgentSkills: AgentSkill[] = [
  codeReviewSkill,
  bugFixSkill
];

/**
 * 测试Agent
 */
const testerAgentSkills: AgentSkill[] = [
  testGenerationSkill
];

/**
 * 默认记忆
 */
const defaultMemory: AgentMemory = {
  context: [],
  learnings: [],
  preferences: {
    codingStyle: 'modern',
    frameworkPreference: ['React', 'TypeScript'],
    languagePreference: 'TypeScript',
    autoOptimize: true,
    verboseMode: false
  },
  patterns: []
};

// ============================================================================
// Agent Store实现
// ============================================================================

/**
 * Agent Store创建函数
 */
export const useAgentStore = create<AgentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        agents: [],
        activeAgentId: null,
        currentTask: null,
        executionPlan: null,
        taskHistory: [],
        tools: [],
        logs: [],

        // Agent Management
        registerAgent: (agent) => {
          const newAgent: Agent = {
            ...agent,
            stats: {
              tasksCompleted: 0,
              tasksFailed: 0,
              avgExecutionTime: 0,
              lastActive: Date.now()
            }
          };
          set((state) => ({
            agents: [...state.agents, newAgent]
          }));
          get().addLog({
            agentId: newAgent.id,
            level: 'info',
            message: `Agent "${newAgent.name}" registered`,
            metadata: { role: newAgent.role }
          });
        },

        unregisterAgent: (agentId) => {
          set((state) => ({
            agents: state.agents.filter((a) => a.id !== agentId),
            activeAgentId: state.activeAgentId === agentId ? null : state.activeAgentId
          }));
          get().addLog({
            agentId: 'system',
            level: 'info',
            message: `Agent "${agentId}" unregistered`
          });
        },

        // Task Management
        startTask: async (task) => {
          set({ currentTask: task });
          get().addLog({
            agentId: 'system',
            level: 'info',
            message: `Task started: ${task.description}`,
            metadata: { taskId: task.id }
          });

          // 1. 分解任务
          const plan = await get().decomposeTask(task);
          set({ executionPlan: plan });

          // 2. 协调Agent执行
          const result = await get().coordinateAgents(plan);

          // 3. 保存到历史
          set((state) => ({
            taskHistory: [...state.taskHistory, task],
            currentTask: null
          }));

          return result;
        },

        executeTask: async (agentId, subtask) => {
          const agent = get().agents.find((a) => a.id === agentId);
          if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
          }

          const startTime = Date.now();
          get().addLog({
            agentId,
            level: 'info',
            message: `Executing subtask: ${subtask.description}`,
            metadata: { subtaskId: subtask.id }
          });

          try {
            // 查找合适的Skill
            const skill = agent.skills.find((s) => s.canHandle(subtask.description) > 0.7);
            if (!skill) {
              throw new Error(`No suitable skill found for task: ${subtask.description}`);
            }

            // 执行Skill
            const result = await skill.execute(subtask);

            const executionTime = Date.now() - startTime;

            // 更新Agent状态
            set((state) => ({
              agents: produce(state.agents, (draft) => {
                const agent = draft.find((a) => a.id === agentId);
                if (agent) {
                  agent.stats.tasksCompleted++;
                  agent.stats.avgExecutionTime =
                    (agent.stats.avgExecutionTime * (agent.stats.tasksCompleted - 1) + executionTime) /
                    agent.stats.tasksCompleted;
                  agent.stats.lastActive = Date.now();
                }
              })
            }));

            get().addLog({
              agentId,
              level: 'info',
              message: `Subtask completed: ${subtask.description}`,
              metadata: { executionTime, success: result.success }
            });

            // 添加到经验
            get().addToMemory(agentId, {
              task: subtask.description,
              approach: skill.id,
              outcome: result.success ? 'success' : 'failure',
              timestamp: Date.now(),
              learnings: result.success ? ['Execution successful'] : ['Execution failed']
            });

            return {
              taskId: subtask.id,
              agentId,
              result: result.data,
              executionTime,
              success: result.success,
              error: result.error
            };
          } catch (error) {
            const executionTime = Date.now() - startTime;

            set((state) => ({
              agents: produce(state.agents, (draft) => {
                const agent = draft.find((a) => a.id === agentId);
                if (agent) {
                  agent.stats.tasksFailed++;
                  agent.stats.lastActive = Date.now();
                }
              })
            }));

            get().addLog({
              agentId,
              level: 'error',
              message: `Subtask failed: ${subtask.description}`,
              metadata: { error: error instanceof Error ? error.message : String(error) }
            });

            return {
              taskId: subtask.id,
              agentId,
              result: null,
              executionTime,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        },

        completeTask: (taskId, result) => {
          set((state) => ({
            executionPlan: state.executionPlan
              ? {
                  ...state.executionPlan,
                  subtasks: state.executionPlan.subtasks.map((st) =>
                    st.id === taskId ? { ...st, status: 'completed', result } : st
                  )
                }
              : null
          }));
        },

        cancelTask: (taskId) => {
          set((state) => ({
            executionPlan: state.executionPlan
              ? {
                  ...state.executionPlan,
                  subtasks: state.executionPlan.subtasks.map((st) =>
                    st.id === taskId ? { ...st, status: 'failed' } : st
                  )
                }
              : null,
            currentTask: state.currentTask?.id === taskId ? null : state.currentTask
          }));
          get().addLog({
            agentId: 'system',
            level: 'warn',
            message: `Task cancelled: ${taskId}`
          });
        },

        // Tool Management
        registerTool: (tool) => {
          set((state) => ({
            tools: [...state.tools, tool]
          }));
          get().addLog({
            agentId: 'system',
            level: 'info',
            message: `Tool registered: ${tool.name}`,
            metadata: { toolId: tool.id }
          });
        },

        executeTool: async (toolId, input) => {
          const tool = get().tools.find((t) => t.id === toolId);
          if (!tool) {
            throw new Error(`Tool ${toolId} not found`);
          }
          if (!tool.isAvailable()) {
            throw new Error(`Tool ${toolId} is not available`);
          }
          return await tool.execute(input);
        },

        // Memory Management
        addToMemory: (agentId, experience) => {
          set((state) => ({
            agents: produce(state.agents, (draft) => {
              const agent = draft.find((a) => a.id === agentId);
              if (agent) {
                agent.memory.learnings.push(experience);
                // 保留最近100条经验
                if (agent.memory.learnings.length > 100) {
                  agent.memory.learnings = agent.memory.learnings.slice(-100);
                }
              }
            })
          }));
        },

        updatePreferences: (agentId, preferences) => {
          set((state) => ({
            agents: produce(state.agents, (draft) => {
              const agent = draft.find((a) => a.id === agentId);
              if (agent) {
                agent.memory.preferences = { ...agent.memory.preferences, ...preferences };
              }
            })
          }));
        },

        learnPattern: (agentId, pattern, success) => {
          set((state) => ({
            agents: produce(state.agents, (draft) => {
              const agent = draft.find((a) => a.id === agentId);
              if (agent) {
                const existing = agent.memory.patterns.find((p) => p.pattern === pattern);
                if (existing) {
                  existing.frequency++;
                  existing.lastUsed = Date.now();
                  existing.successRate =
                    (existing.successRate * (existing.frequency - 1) + (success ? 1 : 0)) /
                    existing.frequency;
                } else {
                  agent.memory.patterns.push({
                    id: `pattern-${Date.now()}`,
                    pattern,
                    frequency: 1,
                    lastUsed: Date.now(),
                    successRate: success ? 1 : 0
                  });
                }
              }
            })
          }));
        },

        // Log Management
        addLog: (log) => {
          const newLog: AgentLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...log
          };
          set((state) => ({
            logs: [...state.logs, newLog].slice(-500) // 保留最近500条日志
          }));
        },

        clearLogs: () => {
          set({ logs: [] });
        },

        // Agent Selection
        selectAgent: (agentId) => {
          set({ activeAgentId: agentId });
        },

        getBestAgent: (task) => {
          const availableAgents = get().agents.filter((a) => a.status === 'idle');
          if (availableAgents.length === 0) return null;

          // 根据技能匹配度和负载选择最佳Agent
          let bestAgent: Agent | null = null;
          let bestScore = 0;

          for (const agent of availableAgents) {
            let score = 0;
            let skillMatches = 0;

            // 计算技能匹配度
            for (const skill of agent.skills) {
              const matchScore = skill.canHandle(task);
              if (matchScore > 0.7) {
                score += matchScore;
                skillMatches++;
              }
            }

            // 根据历史成功率调整
            if (agent.stats.tasksCompleted > 0) {
              const successRate =
                agent.stats.tasksCompleted /
                (agent.stats.tasksCompleted + agent.stats.tasksFailed);
              score *= successRate;
            }

            // 根据负载调整
            const loadFactor = 1 - agent.currentLoad / 10;
            score *= loadFactor;

            if (score > bestScore && skillMatches > 0) {
              bestScore = score;
              bestAgent = agent;
            }
          }

          return bestAgent;
        },

        // Task Decomposition
        decomposeTask: async (task) => {
          get().addLog({
            agentId: 'system',
            level: 'info',
            message: `Decomposing task: ${task.description}`,
            metadata: { taskId: task.id }
          });

          // 简化版任务分解（实际应该使用AI）
          const subtasks: SubTask[] = [
            {
              id: `${task.id}-sub-1`,
              parentTaskId: task.id,
              description: `Analyze requirements for: ${task.description}`,
              status: 'pending',
              dependencies: []
            },
            {
              id: `${task.id}-sub-2`,
              parentTaskId: task.id,
              description: `Generate code for: ${task.description}`,
              status: 'pending',
              dependencies: [`${task.id}-sub-1`]
            },
            {
              id: `${task.id}-sub-3`,
              parentTaskId: task.id,
              description: `Review code quality for: ${task.description}`,
              status: 'pending',
              dependencies: [`${task.id}-sub-2`]
            },
            {
              id: `${task.id}-sub-4`,
              parentTaskId: task.id,
              description: `Generate tests for: ${task.description}`,
              status: 'pending',
              dependencies: [`${task.id}-sub-2`]
            }
          ];

          const agentAssignments = new Map<string, string[]>();
          const agents = get().agents;

          // 分配subtasks给agents
          for (const subtask of subtasks) {
            let bestAgent = get().getBestAgent(subtask.description);
            if (!bestAgent && agents.length > 0) {
              bestAgent = agents[0]; // fallback
            }
            if (bestAgent) {
              if (!agentAssignments.has(bestAgent.id)) {
                agentAssignments.set(bestAgent.id, []);
              }
              agentAssignments.get(bestAgent.id)!.push(subtask.id);
              subtask.assignedAgentId = bestAgent.id;
            }
          }

          const plan: ExecutionPlan = {
            id: `plan-${task.id}`,
            taskId: task.id,
            subtasks,
            agentAssignments,
            estimatedDuration: subtasks.length * 5, // minutes
            createdAt: Date.now()
          };

          get().addLog({
            agentId: 'system',
            level: 'info',
            message: `Task decomposition completed`,
            metadata: {
              subtaskCount: subtasks.length,
              agentsInvolved: Array.from(agentAssignments.keys())
            }
          });

          return plan;
        },

        // Agent Coordination
        coordinateAgents: async (plan) => {
          get().addLog({
            agentId: 'system',
            level: 'info',
            message: `Coordinating ${plan.subtasks.length} subtasks`,
            metadata: { planId: plan.id }
          });

          const results = new Map<string, SubTaskResult>();
          const errors: Error[] = [];

          // 简化版执行（按依赖顺序）
          for (const subtask of plan.subtasks) {
            // 检查依赖
            const dependenciesCompleted = subtask.dependencies.every((depId) => {
              const depSubtask = plan.subtasks.find((st) => st.id === depId);
              return depSubtask?.status === 'completed';
            });

            if (!dependenciesCompleted) {
              continue;
            }

            if (subtask.assignedAgentId) {
              try {
                const result = await get().executeTask(subtask.assignedAgentId, subtask);
                results.set(subtask.id, result);

                if (result.success) {
                  get().completeTask(subtask.id, result.result);
                } else {
                  get().addLog({
                    agentId: 'system',
                    level: 'error',
                    message: `Subtask failed: ${subtask.description}`,
                    metadata: { error: result.error }
                  });
                  errors.push(new Error(result.error || 'Unknown error'));
                }
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                errors.push(new Error(errorMsg));
                get().addLog({
                  agentId: 'system',
                  level: 'error',
                  message: `Subtask execution error: ${subtask.description}`,
                  metadata: { error: errorMsg }
                });
              }
            }
          }

          const totalTime = Array.from(results.values()).reduce(
            (sum, r) => sum + r.executionTime,
            0
          );

          const collaborationResult: CollaborationResult = {
            success: errors.length === 0,
            results,
            totalTime,
            errors
          };

          get().addLog({
            agentId: 'system',
            level: collaborationResult.success ? 'info' : 'warn',
            message: `Agent coordination completed`,
            metadata: {
              success: collaborationResult.success,
              totalTime,
              errorsCount: errors.length
            }
          });

          return collaborationResult;
        }
      }),
      {
        name: 'yyc3-agent-storage',
        partialize: (state) => ({
          agents: state.agents,
          currentTask: state.currentTask,
          taskHistory: state.taskHistory.slice(-50),
          tools: state.tools
        })
      }
    )
  )
);

// ============================================================================
// 预定义Agents
// ============================================================================

/**
 * 创建规划Agent
 */
export const createPlannerAgent = (): Omit<Agent, 'stats'> => ({
  id: 'agent-planner',
  name: '规划Agent',
  role: 'planner',
  capabilities: ['task-decomposition', 'resource-allocation'],
  currentLoad: 0,
  status: 'idle',
  skills: plannerAgentSkills,
  memory: { ...defaultMemory }
});

/**
 * 创建编码Agent
 */
export const createCoderAgent = (): Omit<Agent, 'stats'> => ({
  id: 'agent-coder',
  name: '编码Agent',
  role: 'coder',
  capabilities: ['code-generation', 'code-refactor', 'debugging'],
  currentLoad: 0,
  status: 'idle',
  skills: coderAgentSkills,
  memory: { ...defaultMemory }
});

/**
 * 创建审核Agent
 */
export const createReviewerAgent = (): Omit<Agent, 'stats'> => ({
  id: 'agent-reviewer',
  name: '审核Agent',
  role: 'reviewer',
  capabilities: ['code-review', 'quality-check', 'security-scan'],
  currentLoad: 0,
  status: 'idle',
  skills: reviewerAgentSkills,
  memory: { ...defaultMemory }
});

/**
 * 创建测试Agent
 */
export const createTesterAgent = (): Omit<Agent, 'stats'> => ({
  id: 'agent-tester',
  name: '测试Agent',
  role: 'tester',
  capabilities: ['test-generation', 'test-execution', 'bug-detection'],
  currentLoad: 0,
  status: 'idle',
  skills: testerAgentSkills,
  memory: { ...defaultMemory }
});

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 初始化默认Agents
 */
export const initializeDefaultAgents = () => {
  const store = useAgentStore.getState();

  // 检查是否已初始化
  if (store.agents.length > 0) return;

  // 注册默认agents
  store.registerAgent(createPlannerAgent());
  store.registerAgent(createCoderAgent());
  store.registerAgent(createReviewerAgent());
  store.registerAgent(createTesterAgent());
};
