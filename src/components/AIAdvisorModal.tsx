import React, { useState, useEffect } from 'react';
import { Project, PlannerTask } from '../types/planner';
import { isOverdue } from '../utils/exportImport';
import { Bot, X, Loader2, AlertCircle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  tasks: PlannerTask[];
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  project,
  tasks,
}) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    bottlenecks: string;
    recommendations: string[];
  } | null>(null);

  const projectTasks = tasks.filter((t) => t.projectId === project?.id);
  const completed = projectTasks.filter((t) => t.stage === 'completed').length;
  const overdue = projectTasks.filter((t) => isOverdue(t.dueDate, t.stage)).length;
  const inProgress = projectTasks.filter((t) => t.stage === 'in_progress').length;

  useEffect(() => {
    if (isOpen && project) {
      fetchAnalysis();
    }
  }, [isOpen, project]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setInsights(null);

    const summaryData = {
      projectTitle: project.title,
      totalTasks: projectTasks.length,
      completedTasks: completed,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
      tasksList: projectTasks.map((t) => ({
        title: t.title,
        stage: t.stage,
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
      })),
    };

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.title,
          tasksSummary: summaryData,
        }),
      });
      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      } else if (data.summary) {
        setInsights({
          summary: data.summary,
          bottlenecks: data.bottlenecks || '',
          recommendations: data.recommendations || [],
        });
      }
    } catch (err) {
      console.error('Advisor error:', err);
      setInsights({
        summary: `โครงการ "${project.title}" มีความคืบหน้ารวม ${Math.round((completed / Math.max(1, projectTasks.length)) * 100)}% มีงานกำลังทำอยู่ ${inProgress} งาน`,
        bottlenecks: overdue > 0 ? `พบงานที่เกินกำหนด ${overdue} งาน ควรรีบเคลียร์ปัญหาที่ติดขัด` : 'ไม่พบงานที่ติดขัดร้ายแรง ดำเนินการตามแผนได้ราบรื่น',
        recommendations: [
          'ตรวจเช็กการกระจายงานในทีมไม่ให้รวมศูนย์ที่คนใดคนหนึ่ง',
          'อัปเดตสถานะงานประจำสัปดาห์ร่วมกับผู้รับผิดชอบ',
          'ปิดงานที่รอตรวจสอบ (Review) ให้เร็วที่สุดเพื่อไม่ให้ค้างท่อ',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                วิเคราะห์สถานะโครงการ (AI Project Advisor)
              </h3>
              <p className="text-xs text-slate-500">
                ประเมินความเสี่ยง จุดคอขวด และข้อเสนอแนะเชิงกลยุทธ์
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center">
            <div>
              <p className="text-[11px] text-slate-500">งานทั้งหมด</p>
              <p className="text-base font-bold text-slate-900 font-mono tabular-nums">{projectTasks.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">เสร็จสิ้น</p>
              <p className="text-base font-bold text-emerald-600 font-mono tabular-nums">{completed}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">กำลังทำ</p>
              <p className="text-base font-bold text-indigo-600 font-mono tabular-nums">{inProgress}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">เกินกำหนด</p>
              <p className={`text-base font-bold font-mono tabular-nums ${overdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {overdue}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-14 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Gemini กำลังวิเคราะห์ข้อมูลโครงการและประเมินความเสี่ยง...
              </p>
            </div>
          ) : insights ? (
            <div className="space-y-4 text-xs">
              {/* Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>สรุปภาพรวมและสถานะ</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{insights.summary}</p>
              </div>

              {/* Bottlenecks */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>จุดเสี่ยงและคอขวดที่ควรจับตา</span>
                </div>
                <p className="text-amber-800 leading-relaxed">{insights.bottlenecks}</p>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-900 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>คำแนะนำเชิงปฏิบัติการเพื่อเร่งความสำเร็จ</span>
                </div>
                <ul className="space-y-2">
                  {insights.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-indigo-950">
                      <span className="font-semibold text-indigo-600 shrink-0 mt-0.5">
                        {idx + 1}.
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={fetchAnalysis}
            disabled={loading}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            วิเคราะห์ใหม่อีกครั้ง
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
