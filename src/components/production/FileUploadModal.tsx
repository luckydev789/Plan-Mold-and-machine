import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { parseProductionCSV } from '../../utils/productionParser';
import { ProductionTask } from '../../types/production';
import { RAW_PRODUCTION_CSV } from '../../data/rawProductionCsv';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  RotateCcw,
  Loader2,
  FileCode,
  Download,
  Clock
} from 'lucide-react';
import { formatDateTimeThai24h } from '../../utils/productionParser';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateTasks: (newTasks: ProductionTask[], mode: 'overwrite' | 'append') => void;
  onResetToDefault: () => void;
  lastUploadTime?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpdateTasks,
  onResetToDefault,
  lastUploadTime,
}) => {
  const formattedTime = React.useMemo(() => formatDateTimeThai24h(lastUploadTime), [lastUploadTime]);
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'overwrite' | 'append'>('overwrite');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewTasks, setPreviewTasks] = useState<ProductionTask[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);
    setPreviewTasks(null);
    setIsProcessing(true);

    try {
      const fileName = selected.name.toLowerCase();

      if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        const text = await selected.text();
        const parsed = parseProductionCSV(text);
        if (parsed.length === 0) {
          throw new Error('ไม่พบข้อมูลที่ถูกต้องในไฟล์ CSV กรุณาตรวจสอบหัวคอลัมน์');
        }
        setPreviewTasks(parsed);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await selected.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        const parsed = parseProductionCSV(csvText);
        if (parsed.length === 0) {
          throw new Error('ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel กรุณาตรวจสอบหัวคอลัมน์');
        }
        setPreviewTasks(parsed);
      } else if (fileName.endsWith('.mpp')) {
        // Microsoft Project binary file notice
        throw new Error('ไฟล์ .mpp (Microsoft Project) แนะนำให้ Save As / Export ออกมาเป็น .xlsx หรือ .csv เพื่อการประมวลผลที่แม่นยำ 100%');
      } else {
        throw new Error('นามสกุลไฟล์ไม่ถูกต้อง รองรับเฉพาะ .xlsx, .xls, หรือ .csv');
      }
    } catch (err: any) {
      console.error('File parse error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = () => {
    if (!previewTasks || previewTasks.length === 0) return;
    onUpdateTasks(previewTasks, importMode);
    onClose();
  };

  const handleRestoreDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลกลับเป็นแผนงานแม่พิมพ์ตั้งต้นใช่หรือไม่?')) {
      onResetToDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ระบบอัปโหลดและอัปเดตแผนงาน (File Upload Engine)
              </h3>
              <p className="text-xs text-slate-500">
                รองรับไฟล์แผนงานการผลิต .xlsx, .csv, .mpp
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Drag / Selector Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-600 rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 mx-auto mb-3 transition-colors" />
            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
              คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              รองรับไฟล์ Excel (.xlsx, .xls) และ Comma-Separated Values (.csv)
            </p>
            {file && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs">
                <span>ไฟล์ที่เลือก: {file.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Timestamp Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg">
            <span className="text-slate-600 font-medium">ข้อมูลแผนงานล่าสุดในระบบ:</span>
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>วันที่ {formattedTime.dateStr} เวลา {formattedTime.timeStr} น.</span>
            </span>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังตรวจสอบโครงสร้างไฟล์และแปลงข้อมูล (Validating schema)...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ตรวจสอบไฟล์ไม่สำเร็จ:</p>
                <p className="mt-0.5 text-rose-700">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Preview State */}
          {previewTasks && previewTasks.length > 0 && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>โครงสร้างข้อมูลถูกต้อง (พบ {previewTasks.length} รายการกิจกรรม)</span>
                </div>
              </div>

              {/* Import Logic Choice */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  ตรรกะการประมวลผล (Processing Logic):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('overwrite')}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      importMode === 'overwrite'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900 mb-1">
                      อัปเดตทับข้อมูลเดิม (Overwrite)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      แทนที่ข้อมูลทั้งหมดในระบบด้วยข้อมูลจากไฟล์ใหม่นี้ทันที
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-lg border text-left text-xs transition-all ${
                      importMode === 'append'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-slate-900 mb-1">
                      เพิ่มข้อมูลใหม่เข้าไป (Append)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      รวมข้อมูลใหม่เข้ากับแผนงานเดิมที่มีอยู่ในระบบ
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template Download & Restore Default Options */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob(['\uFEFF' + RAW_PRODUCTION_CSV], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sample_production_template.csv';
                a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="ดาวน์โหลดไฟล์แม่แบบ CSV ตัวอย่าง"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ดาวน์โหลดไฟล์ตัวอย่าง CSV</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>รีเซ็ตกลับเป็นข้อมูลเดิม (369 แถว)</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <div className="flex flex-col items-end">
            <button
              type="button"
              disabled={!previewTasks || previewTasks.length === 0}
              onClick={handleConfirmUpload}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ยืนยันอัปเดตแผนงาน & รีเฟรชแดชบอร์ด</span>
            </button>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-1">
              <Clock className="w-2.5 h-2.5 text-slate-400" />
              <span>วันที่ {formattedTime.dateStr} เวลา {formattedTime.timeStr} น.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
