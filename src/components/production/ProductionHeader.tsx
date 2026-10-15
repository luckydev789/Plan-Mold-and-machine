import React, { useMemo } from 'react';
import { 
  Cpu, 
  Layers, 
  GanttChartSquare, 
  Table, 
  Upload, 
  FileSpreadsheet, 
  Sparkles,
  RefreshCw,
  FileCode,
  Clock
} from 'lucide-react';
import { formatDateTimeThai24h } from '../../utils/productionParser';

export type ProductionViewMode = 'machine' | 'job' | 'timeline' | 'master';

interface ProductionHeaderProps {
  currentView: ProductionViewMode;
  onViewChange: (view: ProductionViewMode) => void;
  onOpenUpload?: () => void;
  onExportCSV: () => void;
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
  const formattedTime = useMemo(() => formatDateTimeThai24h(lastUploadTime), [lastUploadTime]);

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
          {onOpenUpload && (
            <div className="flex flex-col items-center sm:items-end">
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                title="อัปโหลดไฟล์แผนงาน (.xlsx, .csv, .mpp) เพื่ออัปเดตระบบ"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">อัพโหลดไฟล์</span>
                <span className="sm:hidden">อัพโหลด</span>
              </button>
              <div 
                className="flex items-center gap-1 text-[10px] text-slate-300 font-mono mt-0.5 whitespace-nowrap"
                title="วันที่และเวลาที่มีการอัปโหลดหรืออัปเดตแผนงานล่าสุด (24 ชั่วโมง)"
              >
                <Clock className="w-2.5 h-2.5 text-indigo-300 shrink-0" />
                <span>วันที่ {formattedTime.dateStr} {formattedTime.timeStr} น.</span>
              </div>
            </div>
          )}

          <button
            onClick={onOpenAIAdvisor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 rounded-lg transition-colors whitespace-nowrap"
            title="ผู้ช่วยวิเคราะห์กำลังการผลิตและคอขวดด้วย AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">วิเคราะห์กำลังการผลิต AI</span>
            <span className="md:hidden">AI</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            title="ส่งออกข้อมูลเป็น Excel CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>

          {onOpenExportBundle && (
            <button
              onClick={onOpenExportBundle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-sky-950/80 hover:bg-sky-900 border border-sky-700/70 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              title="ขอไฟล์ .js และ .html (ดาวน์โหลดชุด Production Bundle)"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">ขอไฟล์ .js & .html</span>
              <span className="md:hidden">.js/.html</span>
            </button>
          )}
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
