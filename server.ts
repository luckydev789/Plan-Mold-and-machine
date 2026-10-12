import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI client
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Generate full structured project plan from a prompt/goal
app.post('/api/ai/generate-project', async (req: Request, res: Response) => {
  const { goal, category, targetDays } = req.body;
  if (!goal) {
    return res.status(400).json({ error: 'Goal is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    // Return smart pre-structured template if no key
    return res.json({
      fallback: true,
      message: 'ไม่มี GEMINI_API_KEY (ใช้ตัวจำลองโครงสร้างแผนงานอัตโนมัติ)',
      project: generateSimulatedProject(goal, category, targetDays),
    });
  }

  try {
    const prompt = `คุณคือผู้เชี่ยวชาญการบริหารโครงการและวางแผนงานมืออาชีพ (Senior Agile Project Manager & Scrum Master)
กรุณาสร้างแผนงานโครงการอย่างละเอียดตามเป้าหมายต่อไปนี้:
เป้าหมายโครงการ: "${goal}"
หมวดหมู่งาน: "${category || 'ทั่วไป'}"
ระยะเวลาเป้าหมาย: ${targetDays || 30} วัน

ตอบกลับในรูปแบบ JSON ที่ถูกต้องเท่านั้น (Strict JSON) โดยไม่มี backtick markdown หรือคำนำหน้าใดๆ โครงสร้างดังนี้:
{
  "title": "ชื่อโครงการที่ชัดเจน กระชับ ทันสมัย",
  "description": "คำอธิบายวัตถุประสงค์และผลลัพธ์ที่คาดหวังของโครงการ (2-3 ประโยค)",
  "color": "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet",
  "tasks": [
    {
      "title": "ชื่องานที่เป็นรูปธรรม",
      "description": "รายละเอียดสิ่งที่ต้องทำ",
      "stage": "todo" | "in_progress",
      "priority": "urgent" | "high" | "medium" | "low",
      "category": "หมวดหมู่ย่อย (เช่น ออกแบบ, พัฒนาระบบ, การตลาด, กฎหมาย/เอกสาร, ประสานงาน)",
      "estimatedHours": 8,
      "dayOffsetStart": 0,
      "durationDays": 5,
      "subtasks": [
        "ขั้นตอนย่อยที่ 1",
        "ขั้นตอนย่อยที่ 2",
        "ขั้นตอนย่อยที่ 3"
      ]
    }
  ]
}
สร้างงานอย่างน้อย 6 - 8 งานที่ครอบคลุมตั้งแต่เริ่มวางแผนจนถึงส่งมอบงานหรือเปิดตัว จัดลำดับความสำคัญและเวลาให้สอดคล้องกัน`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    // Clean up potential markdown blocks
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleaned);

    return res.json({ success: true, project: data });
  } catch (error: any) {
    console.error('Error generating project with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate project with AI',
      fallbackProject: generateSimulatedProject(goal, category, targetDays),
    });
  }
});

// 2. Break down a specific task into actionable subtasks
app.post('/api/ai/subtasks', async (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    return res.json({
      subtasks: [
        `วิเคราะห์ขอบเขตและความต้องการสำหรับ ${title}`,
        `รวบรวมข้อมูลและเอกสารที่เกี่ยวข้อง`,
        `ลงมือปฏิบัติตามแผนงานและเกณฑ์มาตรฐาน`,
        `ตรวจสอบคุณภาพและการทดสอบ (QA / Review)`,
        `สรุปรายงานผลและส่งมอบงาน`,
      ],
    });
  }

  try {
    const prompt = `คุณคือผู้ช่วยวางแผนงาน กรุณาแตกงานต่อไปนี้ออกเป็นขั้นตอนย่อย (Subtasks / Action items) ที่กระชับและปฏิบัติได้จริง 4-6 ข้อเป็นภาษาไทย
ชื่องาน: "${title}"
รายละเอียด: "${description || 'ไม่มี'}"

ตอบกลับเป็น JSON array ของสตริงเท่านั้น เช่น:
["ขั้นตอนที่ 1", "ขั้นตอนที่ 2", "ขั้นตอนที่ 3"]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const subtasks = JSON.parse(cleaned);

    return res.json({ success: true, subtasks });
  } catch (error: any) {
    console.error('Error generating subtasks:', error);
    return res.json({
      subtasks: [
        `วิเคราะห์ขอบเขตงาน: ${title}`,
        `จัดเตรียมข้อมูลและเครื่องมือ`,
        `ดำเนินการหลัก`,
        `ตรวจทานความถูกต้อง`,
        `ส่งมอบงานหรือบันทึกสรุป`,
      ],
    });
  }
});

// 3. Project Advisor / Health Check Insights
app.post('/api/ai/advisor', async (req: Request, res: Response) => {
  const { projectTitle, tasksSummary } = req.body;

  const ai = getAIClient();
  if (!ai) {
    return res.json({
      summary: `โครงการ "${projectTitle || 'ปัจจุบัน'}" กำลังดำเนินงานตามกำหนด มีความคืบหน้าที่ดี`,
      bottlenecks: 'ควรเร่งติดตามงานที่มีความสำคัญสูง (High/Urgent) ที่ใกล้ถึงกำหนดส่ง',
      recommendations: [
        'ทบทวนสถานะงานที่รอดำเนินการ (To Do) เพื่อจัดสรรเวลาของทีมให้สมดุล',
        'ติดตามความคืบหน้ารายสัปดาห์เพื่อป้องกันความล่าช้าสะสม',
        'แตกงานขนาดใหญ่ที่มีเวลามากกว่า 20 ชม. ออกเป็นงานย่อยเพื่อลดความเสี่ยง',
      ],
    });
  }

  try {
    const prompt = `คุณคือที่ปรึกษาบริหารงานโครงการระดับสูง (Project Management Advisor)
วิเคราะห์สถานะโครงการ "${projectTitle}" จากข้อมูลสรุปงานดังนี้:
${JSON.stringify(tasksSummary, null, 2)}

กรุณาวิเคราะห์และตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{
  "summary": "สรุปภาพรวมสถานะและความคืบหน้า (2 ประโยค ภาษาไทย)",
  "bottlenecks": "จุดเสี่ยงหรือคอขวดที่อาจเกิดขึ้น (1-2 ประโยค ภาษาไทย)",
  "recommendations": [
    "คำแนะนำเชิงปฏิบัติการข้อที่ 1",
    "คำแนะนำเชิงปฏิบัติการข้อที่ 2",
    "คำแนะนำเชิงปฏิบัติการข้อที่ 3"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const insights = JSON.parse(cleaned);

    return res.json({ success: true, insights });
  } catch (error: any) {
    console.error('Advisor error:', error);
    return res.json({
      insights: {
        summary: `โครงการมีแนวโน้มดำเนินไปตามแผนงาน แนะนำติดตามสถานะอย่างต่อเนื่อง`,
        bottlenecks: 'งานที่มีระดับความสำคัญสูงจำเป็นต้องได้รับการจัดสรรทรัพยากรอย่างเพียงพอ',
        recommendations: [
          'จัดประชุมยืนยันเป้าหมายสั้นๆ (Daily Standup) เพื่อแก้ไขปัญหาติดขัด',
          'ตรวจสอบกำหนดส่งของงานในสัปดาห์นี้',
        ],
      },
    });
  }
});

// Simulated fallback project generator
function generateSimulatedProject(goal: string, category?: string, targetDays?: number) {
  const days = targetDays || 30;
  return {
    title: goal,
    description: `แผนงานสำหรับการดำเนินโครงการ "${goal}" ให้บรรลุเป้าหมายภายใน ${days} วัน พร้อมตรวจสอบคุณภาพและส่งมอบผลงาน`,
    color: 'indigo',
    tasks: [
      {
        title: 'กำหนดขอบเขตและเป้าหมายโครงการ (Project Scope & Objectives)',
        description: 'ประชุมระบุความต้องการ วัตถุประสงค์หลัก ตัวชี้วัดความสำเร็จ (KPI) และทรัพยากรที่ต้องใช้',
        stage: 'completed',
        priority: 'high',
        category: category || 'วางแผนงาน',
        estimatedHours: 8,
        dayOffsetStart: 0,
        durationDays: 3,
        subtasks: [
          'ระบุผู้มีส่วนได้ส่วนเสีย (Stakeholders)',
          'กำหนด Deliverables หลัก',
          'สรุปเอกสารขอบเขตงาน (Project Charter)',
        ],
      },
      {
        title: 'รวบรวมข้อมูลและออกแบบโครงสร้างงาน (Research & Architecture)',
        description: 'ศึกษาคู่แข่ง ความเป็นไปได้ทางเทคนิค หรือข้อกำหนดการดำเนินงาน',
        stage: 'in_progress',
        priority: 'high',
        category: category || 'วิจัยและออกแบบ',
        estimatedHours: 16,
        dayOffsetStart: 3,
        durationDays: 5,
        subtasks: [
          'สำรวจและรวบรวมข้อมูลเชิงลึก',
          'ร่างต้นแบบหรือแผนผังขั้นตอนการทำงาน (Workflow)',
          'ตรวจสอบความเป็นไปได้กับทีมงาน',
        ],
      },
      {
        title: 'ดำเนินการหลักและพัฒนางานระยะที่ 1 (Core Execution - Phase 1)',
        description: 'เริ่มต้นลงมือปฏิบัติการตามข้อกำหนดหลักที่เป็นหัวใจของเป้าหมาย',
        stage: 'in_progress',
        priority: 'urgent',
        category: category || 'การปฏิบัติงาน',
        estimatedHours: 32,
        dayOffsetStart: 7,
        durationDays: 10,
        subtasks: [
          'ตั้งค่าโครงสร้างและเครื่องมือที่จำเป็น',
          'พัฒนาหรือจัดสร้างส่วนประกอบหลัก',
          'ทดสอบเบื้องต้นแบบคู่ขนาน',
        ],
      },
      {
        title: 'จัดทำแผนการสื่อสารและการตลาด/ประสานงาน (Outreach & Communication)',
        description: 'เตรียมช่องทางประชาสัมพันธ์ สื่อสาร หรือแจ้งหน่วยงานที่เกี่ยวข้อง',
        stage: 'todo',
        priority: 'medium',
        category: 'การสื่อสาร/การตลาด',
        estimatedHours: 12,
        dayOffsetStart: 14,
        durationDays: 6,
        subtasks: [
          'ร่างข้อความและสื่อประชาสัมพันธ์',
          'ประสานงานพันธมิตรหรือช่องทางเผยแพร่',
          'กำหนดตารางเวลาเผยแพร่',
        ],
      },
      {
        title: 'ทดสอบระบบ ตรวจสอบคุณภาพ และปรับปรุง (QA & Iteration)',
        description: 'ทดสอบการทำงานจริง ตรวจสอบข้อผิดพลาด และปรับปรุงให้สมบูรณ์ตามเกณฑ์',
        stage: 'todo',
        priority: 'high',
        category: 'ควบคุมคุณภาพ',
        estimatedHours: 18,
        dayOffsetStart: 20,
        durationDays: 5,
        subtasks: [
          'ทำ User Acceptance Testing (UAT)',
          'แก้ไขจุดบกพร่องที่พบ',
          'ปรับปรุงประสิทธิภาพและการใช้งาน',
        ],
      },
      {
        title: 'เปิดตัว/ส่งมอบผลงานอย่างเป็นทางการ (Official Launch & Handover)',
        description: 'เปิดใช้งานจริง จัดส่งเอกสารสรุป และประเมินผลหลังการดำเนินงาน',
        stage: 'todo',
        priority: 'urgent',
        category: 'ส่งมอบงาน',
        estimatedHours: 10,
        dayOffsetStart: 25,
        durationDays: 4,
        subtasks: [
          'เตรียมสภาพแวดล้อมจริง (Production / Live)',
          'เผยแพร่สู่กลุ่มเป้าหมายหรือผู้ใช้งาน',
          'สรุปบทเรียนและประเมินผลความสำเร็จ',
        ],
      },
    ],
  };
}

// Development or production middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
