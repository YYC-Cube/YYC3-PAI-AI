/**
 * @file AgentWorkflowPanel.tsx
 * @description YYC³ AI-PAI Agent Workflow Panel.tsx component
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-05-06
 * @updated 2026-05-06
 * @status active
 * @tags [component]
 */

/**
 * YYC³ AI - Agent Workflow Panel
 *
 * AI Agent工作流可视化面板
 * 支持Agent管理、任务分解、执行监控、日志查看
 *
 * @module components/AgentWorkflowPanel
 * @description AI Agent工作流系统UI组件
 */

import React, { useState, useMemo } from 'react';
import {
  Brain,
  Play,
  RefreshCw,
  Trash2,
  Settings,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Cpu,
  MessageSquare,
  FileText,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAgent, getAgentIcon, formatAgentStatus, getAgentStatusColor } from '../hooks/useAgent';
import type { ExecutionPlan } from '../store/agent-store';
import type { Agent, AgentLog } from '../store/agent-store';

// ============================================================================
// 子组件
// ============================================================================

/**
 * Agent状态卡片
 */
const AgentCard: React.FC<{
  agent: Agent;
  isActive: boolean;
  onClick: () => void;
}> = ({ agent, isActive, onClick }) => {
  const loadPercentage = (agent.currentLoad / 10) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${isActive ? 'border-primary-500 bg-primary-500/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}
      `}
    >
      {/* Agent Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-xl
          ${getAgentStatusColor(agent.status)}
        `}>
          {getAgentIcon(agent.role)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-100 truncate">
            {agent.name}
          </h3>
          <p className="text-xs text-gray-400 truncate">
            {formatAgentStatus(agent.status)}
          </p>
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-900/50 rounded p-2">
          <div className="text-lg font-bold text-green-400">
            {agent.stats.tasksCompleted}
          </div>
          <div className="text-xs text-gray-500">完成</div>
        </div>
        <div className="bg-gray-900/50 rounded p-2">
          <div className="text-lg font-bold text-red-400">
            {agent.stats.tasksFailed}
          </div>
          <div className="text-xs text-gray-500">失败</div>
        </div>
        <div className="bg-gray-900/50 rounded p-2">
          <div className="text-lg font-bold text-blue-400">
            {agent.currentLoad}
          </div>
          <div className="text-xs text-gray-500">负载</div>
        </div>
      </div>

      {/* Load Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>负载</span>
          <span>{loadPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${loadPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="mt-3 flex flex-wrap gap-1">
        {agent.skills.slice(0, 3).map((skill) => (
          <span
            key={skill.id}
            className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded"
          >
            {skill.name}
          </span>
        ))}
        {agent.skills.length > 3 && (
          <span className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded">
            +{agent.skills.length - 3}
          </span>
        )}
      </div>
    </motion.div>
  );
};

/**
 * 任务输入区域
 */
const TaskInputArea: React.FC<{
  onCreateTask: (description: string) => void;
  isExecuting: boolean;
}> = ({ onCreateTask, isExecuting }) => {
  const [taskInput, setTaskInput] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskInput.trim()) {
      onCreateTask(taskInput.trim());
      setTaskInput('');
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-100">创建任务</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="描述您想要完成的任务... 例如: 创建一个React用户列表组件"
          className="w-full h-24 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-sm text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none"
          disabled={isExecuting}
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">优先级:</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
              className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none"
              disabled={isExecuting}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">紧急</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!taskInput.trim() || isExecuting}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                执行中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                开始执行
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * 执行计划展示
 */
const ExecutionPlanView: React.FC<{
  plan: ExecutionPlan;
  agents: Agent[];
}> = ({ plan, agents }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-5 h-5 text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-100">执行计划</h3>
        <span className="ml-auto text-xs text-gray-500">
          预计 {plan.estimatedDuration} 分钟
        </span>
      </div>

      <div className="space-y-2">
        {plan.subtasks.map((subtask, index: number) => {
          const agent = agents.find((a) => a.id === subtask.assignedAgentId);
          const statusColor = subtask.status === 'completed' ? 'text-green-400' :
            subtask.status === 'in_progress' ? 'text-blue-400' :
              subtask.status === 'failed' ? 'text-red-400' : 'text-gray-500';

          return (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{subtask.description}</p>
                {agent && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {getAgentIcon(agent.role)} {agent.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {subtask.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : subtask.status === 'in_progress' ? (
                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                ) : subtask.status === 'failed' ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-500" />
                )}
              </div>

              <span className={`text-xs ${statusColor} font-medium`}>
                {subtask.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 日志显示
 */
const LogViewer: React.FC<{
  logs: AgentLog[];
  onClear: () => void;
}> = ({ logs, onClear }) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filteredLogs = useMemo(() => {
    if (filterLevel === 'all') return logs;
    return logs.filter((log) => log.level === filterLevel);
  }, [logs, filterLevel]);

  const getLogIcon = (level: AgentLog['level']) => {
    switch (level) {
      case 'info':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          <h3 className="text-sm font-semibold text-gray-100">日志</h3>
          <span className="text-xs text-gray-500">({filteredLogs.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as 'all' | 'info' | 'warn' | 'error')}
            className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none"
          >
            <option value="all">全部</option>
            <option value="info">信息</option>
            <option value="warn">警告</option>
            <option value="error">错误</option>
          </select>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="清空日志"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {filteredLogs.slice().reverse().map((log) => (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="p-3 bg-gray-800/50 rounded border border-gray-700"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-400">
                      {log.agentId}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 break-words">
                    {log.message}
                  </p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Activity className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">暂无日志</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 统计信息卡片
 */
const StatsCard: React.FC<{
  stats: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
  };
}> = ({ stats }) => {
  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <div className="text-2xl font-bold text-primary-400">
          {stats.totalAgents}
        </div>
        <div className="text-xs text-gray-500 mt-1">总Agents</div>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <div className="text-2xl font-bold text-green-400">
          {stats.totalTasksCompleted}
        </div>
        <div className="text-xs text-gray-500 mt-1">已完成任务</div>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <div className="text-2xl font-bold text-red-400">
          {stats.totalTasksFailed}
        </div>
        <div className="text-xs text-gray-500 mt-1">失败任务</div>
      </div>
    </div>
  );
};

// ============================================================================
// 主组件
// ============================================================================

interface AgentWorkflowPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const AgentWorkflowPanel: React.FC<AgentWorkflowPanelProps> = ({ visible: _visible = true, onClose: _onClose }) => {
  const {
    // Agent状态
    agents,
    activeAgentId,

    // 任务状态
    currentTask,
    executionPlan,
    isExecuting,

    // 日志状态
    logs,

    // Agent操作
    selectAgent,

    // 任务操作
    createTask,
    startTask,

    // 日志操作
    clearLogs,

    // 统计信息
    getAgentStats
  } = useAgent();

  const stats = getAgentStats();

  /**
   * 创建并启动任务
   */
  const handleCreateTask = async (description: string) => {
    const task = createTask(description);
    await startTask(task);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Agent 工作流</h2>
              <p className="text-xs text-gray-500">PDA+记忆+反思架构</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="清空日志"
            >
              <Trash2 className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Agent List */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <StatsCard stats={stats} />
            <TaskInputArea onCreateTask={handleCreateTask} isExecuting={isExecuting} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-100 mb-2">Agents</h3>
            <AnimatePresence>
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isActive={activeAgentId === agent.id}
                  onClick={() => selectAgent(agent.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle: Execution Plan */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary-400" />
              执行监控
            </h3>

            {currentTask && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-200 mb-2">当前任务</h4>
                <p className="text-sm text-gray-300">{currentTask.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded ${currentTask.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    currentTask.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      currentTask.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                    }`}>
                    {currentTask.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(currentTask.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {executionPlan && (
              <ExecutionPlanView plan={executionPlan} agents={agents} />
            )}

            {!currentTask && !executionPlan && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <User className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">创建一个任务开始工作</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Logs */}
        <div className="w-96 border-l border-gray-700 flex flex-col">
          <LogViewer logs={logs} onClear={clearLogs} />
        </div>
      </div>
    </div>
  );
};

export default AgentWorkflowPanel;
