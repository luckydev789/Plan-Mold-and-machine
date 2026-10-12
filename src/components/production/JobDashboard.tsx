import React, { useState, useMemo } from 'react';
import { ProductionTask, JobSummary } from '../../types/production';
import { 
  Layers, 
  Clock, 
  Coins, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Cpu,
  User,
  Wrench,
  Search,
  Filter,
  Upload
} from 'lucide-react';

interface JobDashboardProps {
  tasks: ProductionTask[];
  jobSummaries: JobSummary[];
  selectedJobWbs: string;
  onSelectJob: (jobWbs: string) => void;
  onOpenGanttForJob: (jobWbs: string) => void;
  onSelectMachineFromJob?: (machineName: string) => void;
}

export const JobDashboard: React.FC<JobDashboardProps> = ({
  tasks,
  jobSummaries,
  selectedJobWbs,
  onSelectJob,
  onOpenGanttForJob,
  onSelectMachineFromJob,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract distinct top-level project categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    jobSummaries.forEach((j) => {
      if (j.category) set.add(j.category);
    });
    return Array.from(set);
  }, [jobSummaries]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobSummaries.filter((j) => {
      if (categoryFilter !== 'all' && j.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return j.name.toLowerCase().includes(q) || j.wbs.includes(q) || j.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [jobSummaries, categoryFilter, searchTerm]);

  // Current active job
  const activeJob = useMemo(() => {
    return jobSummaries.find((j) => j.wbs === selectedJobWbs) || filteredJobs[0] || jobSummaries[0];
  }, [jobSummaries, selectedJobWbs, filteredJobs]);

  // Tasks belonging to this job
  const jobTasks = useMemo(() => {
    if (!activeJob) return [];
    return tasks.filter((t) => {
      return t.wbs === activeJob.wbs || t.wbs.startsWith(`${activeJob.wbs}.`);
    }).sort((a, b) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }));
  }, [tasks, activeJob]);

  // Extract machine flow sequence from operational tasks
  const routingSequence = useMemo(() => {
    const operational = jobTasks.filter((t) => !t.isSummary && t.resourceNames);
    return operational.map((t) => ({
      name: t.name,
      machine: t.resourceNames,
      group: t.resourceGroup || 'การผลิต',
      operator: t.resourceInitials,
      hours: t.scheduledHours,
      completed: t.percentComplete >= 100,
      wbs: t.wbs,
    }));
  }, [jobTasks]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controller Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Job-Centric Management
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                ติดตามขั้นตอนการผลิตโครงการและชุดแม่พิมพ์ตาม WBS
              </span>
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 mt-0.5">
              แดชบอร์ดติดตามความคืบหน้าโครงการและแม่พิมพ์ (Job Tracking)
            </h2>
          </div>

          {/* Job Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              <option value="all">ทุกกลุ่มประเภทงาน</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Job Dropdown */}
            <select
              value={activeJob?.wbs || ''}
              onChange={(e) => onSelectJob(e.target.value)}
              className="bg-slate-900 text-white border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[280px]"
            >
              {filteredJobs.map((j) => (
                <option key={j.wbs} value={j.wbs}>
                  [{j.wbs}] {j.name} ({j.totalHours}h | {j.percentComplete}%)
                </option>
              ))}
            </select>

            {/* Jump to Timeline button */}
            {activeJob && (
              <button
                onClick={() => onOpenGanttForJob(activeJob.wbs)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดดู Flow ใน Gantt</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Job KPI Cards */}
      {activeJob && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Job Identity & Category */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>WBS: {activeJob.wbs}</span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] truncate max-w-[140px]">
                {activeJob.category}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate" title={activeJob.name}>
              {activeJob.name}
            </h3>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>รวม {activeJob.taskCount} ขั้นตอน</span>
              <span>ผ่าน {activeJob.machineCount} เครื่องจักร</span>
            </div>
          </div>

          {/* Card 2: Overall Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>ความคืบหน้ารวมของโครงการ</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {activeJob.percentComplete}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${activeJob.percentComplete}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>ชั่วโมงรวม: <strong className="font-mono tabular-nums text-slate-800">{activeJob.totalHours}h</strong></span>
              {activeJob.totalOvertimeHours > 0 && (
                <span className="text-amber-600 font-semibold">OT: {activeJob.totalOvertimeHours}h</span>
              )}
            </div>
          </div>

          {/* Card 3: Total Cost & Budget */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>ต้นทุนการผลิตสะสม (Cost)</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {activeJob.totalCost.toLocaleString('th-TH')}
              </span>
              <span className="text-xs text-slate-500">บาท</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>กลุ่มทรัพยากร:</span>
              <span className="truncate max-w-[150px] font-medium text-slate-700">
                {activeJob.groupsUsed.slice(0, 3).join(', ')}
              </span>
            </div>
          </div>

          {/* Card 4: Date Schedule Window */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>กำหนดการผลิตตามแผน</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">เริ่ม:</span>
                <span className="font-medium text-slate-800">{activeJob.startDate || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">สิ้นสุด:</span>
                <span className="font-medium text-slate-800">{activeJob.finishDate || '-'}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              สถานะ: {activeJob.percentComplete >= 100 ? 'เสร็จสิ้นครบถ้วน' : 'กำลังดำเนินการ'}
            </div>
          </div>
        </div>
      )}

      {/* Production Routing Sequence Flow Diagram */}
      {routingSequence.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              เส้นทางการผลิตต่อเนื่อง (Production Routing Sequence)
            </h4>
            <span className="text-xs text-slate-400">
              ลำดับการเคลื่อนย้ายชิ้นงานผ่านเครื่องจักร ({routingSequence.length} ขั้นตอน)
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {routingSequence.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div
                    onClick={() => onSelectMachineFromJob && onSelectMachineFromJob(step.machine.split(',')[0].trim())}
                    className={`p-3 rounded-lg border text-xs min-w-[170px] max-w-[210px] transition-all cursor-pointer ${
                      step.completed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 hover:border-indigo-300 text-slate-800'
                    }`}
                    title="คลิกเพื่อดูแดชบอร์ดของเครื่องนี้"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-indigo-700">ลำดับ {idx + 1}</span>
                      <span className="font-mono tabular-nums">{step.hours}h</span>
                    </div>
                    <div className="font-bold text-slate-900 truncate mb-1" title={step.name}>
                      {step.name}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">{step.machine}</span>
                    </div>
                    {step.operator && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        ช่าง: {step.operator}
                      </div>
                    )}
                  </div>

                  {idx < routingSequence.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Table: Matching User Requirements */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              รายละเอียดขั้นตอนทั้งหมดของ Job: {activeJob?.name}
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({jobTasks.length} รายการ)
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700 font-semibold select-none">
                <th className="p-3 w-16">ID</th>
                <th className="p-3 w-28">WBS</th>
                <th className="p-3 min-w-[240px]">Name (ชิ้นส่วน / ขั้นตอน)</th>
                <th className="p-3 w-24">Duration</th>
                <th className="p-3 min-w-[220px]">Start Date & Finish Date (24 ชม.)</th>
                <th className="p-3 min-w-[180px]">Resource Names (เครื่องจักร)</th>
                <th className="p-3 min-w-[150px]">Resource Initials (ช่าง)</th>
                <th className="p-3 w-28">Resource Group</th>
                <th className="p-3 text-right w-24">Scheduled</th>
                <th className="p-3 text-right w-20">OT</th>
                <th className="p-3 text-right w-24">% Complete</th>
                <th className="p-3 text-right w-28">% Work Complete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobTasks.map((task) => {
                const isFinished = task.percentComplete >= 100;
                const isSummary = task.isSummary;

                return (
                  <tr
                    key={task.id}
                    className={`transition-colors ${
                      isSummary
                        ? 'bg-slate-50/90 font-semibold text-slate-900'
                        : isFinished
                        ? 'bg-slate-50/30 text-slate-500'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* 1. ID */}
                    <td className="p-3 font-mono tabular-nums text-slate-500">
                      {task.id}
                    </td>

                    {/* 1. WBS */}
                    <td className={`p-3 font-mono tabular-nums ${isSummary ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                      {task.wbs}
                    </td>

                    {/* 1. Name */}
                    <td className="p-3">
                      <div
                        className={`${isSummary ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}
                        style={{ paddingLeft: `${Math.max(0, (task.level - 2) * 16)}px` }}
                      >
                        {task.name}
                      </div>
                    </td>

                    {/* 2. Duration */}
                    <td className="p-3 font-mono tabular-nums text-slate-600">
                      {task.duration}
                    </td>

                    {/* 2. Start Date & Finish Date */}
                    <td className="p-3 text-slate-700">
                      <div>{task.startDate}</div>
                      <div className="text-[11px] text-slate-400">ถึง {task.finishDate}</div>
                    </td>

                    {/* 3. Resource Names */}
                    <td className="p-3">
                      {task.resourceNames ? (
                        <span className="font-semibold text-indigo-700">
                          {task.resourceNames}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">สรุปรวม (Summary)</span>
                      )}
                    </td>

                    {/* 4. Resource Initials */}
                    <td className="p-3 text-slate-700">
                      {task.resourceInitials || '-'}
                    </td>

                    {/* 5. Resource Group */}
                    <td className="p-3">
                      {task.resourceGroup ? (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {task.resourceGroup}
                        </span>
                      ) : '-'}
                    </td>

                    {/* 6. Scheduled Work */}
                    <td className="p-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {task.scheduledWork || '-'}
                    </td>

                    {/* 6. Overtime Work */}
                    <td className="p-3 text-right font-mono tabular-nums text-slate-600">
                      {task.overtimeHours > 0 ? (
                        <span className="text-amber-600 font-semibold">{task.overtimeWork}</span>
                      ) : (
                        <span className="text-slate-400">0h</span>
                      )}
                    </td>

                    {/* 7. % Complete */}
                    <td className="p-3 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isFinished ? 'text-emerald-600' : task.percentComplete > 0 ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      >
                        {task.percentComplete}%
                      </span>
                    </td>

                    {/* 7. % Work Complete */}
                    <td className="p-3 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          isFinished ? 'text-emerald-600' : task.percentWorkComplete > 0 ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      >
                        {task.percentWorkComplete}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
