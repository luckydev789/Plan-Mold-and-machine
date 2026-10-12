import React, { useState, useMemo } from 'react';
import { ProductionTask, MachineSummary, JobSummary } from '../../types/production';
import { 
  Calendar, 
  Filter
} from 'lucide-react';

export type GanttTimeMode = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'overview';

interface ProductionGanttProps {
  tasks: ProductionTask[];
  machineSummaries: MachineSummary[];
  jobSummaries: JobSummary[];
  initialFilterType?: 'all' | 'machine' | 'job';
  initialFilterValue?: string;
  onSelectMachine?: (machineName: string) => void;
  onSelectJob?: (jobWbs: string) => void;
}

interface GanttTimeColumn {
  label: string;
  sub: string;
  startTime: number;
  endTime: number;
  isWeekend?: boolean;
}

export const ProductionGantt: React.FC<ProductionGanttProps> = ({
  tasks,
  machineSummaries,
  jobSummaries,
  initialFilterType = 'all',
  initialFilterValue = '',
}) => {
  // Default to 'daily' (24 ชม.)
  const [timeMode, setTimeMode] = useState<GanttTimeMode>('daily');
  const [filterType, setFilterType] = useState<'all' | 'machine' | 'job'>(initialFilterType);
  const [selectedFilterVal, setSelectedFilterVal] = useState<string>(initialFilterValue);
  const [hoveredTask, setHoveredTask] = useState<ProductionTask | null>(null);

  // Group colors for bars
  const groupColors: Record<string, { bg: string; text: string }> = {
    Lathe: { bg: '#0284C7', text: '#FFFFFF' },        // Sky 600
    Milling: { bg: '#4F46E5', text: '#FFFFFF' },      // Indigo 600
    Millling: { bg: '#4F46E5', text: '#FFFFFF' },     // typo from CSV
    Turnmill: { bg: '#7C3AED', text: '#FFFFFF' },     // Violet 600
    QC: { bg: '#059669', text: '#FFFFFF' },           // Emerald 600
    Wirecut: { bg: '#D97706', text: '#FFFFFF' },      // Amber 600
    EDM: { bg: '#EA580C', text: '#FFFFFF' },          // Orange 600
    Grinding: { bg: '#475569', text: '#FFFFFF' },     // Slate 600
    Laser: { bg: '#DC2626', text: '#FFFFFF' },        // Red 600
    Gundrill: { bg: '#0D9488', text: '#FFFFFF' },     // Teal 600
    Hardenning: { bg: '#B45309', text: '#FFFFFF' },   // Amber 700
    Assembly: { bg: '#2563EB', text: '#FFFFFF' },     // Blue 600
  };

  // Filter tasks based on view context
  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) => !t.isSummary && t.startTime > 0 && t.finishTime > 0);

    if (filterType === 'machine' && selectedFilterVal) {
      list = list.filter((t) => t.resourceNames?.split(',').map((r) => r.trim()).includes(selectedFilterVal));
    } else if (filterType === 'job' && selectedFilterVal) {
      list = list.filter((t) => t.wbs === selectedFilterVal || t.wbs.startsWith(`${selectedFilterVal}.`));
    }

    return list.sort((a, b) => a.startTime - b.startTime);
  }, [tasks, filterType, selectedFilterVal]);

  // Determine global timeline boundaries (earliest to latest)
  const { minTime, maxTime } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    tasks.forEach((t) => {
      if (t.startTime > 0 && t.startTime < min) min = t.startTime;
      if (t.finishTime > 0 && t.finishTime > max) max = t.finishTime;
    });

    if (!isFinite(min)) min = new Date(2025, 8, 30).getTime();
    if (!isFinite(max)) max = new Date(2026, 6, 15).getTime();

    // Add padding
    const pad = 1000 * 60 * 60 * 24 * 7; // 7 days
    return { minTime: min - pad, maxTime: max + pad };
  }, [tasks]);

  // Build time ticks/columns based on timeMode
  const { timeColumns, totalSpanMs } = useMemo(() => {
    const cols: GanttTimeColumn[] = [];
    const span = maxTime - minTime;

    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    if (timeMode === 'yearly' || timeMode === 'overview') {
      let curr = new Date(minTime);
      curr.setDate(1);
      curr.setHours(0, 0, 0, 0);

      while (curr.getTime() <= maxTime) {
        const next = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
        cols.push({
          label: `${thaiMonths[curr.getMonth()]} ${curr.getFullYear() + 543}`,
          sub: `Q${Math.floor(curr.getMonth() / 3) + 1}`,
          startTime: curr.getTime(),
          endTime: next.getTime(),
        });
        curr = next;
      }
    } else if (timeMode === 'monthly') {
      let curr = new Date(minTime);
      curr.setHours(0, 0, 0, 0);

      while (curr.getTime() <= maxTime) {
        const next = new Date(curr);
        next.setDate(next.getDate() + 14);
        cols.push({
          label: `${curr.getDate()} ${thaiMonths[curr.getMonth()]}`,
          sub: `${curr.getFullYear() + 543}`,
          startTime: curr.getTime(),
          endTime: next.getTime(),
        });
        curr = next;
      }
    } else if (timeMode === 'weekly') {
      let curr = new Date(minTime);
      curr.setHours(0, 0, 0, 0);

      while (curr.getTime() <= maxTime) {
        const next = new Date(curr);
        next.setDate(next.getDate() + 7);
        cols.push({
          label: `สัปดาห์ ${curr.getDate()} ${thaiMonths[curr.getMonth()]}`,
          sub: `Wk`,
          startTime: curr.getTime(),
          endTime: next.getTime(),
        });
        curr = next;
      }
    } else {
      // Daily mode: 1-day slices (24 ชม. ต่อวัน)
      let curr = new Date(minTime);
      curr.setHours(0, 0, 0, 0);

      while (curr.getTime() <= maxTime) {
        const next = new Date(curr);
        next.setDate(next.getDate() + 1);
        const dayOfWeek = curr.getDay();
        cols.push({
          label: `${curr.getDate()}`,
          sub: `${thaiMonths[curr.getMonth()]}`,
          startTime: curr.getTime(),
          endTime: next.getTime(),
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        });
        curr = next;
      }
    }

    return { timeColumns: cols, totalSpanMs: span };
  }, [timeMode, minTime, maxTime]);

  // Compute position percentage for any timestamp
  const getPositionPercent = (time: number) => {
    const clamped = Math.max(minTime, Math.min(maxTime, time));
    return ((clamped - minTime) / totalSpanMs) * 100;
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Gantt Top Controls & Mode Switchers */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Interactive Visual Timeline
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                ระบบแถบสีเชื่อมโยงแผนงานเครื่องจักรและลำดับโครงการ
              </span>
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 mt-0.5">
              โมดูลระบบ Timeline & Gantt Chart อัจฉริยะ
            </h2>
          </div>

          {/* View Mode Buttons (Daily 24h, Weekly, Monthly, Yearly, Overview) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'daily', label: 'รายวัน (24 ชม.)' },
                { id: 'weekly', label: 'รายสัปดาห์' },
                { id: 'monthly', label: 'รายเดือน' },
                { id: 'yearly', label: 'รายปี' },
                { id: 'overview', label: 'ภาพรวมทั้งหมด (Overview)' },
              ] as { id: GanttTimeMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setTimeMode(m.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  timeMode === m.id
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Strip: Contextual Machine or Job Switching */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              การแสดงผลเชื่อมโยง:
            </span>

            {/* Scope selection */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => {
                  setFilterType('all');
                  setSelectedFilterVal('');
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterType === 'all' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                ทั้งหมด ({tasks.length})
              </button>
              <button
                onClick={() => {
                  setFilterType('machine');
                  if (!selectedFilterVal && machineSummaries[0]) {
                    setSelectedFilterVal(machineSummaries[0].name);
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterType === 'machine' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                เฉพาะเครื่องจักร
              </button>
              <button
                onClick={() => {
                  setFilterType('job');
                  if (!selectedFilterVal && jobSummaries[0]) {
                    setSelectedFilterVal(jobSummaries[0].wbs);
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterType === 'job' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                เฉพาะโครงการ (Job)
              </button>
            </div>

            {/* Context Dropdown when machine or job selected */}
            {filterType === 'machine' && (
              <select
                value={selectedFilterVal}
                onChange={(e) => setSelectedFilterVal(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                {machineSummaries.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.totalScheduledHours}h)
                  </option>
                ))}
              </select>
            )}

            {filterType === 'job' && (
              <select
                value={selectedFilterVal}
                onChange={(e) => setSelectedFilterVal(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                {jobSummaries.map((j) => (
                  <option key={j.wbs} value={j.wbs}>
                    [{j.wbs}] {j.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">แผนก:</span>
              {['Lathe', 'Milling', 'Turnmill', 'EDM', 'Wirecut', 'QC', 'Laser'].map((grp) => {
                const c = groupColors[grp];
                return (
                  <div key={grp} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.bg }} />
                    <span>{grp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* Gantt Header Grid */}
            <div className="grid grid-cols-[320px_1fr] border-b border-slate-200 bg-slate-50/90 text-slate-700">
              <div className="p-3 font-semibold text-xs border-r border-slate-200 flex items-center justify-between">
                <span>กิจกรรม & เครื่องจักรที่ใช้งาน</span>
                <span className="font-mono tabular-nums text-slate-400 font-normal">
                  {filteredTasks.length} รายการ
                </span>
              </div>

              {/* Time Column Headers */}
              <div className="flex relative">
                {timeColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 min-w-[50px] p-2 text-center border-r border-slate-200/80 text-[11px] ${
                      col.isWeekend ? 'bg-slate-100/60 text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    <div className="font-bold leading-tight">{col.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{col.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-slate-100 relative">
              {filteredTasks.length === 0 ? (
                <div className="p-16 text-center text-xs text-slate-400">
                  ไม่พบรายการกิจกรรมตามเงื่อนไขที่เลือก
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const leftPct = getPositionPercent(task.startTime);
                  const rightPct = getPositionPercent(task.finishTime);
                  const widthPct = Math.max(0.8, rightPct - leftPct);

                  const groupColor = groupColors[task.resourceGroup] || { bg: '#475569', text: '#FFFFFF' };
                  const isFinished = task.percentComplete >= 100;

                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-[320px_1fr] hover:bg-slate-50/80 transition-colors group relative"
                    >
                      {/* Left: Task Summary Information */}
                      <div className="p-2.5 border-r border-slate-200 flex items-center justify-between gap-2 overflow-hidden">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
                            <span className="font-mono tabular-nums font-semibold text-slate-800">
                              {task.wbs}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{task.resourceGroup || '-'}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 truncate" title={task.name}>
                            {task.name}
                          </p>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-indigo-700">{task.resourceNames || '-'}</span>
                            {task.resourceInitials && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{task.resourceInitials}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-[11px] font-mono tabular-nums shrink-0">
                          <div className="font-bold text-slate-800">{task.scheduledHours}h</div>
                          <div className={isFinished ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                            {task.percentComplete}%
                          </div>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Track */}
                      <div className="relative h-14 flex items-center px-1">
                        {/* Background column lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {timeColumns.map((col, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 border-r border-slate-100 ${
                                col.isWeekend ? 'bg-slate-50/40' : ''
                              }`}
                            />
                          ))}
                        </div>

                        {/* Interactive Task Time-Bar */}
                        <div
                          onMouseEnter={() => setHoveredTask(task)}
                          onMouseLeave={() => setHoveredTask(null)}
                          className="absolute h-7 rounded-md shadow-xs flex items-center px-2 text-white text-[11px] cursor-pointer transition-all hover:brightness-110 hover:shadow-md overflow-hidden select-none"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: groupColor.bg,
                          }}
                        >
                          {/* Inner Completed fill ratio */}
                          {task.percentComplete > 0 && (
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-white/20 pointer-events-none"
                              style={{ width: `${task.percentComplete}%` }}
                            />
                          )}

                          <span className="relative z-10 truncate font-semibold text-[11px] drop-shadow-xs">
                            {task.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip Detail Box */}
      {hoveredTask && (
        <div className="fixed bottom-6 right-6 z-40 bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-800 text-xs max-w-sm pointer-events-none animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-mono font-bold text-indigo-400">WBS: {hoveredTask.wbs}</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-300">
              {hoveredTask.resourceGroup}
            </span>
          </div>
          <h4 className="font-bold text-sm text-white mb-2">{hoveredTask.name}</h4>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">เครื่องจักร:</span>
              <span className="font-semibold text-white">{hoveredTask.resourceNames || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ช่างผู้รับผิดชอบ:</span>
              <span>{hoveredTask.resourceInitials || '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ช่วงเวลาทำงาน (24 ชม.):</span>
              <span className="font-mono text-[11px] text-amber-300 font-semibold">{hoveredTask.startDate} → {hoveredTask.finishDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ชั่วโมงตามแผน (OT):</span>
              <span className="font-mono font-semibold">{hoveredTask.scheduledWork} (OT: {hoveredTask.overtimeWork || '0h'})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ความคืบหน้า:</span>
              <span className="font-mono font-bold text-emerald-400">{hoveredTask.percentComplete}%</span>
            </div>
            {hoveredTask.cost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ต้นทุน:</span>
                <span className="font-mono">{hoveredTask.cost.toLocaleString('th-TH')} บาท</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
