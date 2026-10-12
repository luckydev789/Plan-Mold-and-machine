import React, { useState } from 'react';
import { Project } from '../types/planner';
import { X, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ทั่วไป');
  const [color, setColor] = useState<'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'>('indigo');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 30);
  const [targetEndDate, setTargetEndDate] = useState(defaultEnd.toISOString().split('T')[0]);

  if (!isOpen) return null;

  const colorOptions: { id: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'; bg: string; label: string }[] = [
    { id: 'indigo', bg: 'bg-indigo-500', label: 'Indigo' },
    { id: 'emerald', bg: 'bg-emerald-500', label: 'Emerald' },
    { id: 'amber', bg: 'bg-amber-500', label: 'Amber' },
    { id: 'rose', bg: 'bg-rose-500', label: 'Rose' },
    { id: 'sky', bg: 'bg-sky-500', label: 'Sky' },
    { id: 'violet', bg: 'bg-violet-500', label: 'Violet' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'ทั่วไป',
      color,
      startDate,
      targetEndDate,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreateProject(newProj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md flex flex-col overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">สร้างโครงการใหม่</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              ชื่อโครงการ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ขยายสาขาพัทยา, ปรับโครงสร้างองค์กร..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              คำอธิบายโครงการ
            </label>
            <textarea
              rows={2}
              placeholder="วัตถุประสงค์และผลลัพธ์ของโครงการ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              หมวดหมู่โครงการ
            </label>
            <input
              type="text"
              placeholder="เช่น พัฒนาผลิตภัณฑ์, การตลาด, ปฏิบัติการ..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                วันเริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เป้าหมายสิ้นสุด
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              โทนสีระบุโครงการ
            </label>
            <div className="flex items-center gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${
                    color === c.id ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              สร้างโครงการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
