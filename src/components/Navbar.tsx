import React from 'react';
import { ViewMode } from '../types/planner';
import { 
  Kanban, 
  Calendar as CalendarIcon, 
  ListTodo, 
  GanttChartSquare, 
  Grid2X2, 
  Sparkles, 
  Plus,
  Menu
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenNewTask: () => void;
  onOpenAIPlanner: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenNewTask,
  onOpenAIPlanner,
  onToggleSidebar,
}) => {
  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'kanban', label: 'Kanban บอร์ด', icon: <Kanban className="w-4 h-4" /> },
    { id: 'timeline', label: 'ไทม์ไลน์ Gantt', icon: <GanttChartSquare className="w-4 h-4" /> },
    { id: 'table', label: 'ตารางงาน', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'calendar', label: 'ปฏิทินงาน', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'matrix', label: 'เมทริกซ์ด่วน/สำคัญ', icon: <Grid2X2 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between gap-6 px-4 lg:px-6 h-16">
        {/* Zone 1: Brand wordmark & mobile sidebar toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg lg:hidden hover:bg-slate-100 transition-colors"
            title="สลับเมนูด้านข้าง"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-base shadow-sm">
              P
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              PlanCraft
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links for Views */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
          {views.map((v) => {
            const isActive = currentView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {v.icon}
                <span>{v.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAIPlanner}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">วางแผนด้วย AI</span>
            <span className="sm:hidden">AI Plan</span>
          </button>
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Mobile view selector strip */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-100">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap rounded-md ${
              currentView === v.id
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {v.icon}
            <span>{v.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
