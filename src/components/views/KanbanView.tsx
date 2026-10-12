import React, { useState } from 'react';
import { PlannerTask, TaskStage, Assignee } from '../../types/planner';
import { isOverdue, getDaysRemaining } from '../../utils/exportImport';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  CheckSquare
} from 'lucide-react';

interface KanbanViewProps {
  tasks: PlannerTask[];
  assignees: Assignee[];
  onTaskClick: (task: PlannerTask) => void;
  onUpdateStage: (taskId: string, newStage: TaskStage) => void;
  onQuickAddTask: (stage: TaskStage) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  assignees,
  onTaskClick,
  onUpdateStage,
  onQuickAddTask,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns: { stage: TaskStage; title: string; countColor: string }[] = [
    { stage: 'todo', title: 'รอดำเนินการ', countColor: 'text-slate-500' },
    { stage: 'in_progress', title: 'กำลังทำ', countColor: 'text-indigo-600' },
    { stage: 'review', title: 'รอตรวจสอบ', countColor: 'text-amber-600' },
    { stage: 'completed', title: 'เสร็จสิ้นแล้ว', countColor: 'text-emerald-600' },
  ];

  const assigneeMap = new Map(assignees.map((a) => [a.id, a]));

  const priorityMeta: Record<string, { label: string; textClass: string }> = {
    urgent: { label: 'ด่วนที่สุด', textClass: 'text-rose-600 font-semibold' },
    high: { label: 'สูง', textClass: 'text-amber-600 font-medium' },
    medium: { label: 'ปานกลาง', textClass: 'text-slate-600 font-medium' },
    low: { label: 'ต่ำ', textClass: 'text-slate-400 font-normal' },
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: TaskStage) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateStage(taskId, targetStage);
    }
    setDraggedTaskId(null);
  };

  const getNextStage = (current: TaskStage): TaskStage | null => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'completed';
    return null;
  };

  const getPrevStage = (current: TaskStage): TaskStage | null => {
    if (current === 'completed') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'todo';
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 lg:p-6 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.stage === col.stage);

        return (
          <div
            key={col.stage}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.stage)}
            className="bg-slate-100/75 rounded-xl border border-slate-200/90 flex flex-col max-h-[calc(100vh-140px)]"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  {col.title}
                </h3>
                <span className={`text-xs font-mono tabular-nums ${col.countColor}`}>
                  ({colTasks.length})
                </span>
              </div>
              <button
                onClick={() => onQuickAddTask(col.stage)}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white/70 rounded-md transition-colors"
                title={`เพิ่มงานในช่อง ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Container */}
            <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 min-h-[150px]">
              {colTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  ไม่มีงานในขั้นตอนนี้
                </div>
              ) : (
                colTasks.map((task) => {
                  const assignee = assigneeMap.get(task.assigneeId);
                  const isTaskOverdue = isOverdue(task.dueDate, task.stage);
                  const daysLeft = getDaysRemaining(task.dueDate);
                  const completedSubs = task.subtasks.filter((s) => s.completed).length;
                  const totalSubs = task.subtasks.length;
                  const priority = priorityMeta[task.priority] || priorityMeta.medium;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onTaskClick(task)}
                      className="group bg-white rounded-lg p-3.5 border border-slate-200/90 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer select-none"
                    >
                      {/* Zero-Pill Metadata Line */}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-medium text-slate-700 truncate">{task.category || 'ทั่วไป'}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className={priority.textClass}>{priority.label}</span>
                        </div>

                        {/* Stage quick switch buttons */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {getPrevStage(task.stage) && (
                            <button
                              onClick={() => onUpdateStage(task.id, getPrevStage(task.stage)!)}
                              className="p-0.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                              title="ย้ายกลับ"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {getNextStage(task.stage) && (
                            <button
                              onClick={() => onUpdateStage(task.id, getNextStage(task.stage)!)}
                              className="p-0.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                              title="ย้ายไปขั้นถัดไป"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </h4>

                      {/* Description preview if present */}
                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-2.5">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks progress bar if any */}
                      {totalSubs > 0 && (
                        <div className="mb-2.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3 text-slate-400" />
                              งานย่อย
                            </span>
                            <span className="font-mono tabular-nums">
                              {completedSubs}/{totalSubs}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-slate-700 h-full rounded-full transition-all"
                              style={{ width: `${(completedSubs / totalSubs) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Card Bottom: Date info + Assignee */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {isTaskOverdue ? (
                            <span className="text-rose-600 font-medium">
                              เลยกำหนด ({task.dueDate})
                            </span>
                          ) : daysLeft === 0 ? (
                            <span className="text-amber-600 font-medium">
                              ส่งวันนี้
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Assignee */}
                        {assignee && (
                          <div className="flex items-center gap-1" title={`${assignee.name} (${assignee.role})`}>
                            {assignee.avatarUrl ? (
                              <img
                                src={assignee.avatarUrl}
                                alt={assignee.name}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className={`w-5 h-5 rounded-full text-white text-[9px] font-semibold flex items-center justify-center ${assignee.color}`}>
                                {assignee.initials}
                              </div>
                            )}
                            <span className="text-slate-600 max-w-[80px] truncate">
                              {assignee.name.split(' ')[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick add footer */}
            <div className="p-2 border-t border-slate-200/80">
              <button
                onClick={() => onQuickAddTask(col.stage)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มงาน</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
