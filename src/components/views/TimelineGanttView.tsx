import React, { useState, useMemo } from 'react';
import { PlannerTask, Assignee } from '../../types/planner';
import { isOverdue } from '../../utils/exportImport';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface TimelineGanttViewProps {
  tasks: PlannerTask[];
  assignees: Assignee[];
  onTaskClick: (task: PlannerTask) => void;
}

export const TimelineGanttView: React.FC<TimelineGanttViewProps> = ({
  tasks,
  assignees,
  onTaskClick,
}) => {
  const [viewOffsetDays, setViewOffsetDays] = useState(0);
  const assigneeMap = new Map(assignees.map((a) => [a.id, a]));

  const daysToShow = 28; // 4-week window

  // Calculate day headers
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    // start a few days before base + viewOffsetDays
    const start = new Date(base);
    start.setDate(start.getDate() - 4 + viewOffsetDays);

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [viewOffsetDays]);

  const startDateRange = timelineDates[0];
  const endDateRange = timelineDates[timelineDates.length - 1];

  const thaiDayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const stageBarStyles: Record<string, { bg: string; border: string }> = {
    completed: { bg: 'bg-emerald-500', border: 'border-emerald-600' },
    in_progress: { bg: 'bg-indigo-600', border: 'border-indigo-700' },
    review: { bg: 'bg-amber-500', border: 'border-amber-600' },
    todo: { bg: 'bg-slate-400', border: 'border-slate-500' },
  };

  // Convert date string YYYY-MM-DD to day index in the current timeline view
  const getDayIndex = (dateStr: string) => {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - startDateRange.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Timeline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-semibold">
            {startDateRange.getDate()} {thaiMonths[startDateRange.getMonth()]} -{' '}
            {endDateRange.getDate()} {thaiMonths[endDateRange.getMonth()]}{' '}
            {endDateRange.getFullYear() + 543}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewOffsetDays((prev) => prev - 7)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="สัปดาห์ก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewOffsetDays(0)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            วันนี้ (Today)
          </button>
          <button
            onClick={() => setViewOffsetDays((prev) => prev + 7)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="สัปดาห์ถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gantt Chart Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[950px]">
            {/* Header row */}
            <div className="grid grid-cols-[280px_1fr] border-b border-slate-200 bg-slate-50">
              <div className="p-3 font-semibold text-xs text-slate-600 border-r border-slate-200">
                ชื่องานและผู้รับผิดชอบ
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(28px, 1fr))` }}>
                {timelineDates.map((d, i) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const isToday = dateStr === todayStr;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                  return (
                    <div
                      key={i}
                      className={`text-center py-2 text-[11px] border-r border-slate-100 ${
                        isToday ? 'bg-indigo-50 font-bold text-indigo-700' : isWeekend ? 'bg-slate-100/50 text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      <div className="text-[10px] uppercase">{thaiDayNames[d.getDay()]}</div>
                      <div className="font-mono tabular-nums">{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Task rows */}
            <div className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-400">
                  ไม่มีงานที่ตรงกับเงื่อนไขการค้นหา
                </div>
              ) : (
                tasks.map((task) => {
                  const assignee = assigneeMap.get(task.assigneeId);
                  const startIdx = getDayIndex(task.startDate);
                  const endIdx = getDayIndex(task.dueDate);
                  const barStyle = stageBarStyles[task.stage] || stageBarStyles.todo;
                  const overdue = isOverdue(task.dueDate, task.stage);

                  // Calculate position in the visible grid
                  const clampedStart = Math.max(0, startIdx);
                  const clampedEnd = Math.min(daysToShow - 1, Math.max(clampedStart, endIdx));
                  const isVisible = endIdx >= 0 && startIdx < daysToShow;
                  const spanDays = Math.max(1, clampedEnd - clampedStart + 1);

                  const completedSubs = task.subtasks.filter((s) => s.completed).length;
                  const totalSubs = task.subtasks.length;
                  const subPct = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="grid grid-cols-[280px_1fr] hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Left Column: Task details */}
                      <div className="p-3 border-r border-slate-200 flex items-center justify-between gap-2 overflow-hidden">
                        <div className="truncate min-w-0">
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="truncate">{task.category || 'ทั่วไป'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{task.estimatedHours}ชม.</span>
                            {overdue && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-rose-600 font-medium">เกินกำหนด</span>
                              </>
                            )}
                          </div>
                        </div>

                        {assignee && (
                          <div className="shrink-0" title={assignee.name}>
                            {assignee.avatarUrl ? (
                              <img
                                src={assignee.avatarUrl}
                                alt={assignee.name}
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className={`w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center ${assignee.color}`}>
                                {assignee.initials}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right Column: Timeline Grid & Bar */}
                      <div
                        className="relative grid items-center h-14"
                        style={{ gridTemplateColumns: `repeat(${daysToShow}, minmax(28px, 1fr))` }}
                      >
                        {/* Background day column borders */}
                        {timelineDates.map((d, i) => {
                          const dateStr = d.toISOString().split('T')[0];
                          const isToday = dateStr === todayStr;
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                          return (
                            <div
                              key={i}
                              className={`h-full border-r border-slate-100 ${
                                isToday ? 'bg-indigo-50/40' : isWeekend ? 'bg-slate-50/50' : ''
                              }`}
                            />
                          );
                        })}

                        {/* Task duration bar */}
                        {isVisible && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md text-white text-[11px] flex items-center px-2.5 shadow-xs overflow-hidden transition-all group-hover:brightness-105"
                            style={{
                              left: `calc(${(clampedStart / daysToShow) * 100}% + 2px)`,
                              width: `calc(${(spanDays / daysToShow) * 100}% - 4px)`,
                              backgroundColor: task.stage === 'completed' ? '#10B981' : task.stage === 'review' ? '#F59E0B' : task.stage === 'in_progress' ? '#4F46E5' : '#64748B',
                            }}
                          >
                            {/* Inner progress fill */}
                            {totalSubs > 0 && (
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-white/20 pointer-events-none"
                                style={{ width: `${subPct}%` }}
                              />
                            )}
                            <span className="relative z-10 truncate font-medium text-[11px]">
                              {task.title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
