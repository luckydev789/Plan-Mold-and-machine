import React, { useState } from 'react';
import { Project, PlannerTask, Assignee } from '../types/planner';
import { Sparkles, X, Loader2, CheckCircle2, ArrowRight, Lightbulb } from 'lucide-react';

interface AIProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProjectWithTasks: (newProject: Project, newTasks: PlannerTask[]) => void;
  assignees: Assignee[];
}

export const AIProjectModal: React.FC<AIProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProjectWithTasks,
  assignees,
}) => {
  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState('พัฒนาธุรกิจ & ผลิตภัณฑ์');
  const [targetDays, setTargetDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const samplePresets = [
    'เปิดร้านกาแฟสดสาขาแรกพร้อมระบบ POS',
    'พัฒนาแอปพลิเคชันมือถือ Delivery อาหาร',
    'จัดงานสัมมนาประจำปีลูกค้าองค์กร 300 ท่าน',
    'รีแบรนด์อัตลักษณ์และเว็บไซต์บริษัทใหม่',
    'แคมเปญการตลาดดิจิทัลกระตุ้นยอดขาย Q4',
  ];

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setIsLoading(true);
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/ai/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          category,
          targetDays,
        }),
      });
      const data = await res.json();
      if (data.project || data.fallbackProject) {
        setGeneratedResult(data.project || data.fallbackProject);
      }
    } catch (err) {
      console.error('Failed to generate project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyGeneratedProject = () => {
    if (!generatedResult) return;

    const projId = `proj_${Date.now()}`;
    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + targetDays);
    const endDateStr = endDate.toISOString().split('T')[0];

    const newProject: Project = {
      id: projId,
      title: generatedResult.title || goal,
      description: generatedResult.description || `โครงการวางแผนงาน: ${goal}`,
      color: generatedResult.color || 'indigo',
      category: category || 'ทั่วไป',
      startDate: startDateStr,
      targetEndDate: endDateStr,
      createdAt: startDateStr,
    };

    const newTasks: PlannerTask[] = (generatedResult.tasks || []).map((t: any, idx: number) => {
      const tStart = new Date(today);
      tStart.setDate(tStart.getDate() + (t.dayOffsetStart || idx * 3));

      const tEnd = new Date(tStart);
      tEnd.setDate(tEnd.getDate() + (t.durationDays || 4));

      const assignedUser = assignees[idx % assignees.length] || assignees[0];

      return {
        id: `task_${Date.now()}_${idx}`,
        projectId: projId,
        title: t.title,
        description: t.description || '',
        stage: t.stage || (idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'todo'),
        priority: t.priority || (idx < 2 ? 'high' : 'medium'),
        category: t.category || category,
        assigneeId: assignedUser?.id || '',
        startDate: tStart.toISOString().split('T')[0],
        dueDate: tEnd.toISOString().split('T')[0],
        estimatedHours: t.estimatedHours || 12,
        loggedHours: t.stage === 'completed' ? t.estimatedHours || 12 : 0,
        subtasks: (t.subtasks || []).map((st: string, sIdx: number) => ({
          id: `sub_${Date.now()}_${idx}_${sIdx}`,
          title: typeof st === 'string' ? st : (st as any).title,
          completed: idx === 0,
        })),
        tags: [category, 'AI-Generated'],
        createdAt: startDateStr,
        updatedAt: startDateStr,
      };
    });

    onAddProjectWithTasks(newProject, newTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ผู้ช่วยสร้างแผนงานอัจฉริยะ (AI Project Planner)
              </h3>
              <p className="text-xs text-slate-500">
                แปลงเป้าหมายของคุณเป็นโครงสร้างงานและไทม์ไลน์ที่พร้อมลงมือทำจริงทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!generatedResult ? (
            <>
              {/* Goal input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เป้าหมายหรือไอเดียโครงการที่คุณต้องการวางแผน
                </label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="เช่น ต้องการสร้างเว็บไซต์อีคอมเมิร์ซสำหรับสินค้าแฟชั่น พร้อมระบบชำระเงินและจัดการคลังสินค้า..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-lg p-3 text-xs text-slate-900 focus:outline-none transition-colors"
                />
              </div>

              {/* Presets */}
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>หรือเลือกตัวอย่างไอเดีย:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {samplePresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGoal(p)}
                      className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    หมวดหมู่งาน
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="พัฒนาธุรกิจ & ผลิตภัณฑ์">พัฒนาธุรกิจ & ผลิตภัณฑ์</option>
                    <option value="เทคโนโลยี & ซอฟต์แวร์">เทคโนโลยี & ซอฟต์แวร์</option>
                    <option value="การตลาด & อีเวนต์">การตลาด & อีเวนต์</option>
                    <option value="ปฏิบัติการ & บริหารทั่วไป">ปฏิบัติการ & บริหารทั่วไป</option>
                    <option value="ออกแบบ & ครีเอทีฟ">ออกแบบ & ครีเอทีฟ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    กรอบระยะเวลาเป้าหมาย (วัน)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="180"
                    value={targetDays}
                    onChange={(e) => setTargetDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Result Preview */
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                  โครงสร้างโครงการที่สร้างขึ้น
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  {generatedResult.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  {generatedResult.description}
                </p>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-slate-700 mb-2">
                  รายการงานในโครงการ ({generatedResult.tasks?.length || 0} งาน):
                </h5>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {generatedResult.tasks?.map((t: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="font-semibold text-slate-800">{t.title}</span>
                        <span className="font-mono tabular-nums text-[11px]">{t.estimatedHours || 8} ชม.</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{t.description}</p>
                      {t.subtasks && t.subtasks.length > 0 && (
                        <div className="mt-2 text-[11px] text-slate-600 pl-3 border-l-2 border-indigo-200 space-y-0.5">
                          {t.subtasks.map((st: string, idx: number) => (
                            <div key={idx}>· {st}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {!generatedResult ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isLoading || !goal.trim()}
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังประมวลผลแผนงาน...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>สร้างแผนงานด้วย AI</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setGeneratedResult(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                ปรับแต่งข้อมูลใหม่
              </button>
              <button
                type="button"
                onClick={handleApplyGeneratedProject}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>นำเข้าเป็นโครงการใหม่ในเวิร์กสเปซ</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
