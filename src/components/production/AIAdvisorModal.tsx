import React, { useState, useEffect } from 'react';
import { ProductionTask, MachineSummary, JobSummary } from '../../types/production';
import { Bot, X, Loader2, AlertCircle, CheckCircle2, TrendingUp, Sparkles, Flame, Clock } from 'lucide-react';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ProductionTask[];
  machineSummaries: MachineSummary[];
  jobSummaries: JobSummary[];
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  tasks,
  machineSummaries,
  jobSummaries,
}) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    bottlenecks: string;
    recommendations: string[];
  } | null>(null);

  // Top overloaded machines
  const overloadedMachines = machineSummaries.filter((m) => m.totalScheduledHours > 100 || m.totalOvertimeHours > 5);
  const totalScheduledHours = machineSummaries.reduce((s, m) => s + m.totalScheduledHours, 0);
  const totalOTHours = machineSummaries.reduce((s, m) => s + m.totalOvertimeHours, 0);

  useEffect(() => {
    if (isOpen) {
      fetchAnalysis();
    }
  }, [isOpen]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setInsights(null);

    const summaryPayload = {
      totalMachines: machineSummaries.length,
      totalJobs: jobSummaries.length,
      totalScheduledHours: Math.round(totalScheduledHours),
      totalOTHours: Math.round(totalOTHours),
      topLoadedMachines: machineSummaries.slice(0, 5).map((m) => ({
        machine: m.name,
        group: m.group,
        scheduledHours: m.totalScheduledHours,
        otHours: m.totalOvertimeHours,
        status: m.status,
      })),
      keyJobs: jobSummaries.slice(0, 5).map((j) => ({
        code: j.wbs,
        name: j.name,
        hours: j.totalHours,
        percentComplete: j.percentComplete,
      })),
    };

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: 'แผนงานผลิตแม่พิมพ์และเครื่องจักร MoldCraft',
          tasksSummary: summaryPayload,
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
        summary: `โรงงานมีชั่วโมงงานตามแผนรวม ${Math.round(totalScheduledHours)} ชม. และมีงานล่วงเวลา (OT) รวม ${Math.round(totalOTHours)} ชม. โดยมีเครื่องจักรหลักรับภาระสูง`,
        bottlenecks: `พบเครื่องจักรที่มีชั่วโมงงานสะสมสูงมาก เช่น ${machineSummaries[0]?.name || 'DMG MORI'} (${machineSummaries[0]?.totalScheduledHours || 0}h) ซึ่งอาจเป็นคอขวดต่อกำหนดส่งมอบ`,
        recommendations: [
          'พิจารณากระจายงานกลึงและมิลลิ่งบางส่วนไปยังเครื่องที่มีภาระงานเบากว่า',
          'วางแผนเตรียมเครื่องมือตัด (Tooling) และใบโปรแกรม CAM ล่วงหน้าเพื่อลด Downtime',
          'ตรวจสอบกำหนดการตรวจ QC ด้วยเครื่อง CMM เพื่อไม่ให้เกิดการคั่งค้างก่อนส่งประกอบ',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-inner">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                ผู้เชี่ยวชาญวิเคราะห์แผนการผลิต (AI Manufacturing Advisor)
              </h3>
              <p className="text-xs text-slate-300">
                วิเคราะห์คอขวดเครื่องจักร ภาระงานสะสม และการจัดสรรกำลังการผลิต
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[11px] text-slate-500">ชั่วโมงงานวางแผนรวม</span>
              <p className="text-base font-bold text-slate-900 font-mono tabular-nums">
                {Math.round(totalScheduledHours).toLocaleString()} ชม.
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">ชั่วโมง OT รวม</span>
              <p className="text-base font-bold text-amber-600 font-mono tabular-nums">
                {Math.round(totalOTHours)} ชม.
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500">เครื่องจักรโหลดสูง</span>
              <p className="text-base font-bold text-rose-600 font-mono tabular-nums">
                {overloadedMachines.length} เครื่อง
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-14 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Gemini กำลังประมวลผลตารางผลิตและตรวจสอบจุดคอขวดในโรงงาน...
              </p>
            </div>
          ) : insights ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>ภาพรวมสถานะการผลิต</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{insights.summary}</p>
              </div>

              {/* Bottlenecks */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>จุดคอขวดและเครื่องจักรที่เสี่ยงทำงานหนักเกินไป</span>
                </div>
                <p className="text-amber-900 leading-relaxed">{insights.bottlenecks}</p>
              </div>

              {/* Recommendations */}
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>ข้อเสนอแนะเพื่อเพิ่มประสิทธิภาพและลดเวลาการผลิต</span>
                </div>
                <ul className="space-y-2">
                  {insights.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-indigo-950">
                      <span className="font-bold text-indigo-600 shrink-0 mt-0.5">
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
