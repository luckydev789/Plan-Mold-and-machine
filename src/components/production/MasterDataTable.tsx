import React, { useState, useMemo } from 'react';
import { ProductionTask } from '../../types/production';
import { Search, ArrowUpDown, Filter, Layers, Cpu, Download, Upload, Clock } from 'lucide-react';
import { formatDateTimeThai24h } from '../../utils/productionParser';

interface MasterDataTableProps {
  tasks: ProductionTask[];
  onSelectMachine: (machineName: string) => void;
  onSelectJob: (jobWbs: string) => void;
  onOpenUpload?: () => void;
  lastUploadTime?: string;
}

export const MasterDataTable: React.FC<MasterDataTableProps> = ({
  tasks,
  onSelectMachine,
  onSelectJob,
  onOpenUpload,
  lastUploadTime,
}) => {
  const formattedTime = useMemo(() => formatDateTimeThai24h(lastUploadTime), [lastUploadTime]);

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showSummariesOnly, setShowSummariesOnly] = useState<boolean>(false);
  const [sortField, setSortField] = useState<'id' | 'wbs' | 'name' | 'scheduledHours' | 'percentComplete' | 'cost'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.resourceGroup) {
        t.resourceGroup.split(',').forEach((g) => set.add(g.trim()));
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (showSummariesOnly && !t.isSummary) return false;
      if (selectedGroup !== 'all' && (!t.resourceGroup || !t.resourceGroup.includes(selectedGroup))) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.wbs.includes(q) ||
          (t.resourceNames && t.resourceNames.toLowerCase().includes(q)) ||
          (t.resourceInitials && t.resourceInitials.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, search, selectedGroup, showSummariesOnly]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') cmp = a.id - b.id;
      else if (sortField === 'wbs') cmp = a.wbs.localeCompare(b.wbs, undefined, { numeric: true });
      else if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'th');
      else if (sortField === 'scheduledHours') cmp = a.scheduledHours - b.scheduledHours;
      else if (sortField === 'percentComplete') cmp = a.percentComplete - b.percentComplete;
      else if (sortField === 'cost') cmp = a.cost - b.cost;
      return sortAsc ? cmp : -cmp;
    });
  }, [filteredTasks, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่องาน, WBS, เครื่องจักร, หรือชื่อช่าง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">ทุกแผนกทรัพยากร</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSummariesOnly}
              onChange={(e) => setShowSummariesOnly(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>แสดงเฉพาะหัวข้องานสรุป (Summary Rows)</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            แสดง {sortedTasks.length} จากทั้งหมด {tasks.length} รายการ
          </span>

          {onOpenUpload && (
            <div className="flex flex-col items-end">
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-xs hover:shadow-sm whitespace-nowrap cursor-pointer"
                title="อัปโหลดไฟล์ (.xlsx, .csv, .mpp) เพื่ออัปเดตแผนงาน"
              >
                <Upload className="w-4 h-4" />
                <span>อัพโหลดไฟล์เพิ่มอัพเดทแผน</span>
              </button>
              <div 
                className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-1 select-none"
                title="วันที่และเวลาที่มีการอัปโหลดหรืออัปเดตข้อมูลแผนงานล่าสุด (24 ชั่วโมง)"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>วันที่ {formattedTime.dateStr} เวลา {formattedTime.timeStr} น.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
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
                <th className="p-3 min-w-[260px] cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 w-24">Duration</th>
                <th className="p-3 min-w-[200px]">Start Date & Finish Date (24 ชม.)</th>
                <th className="p-3 min-w-[170px]">Resource Names</th>
                <th className="p-3 min-w-[140px]">Resource Initials</th>
                <th className="p-3 w-24">Group</th>
                <th className="p-3 text-right w-24 cursor-pointer hover:text-slate-900" onClick={() => handleSort('scheduledHours')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Scheduled</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right w-20">OT</th>
                <th className="p-3 text-right w-24 cursor-pointer hover:text-slate-900" onClick={() => handleSort('percentComplete')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>% Complete</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right w-28 cursor-pointer hover:text-slate-900" onClick={() => handleSort('cost')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Cost (บาท)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTasks.map((task) => {
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
                    <td className="p-3 font-mono tabular-nums text-slate-500">{task.id}</td>
                    <td className="p-3 font-mono tabular-nums font-semibold text-slate-800">{task.wbs}</td>
                    <td className="p-3">
                      <div
                        className={`${isSummary ? 'font-bold text-slate-900' : 'text-slate-800'}`}
                        style={{ paddingLeft: `${Math.max(0, (task.level - 1) * 12)}px` }}
                      >
                        {task.name}
                      </div>
                    </td>
                    <td className="p-3 font-mono tabular-nums text-slate-600">{task.duration}</td>
                    <td className="p-3 text-slate-700">
                      <div>{task.startDate}</div>
                      <div className="text-[11px] text-slate-400">ถึง {task.finishDate}</div>
                    </td>
                    <td className="p-3">
                      {task.resourceNames ? (
                        <button
                          onClick={() => onSelectMachine(task.resourceNames.split(',')[0].trim())}
                          className="font-medium text-indigo-700 hover:underline text-left"
                        >
                          {task.resourceNames}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">{task.resourceInitials || '-'}</td>
                    <td className="p-3">
                      {task.resourceGroup ? (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          {task.resourceGroup}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {task.scheduledWork || '-'}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-600">
                      {task.overtimeHours > 0 ? (
                        <span className="text-amber-600 font-semibold">{task.overtimeWork}</span>
                      ) : '0h'}
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      <span className={`font-semibold ${isFinished ? 'text-emerald-600' : task.percentComplete > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {task.percentComplete}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-800">
                      {task.cost > 0 ? task.cost.toLocaleString('th-TH') : '-'}
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
