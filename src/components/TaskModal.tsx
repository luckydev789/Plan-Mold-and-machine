import React, { useState, useEffect } from 'react';
import { PlannerTask, TaskStage, Priority, Assignee, SubTask } from '../types/planner';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  CheckSquare, 
  User, 
  Tag,
  Loader2
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: PlannerTask | null; // null for new task
  projectId: string;
  assignees: Assignee[];
  onSaveTask: (task: PlannerTask) => void;
  onDeleteTask?: (taskId: string) => void;
  defaultStage?: TaskStage;
  defaultPriority?: Priority;
  defaultDueDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  projectId,
  assignees,
  onSaveTask,
  onDeleteTask,
  defaultStage = 'todo',
  defaultPriority = 'medium',
  defaultDueDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<TaskStage>(defaultStage);
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [category, setCategory] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [loggedHours, setLoggedHours] = useState(0);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStage(task.stage);
      setPriority(task.priority);
      setCategory(task.category || '');
      setAssigneeId(task.assigneeId || (assignees[0]?.id || ''));
      setStartDate(task.startDate);
      setDueDate(task.dueDate);
      setEstimatedHours(task.estimatedHours || 0);
      setLoggedHours(task.loggedHours || 0);
      setSubtasks(task.subtasks || []);
      setTags(task.tags || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      setTitle('');
      setDescription('');
      setStage(defaultStage);
      setPriority(defaultPriority);
      setCategory('ทั่วไป');
      setAssigneeId(assignees[0]?.id || '');
      setStartDate(today);
      setDueDate(defaultDueDate || nextWeekStr);
      setEstimatedHours(8);
      setLoggedHours(0);
      setSubtasks([]);
      setTags([]);
    }
  }, [task, isOpen, defaultStage, defaultPriority, defaultDueDate, assignees]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleGenerateSubtasksAI = async () => {
    if (!title.trim()) {
      alert('กรุณากรอกชื่องานก่อนเพื่อให้ AI วิเคราะห์และแตกงานย่อย');
      return;
    }

    setIsGeneratingSubtasks(true);
    try {
      const res = await fetch('/api/ai/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const newItems: SubTask[] = data.subtasks.map((txt: string, idx: number) => ({
          id: `ai_sub_${Date.now()}_${idx}`,
          title: txt,
          completed: false,
        }));
        setSubtasks([...subtasks, ...newItems]);
      }
    } catch (err) {
      console.error('Failed to generate subtasks:', err);
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const savedTask: PlannerTask = {
      id: task ? task.id : `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: task ? task.projectId : projectId,
      title: title.trim(),
      description: description.trim(),
      stage,
      priority,
      category: category.trim() || 'ทั่วไป',
      assigneeId,
      startDate: startDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      estimatedHours: Number(estimatedHours) || 0,
      loggedHours: Number(loggedHours) || 0,
      subtasks,
      tags,
      createdAt: task ? task.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveTask(savedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            {task ? 'แก้ไขข้อมูลงาน' : 'สร้างงานใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ชื่องาน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ระบุชื่องานที่ชัดเจนและเข้าใจง่าย..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none transition-colors font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              คำอธิบายรายละเอียด
            </label>
            <textarea
              rows={3}
              placeholder="รายละเอียด ขอบเขตงาน หรือผลลัพธ์ที่ต้องการ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          {/* Meta Grid: Stage, Priority, Category, Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                สถานะงาน (Stage)
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as TaskStage)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="todo">รอดำเนินการ (To Do)</option>
                <option value="in_progress">กำลังทำ (In Progress)</option>
                <option value="review">รอตรวจสอบ (Review)</option>
                <option value="completed">เสร็จสิ้น (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ระดับความสำคัญ (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="urgent">ด่วนที่สุด (Urgent)</option>
                <option value="high">สูง (High)</option>
                <option value="medium">ปานกลาง (Medium)</option>
                <option value="low">ต่ำ (Low)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                หมวดหมู่งาน (Category)
              </label>
              <input
                type="text"
                placeholder="เช่น ออกแบบ, พัฒนาระบบ, การตลาด..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ผู้รับผิดชอบ (Assignee)
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Hours Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                วันเริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                วันครบกำหนด
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ประเมิน (ชม.)
              </label>
              <input
                type="number"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                ใช้จริง (ชม.)
              </label>
              <input
                type="number"
                min="0"
                value={loggedHours}
                onChange={(e) => setLoggedHours(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Subtasks Section with AI Breakdown */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-slate-500" />
                <span>ขั้นตอนย่อย / งานย่อย (Subtasks)</span>
                <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                  ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                </span>
              </label>

              <button
                type="button"
                onClick={handleGenerateSubtasksAI}
                disabled={isGeneratingSubtasks}
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-md border border-indigo-200 transition-colors disabled:opacity-50"
              >
                {isGeneratingSubtasks ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>กำลังคิด...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>AI แตกงานย่อยอัตโนมัติ</span>
                  </>
                )}
              </button>
            </div>

            {/* Subtask list */}
            <div className="space-y-1.5 mb-2.5">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={s.completed}
                      onChange={() => handleToggleSubtask(s.id)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span
                      className={`text-xs truncate ${
                        s.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}
                    >
                      {s.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add manual subtask */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="เพิ่มขั้นตอนย่อย..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                เพิ่ม
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              แท็ก (Tags)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="พิมพ์แท็กและกด Enter หรือปุ่มเพิ่ม..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
              >
                เพิ่มแท็ก
              </button>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {task && onDeleteTask ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('ยืนยันที่จะลบงานนี้ใช่หรือไม่?')) {
                    onDeleteTask(task.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบงานนี้</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
