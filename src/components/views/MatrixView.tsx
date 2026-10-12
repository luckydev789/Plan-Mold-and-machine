import React from 'react';
import { PlannerTask, Priority, Assignee } from '../../types/planner';
import { isOverdue } from '../../utils/exportImport';
import { Flame, Calendar, Users, Archive, Plus } from 'lucide-react';

interface MatrixViewProps {
  tasks: PlannerTask[];
  assignees: Assignee[];
  onTaskClick: (task: PlannerTask) => void;
  onUpdatePriority: (taskId: string, priority: Priority) => void;
  onQuickAddTaskWithPriority: (priority: Priority) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  tasks,
  assignees,
  onTaskClick,
  onUpdatePriority,
  onQuickAddTaskWithPriority,
}) => {
  const assigneeMap = new Map(assignees.map((a) => [a.id, a]));

  // Categorize tasks into Eisenhower quadrants:
  // Q1: ด่วนและสำคัญ (Do First) => priority === 'urgent'
  // Q2: สำคัญแต่ไม่ด่วน (Plan/Schedule) => priority === 'high'
  // Q3: ด่วนแต่สำคัญน้อย (Delegate) => priority === 'medium'
  // Q4: ไม่ด่วนและไม่สำคัญ (Eliminate/Backlog) => priority === 'low'
  const quadrants: {
    priority: Priority;
    title: string;
    action: string;
    sub: string;
    border: string;
    headerBg: string;
    icon: React.ReactNode;
  }[] = [
    {
      priority: 'urgent',
      title: '1. ด่วน & สำคัญมาก',
      action: 'ทำทันที (Do First)',
      sub: 'ส่งผลกระทบต่อวิกฤต หรือใกล้เส้นตายมากที่สุด',
      border: 'border-rose-200',
      headerBg: 'bg-rose-50/70 text-rose-900',
      icon: <Flame className="w-4 h-4 text-rose-600" />,
    },
    {
      priority: 'high',
      title: '2. สำคัญ แต่ไม่ด่วน',
      action: 'วางแผนกำหนดวัน (Schedule)',
      sub: 'เป้าหมายเชิงกลยุทธ์ การพัฒนา และการป้องกันปัญหา',
      border: 'border-indigo-200',
      headerBg: 'bg-indigo-50/70 text-indigo-900',
      icon: <Calendar className="w-4 h-4 text-indigo-600" />,
    },
    {
      priority: 'medium',
      title: '3. ด่วน แต่สำคัญน้อย',
      action: 'มอบหมายหรือแบ่งงาน (Delegate)',
      sub: 'งานประสานงาน กิจกรรมแทรก หรือธุรการทั่วไป',
      border: 'border-amber-200',
      headerBg: 'bg-amber-50/70 text-amber-900',
      icon: <Users className="w-4 h-4 text-amber-600" />,
    },
    {
      priority: 'low',
      title: '4. ไม่ด่วน & สำคัญน้อย',
      action: 'ลดทอนหรือเก็บไว้ (Backlog)',
      sub: 'งานที่ทำเมื่อมีเวลาเหลือ หรือลดทอนลงได้',
      border: 'border-slate-200',
      headerBg: 'bg-slate-100 text-slate-800',
      icon: <Archive className="w-4 h-4 text-slate-500" />,
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Intro info bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            เมทริกซ์บริหารเวลาและความสำคัญ (Eisenhower Priority Matrix)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดหมวดหมู่งานตามความเร่งด่วนและความสำคัญ เพื่อเพิ่มผลผลิตสูงสุดและลดความเครียดจากการจัดการเวลา
          </p>
        </div>
      </div>

      {/* 2x2 Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const qTasks = tasks.filter((t) => t.priority === q.priority);

          return (
            <div
              key={q.priority}
              className={`bg-white rounded-xl border ${q.border} shadow-xs flex flex-col min-h-[320px] overflow-hidden`}
            >
              {/* Quadrant Header */}
              <div className={`p-4 border-b border-slate-200/80 ${q.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/80 rounded-lg shadow-2xs">
                    {q.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold">{q.title}</h4>
                      <span className="text-[11px] font-mono tabular-nums font-semibold opacity-75">
                        ({qTasks.length})
                      </span>
                    </div>
                    <p className="text-[11px] font-medium opacity-90">{q.action}</p>
                  </div>
                </div>

                <button
                  onClick={() => onQuickAddTaskWithPriority(q.priority)}
                  className="p-1 bg-white/80 hover:bg-white text-slate-700 rounded-lg shadow-2xs transition-colors"
                  title={`เพิ่มงานระดับ ${q.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quadrant Task List */}
              <div className="p-3 overflow-y-auto space-y-2 flex-1 max-h-[360px]">
                {qTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    ไม่มีงานในส่วนนี้
                  </div>
                ) : (
                  qTasks.map((task) => {
                    const assignee = assigneeMap.get(task.assigneeId);
                    const overdue = isOverdue(task.dueDate, task.stage);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="bg-slate-50/70 hover:bg-white rounded-lg p-3 border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-medium text-slate-700 truncate">{task.category || 'ทั่วไป'}</span>
                          <span className="font-mono tabular-nums text-[11px]">
                            {overdue ? (
                              <span className="text-rose-600 font-semibold">เลยกำหนดส่ง ({task.dueDate})</span>
                            ) : (
                              <span>ครบ {task.dueDate}</span>
                            )}
                          </span>
                        </div>

                        <h5 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                          {task.title}
                        </h5>

                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60">
                          <span className="text-slate-500 font-mono tabular-nums">
                            {task.stage === 'completed'
                              ? 'เสร็จสิ้นแล้ว'
                              : task.stage === 'in_progress'
                              ? 'กำลังทำ'
                              : task.stage === 'review'
                              ? 'รอตรวจ'
                              : 'รอดำเนินการ'}
                          </span>

                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              {assignee.avatarUrl ? (
                                <img
                                  src={assignee.avatarUrl}
                                  alt={assignee.name}
                                  referrerPolicy="no-referrer"
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`w-4 h-4 rounded-full text-white text-[8px] font-semibold flex items-center justify-center ${assignee.color}`}>
                                  {assignee.initials}
                                </div>
                              )}
                              <span className="text-slate-600 max-w-[90px] truncate">{assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
