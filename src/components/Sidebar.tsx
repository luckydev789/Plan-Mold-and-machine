import React, { useRef } from 'react';
import { Project, PlannerTask, Assignee, FilterState } from '../types/planner';
import { isOverdue } from '../utils/exportImport';
import { 
  FolderKanban, 
  Plus, 
  Layers, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Bot,
  Hash,
  X,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
  tasks: PlannerTask[];
  assignees: Assignee[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onOpenAIAdvisor: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProject,
  tasks,
  assignees,
  filters,
  onFilterChange,
  onOpenAIAdvisor,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  isOpen,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Calculate project metrics
  const projectTasks = tasks.filter((t) => t.projectId === activeProjectId);
  const completedTasks = projectTasks.filter((t) => t.stage === 'completed').length;
  const totalTasks = projectTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayCount = projectTasks.filter((t) => t.dueDate === todayStr && t.stage !== 'completed').length;
  const overdueCount = projectTasks.filter((t) => isOverdue(t.dueDate, t.stage)).length;
  const highPriorityCount = projectTasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.stage !== 'completed').length;

  const totalEstimatedHours = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalLoggedHours = projectTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

  // Extract unique categories
  const categories = Array.from(new Set(projectTasks.map((t) => t.category).filter(Boolean)));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const projectColorMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header & Project Picker */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              โครงการ (Project)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenNewProject}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="สร้างโครงการใหม่"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md lg:hidden transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Project Switcher Select */}
          <div className="relative">
            <select
              value={activeProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Active Project Progress Box */}
          {activeProject && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-medium">ความคืบหน้าโครงการ</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-slate-900 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{completedTasks}/{totalTasks} งานเสร็จสิ้น</span>
                <span className="font-mono tabular-nums">{totalLoggedHours}/{totalEstimatedHours} ชม.</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation / Filters */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Quick Filters */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
              มุมมองกรองด่วน
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onFilterChange({ quickFilter: 'all' })}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors ${
                  filters.quickFilter === 'all'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>งานทั้งหมด</span>
                </div>
                <span className={`text-[11px] font-mono tabular-nums ${filters.quickFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {projectTasks.length}
                </span>
              </button>

              <button
                onClick={() => onFilterChange({ quickFilter: 'due_today' })}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors ${
                  filters.quickFilter === 'due_today'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>กำหนดส่งวันนี้</span>
                </div>
                <span className={`text-[11px] font-mono tabular-nums ${filters.quickFilter === 'due_today' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {dueTodayCount}
                </span>
              </button>

              <button
                onClick={() => onFilterChange({ quickFilter: 'high_priority' })}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors ${
                  filters.quickFilter === 'high_priority'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>งานด่วน / สำคัญสูง</span>
                </div>
                <span className={`text-[11px] font-mono tabular-nums ${filters.quickFilter === 'high_priority' ? 'text-slate-300' : 'text-slate-500'}`}>
                  {highPriorityCount}
                </span>
              </button>

              <button
                onClick={() => onFilterChange({ quickFilter: 'overdue' })}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors ${
                  filters.quickFilter === 'overdue'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>เกินกำหนดส่ง</span>
                </div>
                <span className={`text-[11px] font-mono tabular-nums ${filters.quickFilter === 'overdue' ? 'text-slate-300' : overdueCount > 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                  {overdueCount}
                </span>
              </button>
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                หมวดหมู่งาน
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => onFilterChange({ category: '' })}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                    filters.category === ''
                      ? 'bg-slate-100 font-semibold text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ทุกหมวดหมู่
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onFilterChange({ category: cat })}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      filters.category === cat
                        ? 'bg-slate-100 font-semibold text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cat}</span>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {projectTasks.filter((t) => t.category === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
              สมาชิกในทีม ({assignees.length})
            </div>
            <div className="space-y-2">
              {assignees.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 px-2 py-1">
                  {a.avatarUrl ? (
                    <img
                      src={a.avatarUrl}
                      alt={a.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-full text-white text-[10px] font-semibold flex items-center justify-center ${a.color}`}>
                      {a.initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 truncate">{a.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{a.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: AI Advisor & Data Management */}
        <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/70">
          <button
            onClick={onOpenAIAdvisor}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200 rounded-lg transition-colors"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>ตรวจสุขภาพโครงการด้วย AI</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onExportCSV}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="ส่งออกรายงาน Excel (CSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>ส่งออก CSV</span>
            </button>
            <button
              onClick={onExportJSON}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="สำรองข้อมูล JSON ทั้งหมด"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>สำรอง JSON</span>
            </button>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>นำเข้าข้อมูลจากไฟล์ JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
        </div>
      </aside>
    </>
  );
};
