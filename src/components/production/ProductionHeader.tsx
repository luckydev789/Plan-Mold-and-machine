import React from 'react';
import { 
  Cpu, 
  Layers, 
  GanttChartSquare, 
  Table, 
  Sparkles
} from 'lucide-react';

export type ProductionViewMode = 'machine' | 'job' | 'timeline' | 'master';

interface ProductionHeaderProps {
  currentView: ProductionViewMode;
  onViewChange: (view: ProductionViewMode) => void;
  onOpenUpload?: () => void;
  onExportCSV?: () => void;
  onOpenAIAdvisor: () => void;
  onOpenExportBundle?: () => void;
  totalTasks: number;
  totalMachines: number;
  totalJobs: number;
  lastUploadTime?: string;
}

export const ProductionHeader: React.FC<ProductionHeaderProps> = ({
  currentView,
  onViewChange,
  onOpenUpload,
  onExportCSV,
  onOpenAIAdvisor,
  onOpenExportBundle,
  totalTasks,
  totalMachines,
  totalJobs,
  lastUploadTime,
}) => {

  const tabs: { id: ProductionViewMode; label: string; icon: React.ReactNode }[] = [

    { id: 'machine', label: 'แดชบอร์ดเครื่องจักร (Machine-Centric)', icon: <Cpu className="w-4 h-4" /> },
    { id: 'job', label: 'แดชบอร์ดกลุ่มงาน (Job-Centric)', icon: <Layers className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline & Gantt Chart', icon: <GanttChartSquare className="w-4 h-4" /> },
    { id: 'master', label: 'ตารางข้อมูลหลัก (All Data)', icon: <Table className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6 h-16">
        {/* Zone 1: Single text element wordmark with brand identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-inner">
            M
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>MoldCraft MPS</span>
              <span className="hidden sm:inline text-[11px] font-normal text-slate-400">
                ระบบวางแผนการผลิตแม่พิมพ์และเครื่องจักร
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono tabular-nums">
              <span>{totalMachines} เครื่องจักร</span>
              <span aria-hidden="true">·</span>
              <span>{totalJobs} โครงการ/Job</span>
              <span aria-hidden="true">·</span>
              <span>{totalTasks} รายการงาน</span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (View Tabs) */}
        <nav className="hidden xl:flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
          {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAIAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 rounded-lg transition-colors whitespace-nowrap"
            title="ผู้ช่วยวิเคราะห์กำลังการผลิตและคอขวดด้วย AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">วิเคราะห์กำลังการผลิต AI</span>
            <span className="md:hidden">AI</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Tab Bar */}
      <div className="xl:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-slate-800/90 border-t border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap rounded-md ${
              currentView === tab.id
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
