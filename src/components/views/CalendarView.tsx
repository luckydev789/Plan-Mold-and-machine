import React, { useState } from 'react';
import { PlannerTask } from '../../types/planner';
import { isOverdue } from '../../utils/exportImport';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarViewProps {
  tasks: PlannerTask[];
  onTaskClick: (task: PlannerTask) => void;
  onAddTaskOnDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onTaskClick,
  onAddTaskOnDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const thaiDays = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  // Calculate calendar grid
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const prevMonthDaysToShow = firstDayIndex;
  const totalSlots = Math.ceil((prevMonthDaysToShow + daysInMonth) / 7) * 7;
  const nextMonthDaysToShow = totalSlots - (prevMonthDaysToShow + daysInMonth);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const todayStr = new Date().toISOString().split('T')[0];

  // Group tasks by dueDate
  const tasksByDate = tasks.reduce<Record<string, PlannerTask[]>>((acc, t) => {
    if (!acc[t.dueDate]) acc[t.dueDate] = [];
    acc[t.dueDate].push(t);
    return acc;
  }, {});

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-900">
          {thaiMonths[month]} {year + 543}
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            วันนี้ (Today)
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Day Name Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold text-xs text-center py-2.5">
          {thaiDays.map((d, i) => (
            <div key={i} className={i === 0 || i === 6 ? 'text-slate-400' : ''}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {/* Previous month filler */}
          {Array.from({ length: prevMonthDaysToShow }).map((_, i) => {
            const dayNum = prevMonthDays - prevMonthDaysToShow + i + 1;
            return (
              <div key={`prev-${i}`} className="min-h-[110px] p-2 bg-slate-50/50 text-slate-300 text-xs font-mono tabular-nums">
                {dayNum}
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dayTasks = tasksByDate[dateStr] || [];

            return (
              <div
                key={`current-${i}`}
                className={`min-h-[110px] p-2 flex flex-col justify-between group transition-colors hover:bg-slate-50/70 ${
                  isToday ? 'bg-indigo-50/30 ring-1 ring-inset ring-indigo-200' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  <button
                    onClick={() => onAddTaskOnDate(dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-200/60 transition-opacity"
                    title={`เพิ่มงานในวันที่ ${dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Tasks */}
                <div className="space-y-1 overflow-y-auto max-h-[85px]">
                  {dayTasks.slice(0, 3).map((task) => {
                    const overdue = isOverdue(task.dueDate, task.stage);
                    const isCompleted = task.stage === 'completed';

                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        className={`text-[11px] p-1.5 rounded border leading-tight truncate cursor-pointer transition-all ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                            : overdue
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300'
                            : task.priority === 'urgent'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-medium pl-1">
                      + อีก {dayTasks.length - 3} งาน
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Next month filler */}
          {Array.from({ length: nextMonthDaysToShow }).map((_, i) => (
            <div key={`next-${i}`} className="min-h-[110px] p-2 bg-slate-50/50 text-slate-300 text-xs font-mono tabular-nums">
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
