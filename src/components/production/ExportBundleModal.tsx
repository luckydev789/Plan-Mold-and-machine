import React, { useState } from 'react';
import { X, Download, FileCode, Check, Copy, ExternalLink, Terminal, Globe, HelpCircle } from 'lucide-react';

interface ExportBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportBundleModal: React.FC<ExportBundleModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'js' | 'guide'>('html');

  if (!isOpen) return null;

  const htmlCode = `<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MoldCraft MPS - แผนงานการผลิตแม่พิมพ์และเครื่องจักร</title>
    <meta name="description" content="ระบบวางแผนการผลิตแม่พิมพ์และเครื่องจักร พร้อม Gantt Chart และแดชบอร์ดอัจฉริยะ" />
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Scripts & Stylesheets (วางไฟล์ไว้ในโฟลเดอร์เดียวกัน) -->
    <script type="module" crossorigin src="./moldcraft.js"></script>
    <link rel="stylesheet" crossorigin href="./moldcraft.css">
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root"></div>
  </body>
</html>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ดาวน์โหลดไฟล์ .html และ .js (Production Bundle)</h2>
              <p className="text-xs text-slate-400">ชุดไฟล์สำหรับนำไปรันบนเว็บเซิร์ฟเวอร์หรือใช้งานในองค์กร</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action download cards */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
            คลิกเพื่อดาวน์โหลดไฟล์ลงเครื่องคอมพิวเตอร์ของคุณ:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* HTML file */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    HTML Entry
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">~1.8 KB</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1">index.html</div>
                <p className="text-[11px] text-slate-500 mb-3">โครงสร้างหน้าเว็บหลัก เชื่อมต่อ JavaScript และฟอนต์ภาษาไทย</p>
              </div>
              <button
                onClick={() => handleDownloadFile('/downloads/index.html', 'index.html')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด index.html</span>
              </button>
            </div>

            {/* JS file */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                    JavaScript
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">~920 KB</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1">moldcraft.js</div>
                <p className="text-[11px] text-slate-500 mb-3">โค้ดระบบเต็มรูปแบบ React, Gantt Chart, แดชบอร์ด และโมเดลตาราง</p>
              </div>
              <button
                onClick={() => handleDownloadFile('/downloads/moldcraft.js', 'moldcraft.js')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด moldcraft.js</span>
              </button>
            </div>

            {/* CSS file */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Stylesheet
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">~51 KB</span>
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1">moldcraft.css</div>
                <p className="text-[11px] text-slate-500 mb-3">สไตล์และธีม Tailwind CSS ดีไซน์ระดับ Production</p>
              </div>
              <button
                onClick={() => handleDownloadFile('/downloads/moldcraft.css', 'moldcraft.css')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ดาวน์โหลด moldcraft.css</span>
              </button>
            </div>
          </div>
        </div>

        {/* Code tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('html')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'html'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            ดูโค้ด index.html
          </button>
          <button
            onClick={() => setActiveTab('js')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'js'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            ข้อมูลไฟล์ moldcraft.js
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            วิธีนำไปรันใช้งาน (Local Server)
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">โครงสร้างโค้ด HTML ที่พร้อมใช้งานคู่กับ moldcraft.js</span>
                <button
                  onClick={() => copyToClipboard(htmlCode, 'html')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copied === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'html' ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด HTML'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                <code>{htmlCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'js' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  เกี่ยวกับไฟล์ moldcraft.js:
                </div>
                ไฟล์นี้เป็นไฟล์ JavaScript ES Module (ความจุ ~920 KB) ซึ่งรวมคอมโพเนนต์และตรรกะคำนวณทั้งหมดไว้ในไฟล์เดียว ได้แก่:
                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                  <li>ระบบคำนวณโหลดชั่วโมงงานของเครื่องจักร (Machine Load & Overtime)</li>
                  <li>ระบบติดตามความคืบหน้าระดับ Job และ WBS ขั้นตอนการผลิต</li>
                  <li>ระบบไทม์ไลน์ Gantt Chart อัจฉริยะ (รายวัน, สัปดาห์, เดือน, ปี, ทั้งหมด)</li>
                  <li>โมดูล Parser รองรับการอัปโหลดไฟล์ .xlsx, .csv, และ .mpp</li>
                  <li>LocalStorage Caching อัตโนมัติ (เปิดแล้วจำค่าเดิมได้ทันที)</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-semibold text-xs text-slate-800">ลิงก์ดาวน์โหลดโดยตรงผ่าน URL ของเว็บ:</div>
                  <div className="text-[11px] font-mono text-indigo-600 mt-0.5">/downloads/moldcraft.js</div>
                </div>
                <button
                  onClick={() => handleDownloadFile('/downloads/moldcraft.js', 'moldcraft.js')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์ JS</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  ขั้นตอนการเปิดใช้งานในคอมพิวเตอร์ของคุณ:
                </div>
                <ol className="list-decimal list-inside space-y-2 pl-1 leading-relaxed">
                  <li>
                    สร้างโฟลเดอร์ใหม่ เช่น <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono">my-moldcraft-app</code>
                  </li>
                  <li>
                    ดาวน์โหลดไฟล์ทั้ง 3 ไฟล์ (<code className="font-mono">index.html</code>, <code className="font-mono">moldcraft.js</code>, <code className="font-mono">moldcraft.css</code>) มาวางไว้ในโฟลเดอร์เดียวกัน
                  </li>
                  <li>
                    เนื่องจากไฟล์ JavaScript ใช้รูปแบบ modern ES Module (<code className="font-mono">type="module"</code>) เบราว์เซอร์ต้องการการเปิดผ่าน Web Server โดยสามารถเลือกรันวิธีใดวิธีหนึ่งต่อไปนี้ได้ง่ายๆ:
                  </li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Method 1: VS Code Live Server */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-500" />
                    วิธีที่ 1: ผ่าน VS Code
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                    เปิดโฟลเดอร์ใน Visual Studio Code แล้วคลิกขวาที่ไฟล์ <code className="font-mono">index.html</code> เลือก <strong>"Open with Live Server"</strong>
                  </p>
                </div>

                {/* Method 2: Python / Node */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    วิธีที่ 2: รันคำสั่ง Terminal
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-1">
                    เปิด Terminal ในโฟลเดอร์นั้น แล้วพิมพ์:
                  </p>
                  <code className="block bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px]">
                    npx serve .
                  </code>
                  <span className="text-[10px] text-slate-500 mt-1 block">หรือ Python: <code className="font-mono">python3 -m http.server 8080</code></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            MoldCraft MPS Production Bundle v2.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
