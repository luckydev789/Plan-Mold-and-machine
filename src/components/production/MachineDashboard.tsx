import React, { useState, useMemo } from 'react';
import { ProductionTask, MachineSummary } from '../../types/production';
import { 
  Cpu, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  ArrowUpDown, 
  ExternalLink,
  Layers,
  User,
  Wrench,
  Activity,
  Upload
} from 'lucide-react';

interface MachineDashboardProps {
  tasks: ProductionTask[];
  machineSummaries: MachineSummary[];
  selectedMachine: string;
  onSelectMachine: (machineName: string) => void;
  onOpenGanttForMachine: (machineName: string) => void;
}

export const MachineDashboard: React.FC<MachineDashboardProps> = ({
  tasks,
  machineSummaries,
  selectedMachine,
  onSelectMachine,
  onOpenGanttForMachine,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [sortField, setSortField] = useState<'id' | 'wbs' | 'name' | 'scheduledHours' | 'percentComplete' | 'startTime'>('startTime');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Unique machine groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    machineSummaries.forEach((m) => {
      if (m.group) set.add(m.group);
    });
    return Array.from(set).sort();
  }, [machineSummaries]);

  // Filtered machine list for dropdown/sidebar
  const filteredMachines = useMemo(() => {
    return machineSummaries.filter((m) => {
      if (selectedGroup !== 'all' && m.group !== selectedGroup) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.operator.toLowerCase().includes(q) || m.group.toLowerCase().includes(q);
      }
      return true;
    });
  }, [machineSummaries, selectedGroup, searchTerm]);

  // Current selected machine data
  const activeMachine = useMemo(() => {
    return machineSummaries.find((m) => m.name === selectedMachine) || filteredMachines[0] || machineSummaries[0];
  }, [machineSummaries, selectedMachine, filteredMachines]);

  // Tasks assigned to this machine
  const machineTasks = useMemo(() => {
    if (!activeMachine) return [];
    return tasks.filter((t) => {
      if (!t.resourceNames) return false;
      return t.resourceNames.split(',').map((r) => r.trim()).includes(activeMachine.name);
    });
  }, [tasks, activeMachine]);

  // Sort machine tasks
  const sortedMachineTasks = useMemo(() => {
    return [...machineTasks].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') cmp = a.id - b.id;
      else if (sortField === 'wbs') cmp = a.wbs.localeCompare(b.wbs, undefined, { numeric: true });
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'th');
      else if (sortField === 'scheduledHours') cmp = a.scheduledHours - b.scheduledHours;
      else if (sortField === 'percentComplete') cmp = a.percentComplete - b.percentComplete;
      else if (sortField === 'startTime') cmp = (a.startTime || 0) - (b.startTime || 0);
      return sortAsc ? cmp : -cmp;
    });
  }, [machineTasks, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controller Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Machine-Centric Management
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                บริหารจัดการภาระงานและตารางการผลิตของเครื่องจักร
              </span>
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 mt-0.5">
              แดชบอร์ดติดตามภาระงานเครื่องจักร (Machine Load)
            </h2>
          </div>

          {/* Machine Selection Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              <option value="all">ทุกแผนก / แผนกทั้งหมด</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  ฝ่าย {g}
                </option>
              ))}
            </select>

            {/* Machine Dropdown */}
            <select
              value={activeMachine?.name || ''}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="bg-slate-900 text-white border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[240px]"
            >
              {filteredMachines.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.totalScheduledHours} ชม. | {m.group})
                </option>
              ))}
            </select>

            {/* Jump to Timeline button */}
            {activeMachine && (
              <button
                onClick={() => onOpenGanttForMachine(activeMachine.name)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดดูใน Gantt Chart</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Machine Detailed KPI Cards */}
      {activeMachine && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Machine Identity */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>ชื่อเครื่องจักร & แผนก</span>
              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                {activeMachine.group}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate" title={activeMachine.name}>
              {activeMachine.name}
            </h3>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">ช่างผู้ดูแล: <strong>{activeMachine.operator}</strong></span>
            </div>
          </div>

          {/* Card 2: Total Scheduled & Overtime Work */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>ภาระงานที่วางแผนไว้</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {activeMachine.totalScheduledHours}
              </span>
              <span className="text-xs text-slate-500">ชั่วโมง</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">งานล่วงเวลา (OT):</span>
              <span className={`font-mono tabular-nums font-semibold ${activeMachine.totalOvertimeHours > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {activeMachine.totalOvertimeHours} ชม.
              </span>
            </div>
          </div>

          {/* Card 3: Completion Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>ความคืบหน้ารวม</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {activeMachine.utilizationRate}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${activeMachine.utilizationRate}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>เสร็จสิ้นแล้ว: <strong className="font-mono tabular-nums text-slate-800">{activeMachine.completedHours}h</strong></span>
              <span>คงค้าง: <strong className="font-mono tabular-nums text-slate-800">{activeMachine.activeTaskCount} กิจกรรม</strong></span>
            </div>
          </div>

          {/* Card 4: Load Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>สถานะโหลดเครื่อง (Load Status)</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              {activeMachine.status === 'overloaded' ? (
                <div className="flex items-center gap-2 text-rose-600">
                  <Flame className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-sm font-bold block">ภาระงานหนักเกินไป (High Load)</span>
                    <span className="text-[11px] text-rose-500">ควรพิจารณากระจายงานหรือเพิ่มกะ OT</span>
                  </div>
                </div>
              ) : activeMachine.status === 'busy' ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-sm font-bold block">งานหนาแน่น (Busy)</span>
                    <span className="text-[11px] text-amber-600">กำลังทำงานตามแผนงานเต็มกำลัง</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="text-sm font-bold block">โหลดงานปกติ (Normal Load)</span>
                    <span className="text-[11px] text-slate-500">มีกำลังการผลิตรองรับงานเพิ่มเติมได้</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 pt-2 text-[11px] text-slate-400">
              จำนวนกิจกรรมทั้งหมด: {activeMachine.totalTaskCount} รายการ
            </div>
          </div>
        </div>
      )}

      {/* Data Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              ตารางแผนงานของเครื่อง {activeMachine?.name}
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({sortedMachineTasks.length} กิจกรรม)
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>คลิกหัวตารางเพื่อจัดเรียงข้อมูล</span>
          </div>
        </div>

        {/* Data Table: Exactly matches User Prompt Columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700 font-semibold select-none">
                <th className="p-3 w-16 cursor-pointer hover:text-slate-900" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 w-28 cursor-pointer hover:text-slate-900" onClick={() => handleSort('wbs')}>
                  <div className="flex items-center gap-1">
                    <span>WBS</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer hover:text-slate-900 min-w-[240px]" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Name (ชื่อกิจกรรม/ขั้นตอนการผลิต)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 w-24">Duration</th>
                <th className="p-3 cursor-pointer hover:text-slate-900 min-w-[220px]" onClick={() => handleSort('startTime')}>
                  <div className="flex items-center gap-1">
                    <span>Start Date & Finish Date (24 ชม.)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right cursor-pointer hover:text-slate-900 w-28" onClick={() => handleSort('scheduledHours')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Scheduled Work</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right w-24">Overtime Work</th>
                <th className="p-3 text-right cursor-pointer hover:text-slate-900 w-24" onClick={() => handleSort('percentComplete')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>% Complete</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right w-28">% Work Complete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMachineTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    ไม่พบแผนงานสำหรับเครื่องจักรนี้
                  </td>
                </tr>
              ) : (
                sortedMachineTasks.map((task) => {
                  const isFinished = task.percentComplete >= 100;

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isFinished ? 'bg-slate-50/40 text-slate-500' : ''
                      }`}
                    >
                      {/* 1. ID */}
                      <td className="p-3 font-mono tabular-nums text-slate-500 font-medium">
                        {task.id}
                      </td>

                      {/* 2. WBS */}
                      <td className="p-3 font-mono tabular-nums font-semibold text-slate-800">
                        {task.wbs}
                      </td>

                      {/* 3. Name */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">
                          {task.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="truncate">{task.jobCode}</span>
                          {task.resourceInitials && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-600 truncate">{task.resourceInitials}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 4. Duration */}
                      <td className="p-3 font-mono tabular-nums text-slate-600">
                        {task.duration || `${task.scheduledHours}h`}
                      </td>

                      {/* 5. Start Date & Finish Date */}
                      <td className="p-3">
                        <div className="text-slate-800 font-medium whitespace-nowrap">
                          {task.startDate || '-'}
                        </div>
                        <div className="text-slate-500 text-[11px] whitespace-nowrap">
                          ถึง {task.finishDate || '-'}
                        </div>
                      </td>

                      {/* 6. Scheduled Work */}
                      <td className="p-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {task.scheduledWork || `${task.scheduledHours}h`}
                      </td>

                      {/* 7. Overtime Work */}
                      <td className="p-3 text-right font-mono tabular-nums text-slate-600">
                        {task.overtimeHours > 0 ? (
                          <span className="text-amber-600 font-semibold">{task.overtimeWork || `${task.overtimeHours}h`}</span>
                        ) : (
                          <span className="text-slate-400">0h</span>
                        )}
                      </td>

                      {/* 8. % Complete */}
                      <td className="p-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            isFinished ? 'text-emerald-600' : task.percentComplete > 0 ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        >
                          {task.percentComplete}%
                        </span>
                      </td>

                      {/* 9. % Work Complete */}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machine Capacity Comparison Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          ภาพรวมภาระงานเครื่องจักรทั้งหมดในโรงงาน (Shop Floor Machine Load Matrix)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {machineSummaries.map((m) => {
            const isSelected = m.name === activeMachine?.name;
            return (
              <button
                key={m.name}
                onClick={() => onSelectMachine(m.name)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="truncate">{m.group}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    m.status === 'overloaded' ? 'bg-rose-500' : m.status === 'busy' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                </div>
                <p className="text-xs font-bold text-slate-900 truncate" title={m.name}>
                  {m.name}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-slate-500">{m.totalTaskCount} งาน</span>
                  <span className="font-semibold text-slate-800">{m.totalScheduledHours}h</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
