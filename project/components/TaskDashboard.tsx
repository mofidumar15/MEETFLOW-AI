'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  Pencil,
  Trash2,
  X,
  Download,
  Filter,
  Flame,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
} from 'lucide-react';
import type { ActionItem, Priority, TaskStatus, MeetingAnalysis } from '@/types';
import { buildExportString } from '@/services/swytchcode';
import { cn } from '@/lib/utils';

interface TaskDashboardProps {
  tasks: ActionItem[];
  analysis?: MeetingAnalysis;
  onUpdateTask: (id: string, updates: Partial<ActionItem>) => void;
  onDeleteTask: (id: string) => void;
}

const priorityConfig: Record<
  Priority,
  { label: string; color: string; bg: string; border: string; icon: typeof Flame }
> = {
  high: {
    label: 'High',
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/40',
    icon: Flame,
  },
  medium: {
    label: 'Medium',
    color: 'text-cyber-400',
    bg: 'bg-cyber-400/10',
    border: 'border-cyber-400/40',
    icon: Clock,
  },
  low: {
    label: 'Low',
    color: 'text-electric-400',
    bg: 'bg-electric-400/10',
    border: 'border-electric-400/40',
    icon: ArrowDownWideNarrow,
  },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-slate-400' },
  in_progress: { label: 'In Progress', color: 'text-cyber-400' },
  completed: { label: 'Completed', color: 'text-success' },
};

// ============================================================
// TaskDashboard — interactive task board with priority sorting,
// inline editing, filtering, and export.
// ============================================================

export function TaskDashboard({
  tasks,
  analysis,
  onUpdateTask,
  onDeleteTask,
}: TaskDashboardProps) {
  const [filter, setFilter] = useState<'all' | Priority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [sortAsc, setSortAsc] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOwner, setEditOwner] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');

  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filter !== 'all') result = result.filter((t) => t.priority === filter);
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);
    result.sort((a, b) => {
      const cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      return sortAsc ? -cmp : cmp;
    });
    // Completed tasks always go to bottom
    result.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return 0;
    });
    return result;
  }, [tasks, filter, statusFilter, sortAsc]);

  const stats = useMemo(() => {
    const high = tasks.filter((t) => t.priority === 'high').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { total: tasks.length, high, completed };
  }, [tasks]);

  function toggleStatus(task: ActionItem) {
    const next: TaskStatus =
      task.status === 'completed'
        ? 'pending'
        : task.status === 'pending'
          ? 'in_progress'
          : 'completed';
    onUpdateTask(task.id, { status: next, updatedAt: new Date().toISOString() });
  }

  function startEdit(task: ActionItem) {
    setEditingId(task.id);
    setEditOwner(task.owner);
    setEditPriority(task.priority);
  }

  function saveEdit(task: ActionItem) {
    onUpdateTask(task.id, {
      owner: editOwner,
      priority: editPriority,
      updatedAt: new Date().toISOString(),
    });
    setEditingId(null);
  }

  function handleExport(format: 'json' | 'csv' | 'markdown') {
    if (!analysis) return;
    const content = buildExportString(analysis, format);
    const mime =
      format === 'json'
        ? 'application/json'
        : format === 'csv'
          ? 'text/csv'
          : 'text/markdown';
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetflow-export.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-electric-500/20 bg-slate-950/60 p-12 text-center backdrop-blur-xl">
        <div className="mb-3 rounded-full bg-electric-500/10 p-4">
          <CheckCircle2 className="h-8 w-8 text-electric-400/50" />
        </div>
        <p className="text-lg font-semibold text-slate-300">No tasks yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Paste a meeting transcript and run the AI agent to extract action items.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-electric-500/20 bg-slate-900/60 px-4 py-2.5 backdrop-blur">
          <div className="text-xs text-slate-500">Total Tasks</div>
          <div className="text-xl font-bold text-electric-400">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-error/20 bg-slate-900/60 px-4 py-2.5 backdrop-blur">
          <div className="text-xs text-slate-500">High Priority</div>
          <div className="text-xl font-bold text-error">{stats.high}</div>
        </div>
        <div className="rounded-lg border border-success/20 bg-slate-900/60 px-4 py-2.5 backdrop-blur">
          <div className="text-xs text-slate-500">Completed</div>
          <div className="text-xl font-bold text-success">{stats.completed}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Priority filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-electric-500/20 bg-slate-900/60 px-2 py-1.5 backdrop-blur">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium uppercase transition-colors',
                filter === p
                  ? 'bg-electric-500/20 text-electric-300'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-electric-500/20 bg-slate-900/60 px-2 py-1.5 backdrop-blur">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                statusFilter === s
                  ? 'bg-cyber-400/20 text-cyber-300'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {s === 'in_progress' ? 'Active' : s}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1.5 rounded-lg border border-electric-500/20 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-400 backdrop-blur transition-colors hover:text-electric-300"
        >
          {sortAsc ? (
            <ArrowUpWideNarrow className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
          )}
          Sort
        </button>

        {/* Export buttons */}
        <div className="ml-auto flex items-center gap-1.5">
          {(['json', 'csv', 'markdown'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              disabled={!analysis}
              className="flex items-center gap-1.5 rounded-lg border border-cyber-400/30 bg-cyber-400/10 px-3 py-2 text-xs font-semibold text-cyber-300 backdrop-blur transition-all hover:bg-cyber-400/20 hover:shadow-lg hover:shadow-cyber-400/10 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {filteredTasks.map((task) => {
            const pc = priorityConfig[task.priority];
            const PriorityIcon = pc.icon;
            const isEditing = editingId === task.id;
            const isCompleted = task.status === 'completed';

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'group relative overflow-hidden rounded-xl border bg-slate-900/60 p-4 backdrop-blur-xl transition-all',
                  isCompleted
                    ? 'border-success/20 opacity-60'
                    : `${pc.border} hover:border-electric-500/50`,
                )}
              >
                {/* Priority accent bar */}
                <div
                  className={cn('absolute left-0 top-0 h-full w-1', {
                    'bg-error': task.priority === 'high',
                    'bg-cyber-400': task.priority === 'medium',
                    'bg-electric-400': task.priority === 'low',
                  })}
                />

                <div className="flex items-start gap-3 pl-2">
                  {/* Status toggle */}
                  <button
                    onClick={() => toggleStatus(task)}
                    className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : task.status === 'in_progress' ? (
                      <div className="relative">
                        <Circle className="h-5 w-5 text-cyber-400" />
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-cyber-400/30 border-t-cyber-400" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-slate-600 transition-colors hover:text-electric-400" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={cn(
                          'font-semibold text-slate-100',
                          isCompleted && 'line-through',
                        )}
                      >
                        {task.title}
                      </h4>
                      <div className="flex shrink-0 items-center gap-1">
                        {!isEditing && (
                          <>
                            <button
                              onClick={() => startEdit(task)}
                              className="rounded p-1 text-slate-500 opacity-0 transition-opacity hover:text-electric-400 group-hover:opacity-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="rounded p-1 text-slate-500 opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {task.description && (
                      <p className="mt-1 text-sm text-slate-400">{task.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {/* Priority badge */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
                          pc.bg,
                          pc.border,
                          pc.color,
                        )}
                      >
                        <PriorityIcon className="h-3 w-3" />
                        {pc.label}
                      </span>

                      {/* Owner */}
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            value={editOwner}
                            onChange={(e) => setEditOwner(e.target.value)}
                            className="w-32 rounded border border-electric-500/30 bg-slate-950 px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-electric-500"
                            placeholder="Owner"
                          />
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as Priority)}
                            className="rounded border border-electric-500/30 bg-slate-950 px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-electric-500"
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <button
                            onClick={() => saveEdit(task)}
                            className="rounded bg-electric-500/20 px-2 py-0.5 text-xs text-electric-300 hover:bg-electric-500/30"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded p-0.5 text-slate-500 hover:text-error"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                          <User className="h-3 w-3" />
                          {task.owner}
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig[task.status].color,
                          task.status === 'completed' && 'bg-success/10',
                          task.status === 'in_progress' && 'bg-cyber-400/10',
                          task.status === 'pending' && 'bg-slate-800/60',
                        )}
                      >
                        {statusConfig[task.status].label}
                      </span>

                      {/* Due date */}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="py-8 text-center text-sm text-slate-500">
          No tasks match the current filters.
        </div>
      )}
    </div>
  );
}
