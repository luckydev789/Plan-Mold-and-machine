import React, { useState } from 'react';
import { PlannerTask, TaskStage, Assignee } from '../../types/planner';
import { isOverdue } from '../../utils/exportImport';
import { 
  ArrowUpDown, 
  CheckCircle2, 
  Trash2, 
  Search, 
  CheckSquare, 
  Clock,
  Filter
} from 'lucide-react';

interface TableViewProps {
  tasks: PlannerTask[];
  assignees: Assignee[];
  onTaskClick: (task: PlannerTask) => void;
  onUpdateStage: (taskId: string, stage: TaskStage) => void;
  onDeleteTasks?: (taskIds: string[]) => void;
}

type SortField = 'title' | 'dueDate' | 'priority' | 'estimatedHours' | 'stage';

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  assignees,
  onTaskClick,
  onUpdateStage,
  onDeleteTasks,
}) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [tableSearch, setTableSearch] = useState<string>('');

  const assigneeMap = new Map(assignees.map((a) => [a.id, a]));

  const stageOptions: { value: TaskStage; label: string }[] = [
    { value: 'todo', label: 'รอดำเนินการ' },
    { value: 'in_progress', label: 'กำลังทำ' },
    { value: 'review', label: 'รอตรวจ' },
    { value: 'completed', label: 'เสร็จสิ้น' },
  ];

  const priorityOrder: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const priorityLabels: Record<string, { label: string; textClass: string }> = {
    urgent: { label: 'ด่วนที่สุด', textClass: 'text-rose-600 font-semibold' },
    high: { label: 'สูง', textClass: 'text-amber-600 font-medium' },
    medium: { label: 'ปานกลาง', textClass: 'text-slate-600 font-normal' },
    low: { label: 'ต่ำ', textClass: 'text-slate-400 font-normal' },
  };

  // Filter & Sort
  const filteredTasks = tasks.filter((t) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title, 'th');
    } else if (sortField === 'dueDate') {
      comparison = a.dueDate.localeCompare(b.dueDate);
    } else if (sortField === 'priority') {
      comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
    } else if (sortField === 'estimatedHours') {
      comparison = a.estimatedHours - b.estimatedHours;
    } else if (sortField === 'stage') {
      comparison = a.stage.localeCompare(b.stage);
    }
    return sortAsc ? comparison : -comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === sortedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(sortedTasks.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStageChange = (stage: TaskStage) => {
    selectedTaskIds.forEach((id) => onUpdateStage(id, stage));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (onDeleteTasks && selectedTaskIds.length > 0) {
      if (confirm(`คุณต้องการลบ ${selectedTaskIds.length} งานที่เลือกหรือไม่?`)) {
        onDeleteTasks(selectedTaskIds);
        setSelectedTaskIds([]);
      }
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่องาน, หมวดหมู่, หรือแท็ก..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap font-mono tabular-nums">
            {sortedTasks.length} รายการ
          </span>
        </div>

        {/* Bulk Action Controls */}
        {selectedTaskIds.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <span className="text-xs text-slate-600 px-2 font-mono tabular-nums">
              เลือก {selectedTaskIds.length} งาน
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleBulkStageChange('completed')}
                className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
              >
                เสร็จสิ้นทั้งหมด
              </button>
              <button
                onClick={() => handleBulkStageChange('in_progress')}
                className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
              >
                กำลังทำ
              </button>
              {onDeleteTasks && (
                <button
                  onClick={handleBulkDelete}
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                  title="ลบงานที่เลือก"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={sortedTasks.length > 0 && selectedTaskIds.length === sortedTasks.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                </th>
                <th className="p-3 cursor-pointer select-none hover:text-slate-900" onClick={() => toggleSort('title')}>
                  <div className="flex items-center gap-1.5">
                    <span>ชื่องาน</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer select-none hover:text-slate-900" onClick={() => toggleSort('stage')}>
                  <div className="flex items-center gap-1.5">
                    <span>สถานะ</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 cursor-pointer select-none hover:text-slate-900" onClick={() => toggleSort('priority')}>
                  <div className="flex items-center gap-1.5">
                    <span>ลำดับความสำคัญ</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="p-3">ผู้รับผิดชอบ</th>
                <th className="p-3 cursor-pointer select-none hover:text-slate-900" onClick={() => toggleSort('dueDate')}>
                  <div className="flex items-center gap-1.5">
                    <span>กำหนดส่ง</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-right cursor-pointer select-none hover:text-slate-900" onClick={() => toggleSort('estimatedHours')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>เวลา (ชม.)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 text-center">งานย่อย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    ไม่พบรายการงานที่ตรงกับการค้นหา
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  const assignee = assigneeMap.get(task.assigneeId);
                  const overdue = isOverdue(task.dueDate, task.stage);
                  const priority = priorityLabels[task.priority] || priorityLabels.medium;
                  const completedSubs = task.subtasks.filter((s) => s.completed).length;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center" onClick={(e) => toggleSelectOne(task.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                      </td>

                      {/* Title & Category */}
                      <td className="p-3 max-w-[320px]">
                        <p className="font-semibold text-slate-900 truncate hover:text-indigo-600 transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{task.category || 'ทั่วไป'}</span>
                          {task.tags.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{task.tags.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Stage selector (inline) */}
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.stage}
                          onChange={(e) => onUpdateStage(task.id, e.target.value as TaskStage)}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium cursor-pointer focus:outline-none ${
                            task.stage === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : task.stage === 'in_progress'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : task.stage === 'review'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {stageOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="p-3">
                        <span className={priority.textClass}>{priority.label}</span>
                      </td>

                      {/* Assignee */}
                      <td className="p-3">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            {assignee.avatarUrl ? (
                              <img
                                src={assignee.avatarUrl}
                                alt={assignee.name}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className={`w-5 h-5 rounded-full text-white text-[9px] font-semibold flex items-center justify-center ${assignee.color}`}>
                                {assignee.initials}
                              </div>
                            )}
                            <span className="text-slate-700 truncate max-w-[120px]">{assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="p-3 font-mono tabular-nums">
                        {overdue ? (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            {task.dueDate} (เกินกำหนด)
                          </span>
                        ) : (
                          <span className="text-slate-600">{task.dueDate}</span>
                        )}
                      </td>

                      {/* Hours (tabular numbers, right-aligned) */}
                      <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                        {task.loggedHours > 0 ? (
                          <span>{task.loggedHours}/{task.estimatedHours}</span>
                        ) : (
                          <span>{task.estimatedHours} ชม.</span>
                        )}
                      </td>

                      {/* Subtask count */}
                      <td className="p-3 text-center font-mono tabular-nums text-slate-500">
                        {task.subtasks.length > 0 ? (
                          <span>{completedSubs}/{task.subtasks.length}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
