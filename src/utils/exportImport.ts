import { PlannerTask, Project, Assignee } from '../types/planner';

export function isOverdue(dueDate: string, stage: string): boolean {
  if (stage === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function getDaysRemaining(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function exportToCSV(tasks: PlannerTask[], projects: Project[], assignees: Assignee[]): void {
  const projectMap = new Map(projects.map((p) => [p.id, p.title]));
  const assigneeMap = new Map(assignees.map((a) => [a.id, a.name]));

  const headers = [
    'ID',
    'ชื่องาน',
    'โครงการ',
    'สถานะ',
    'ระดับความสำคัญ',
    'หมวดหมู่',
    'ผู้รับผิดชอบ',
    'วันเริ่มต้น',
    'วันครบกำหนด',
    'เวลาประเมิน (ชม.)',
    'เวลาที่ใช้จริง (ชม.)',
    'ความคืบหน้าง่ายย่อย',
    'แท็ก',
  ];

  const stageLabels: Record<string, string> = {
    todo: 'รอดำเนินการ',
    in_progress: 'กำลังทำ',
    review: 'รอตรวจสอบ',
    completed: 'เสร็จสิ้น',
  };

  const priorityLabels: Record<string, string> = {
    urgent: 'ด่วนที่สุด',
    high: 'สูง',
    medium: 'ปานกลาง',
    low: 'ต่ำ',
  };

  const rows = tasks.map((t) => {
    const completedSubs = t.subtasks.filter((s) => s.completed).length;
    const subProgress = t.subtasks.length > 0 ? `${completedSubs}/${t.subtasks.length}` : '-';

    return [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(projectMap.get(t.projectId) || '').replace(/"/g, '""')}"`,
      stageLabels[t.stage] || t.stage,
      priorityLabels[t.priority] || t.priority,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(assigneeMap.get(t.assigneeId) || '').replace(/"/g, '""')}"`,
      t.startDate,
      t.dueDate,
      t.estimatedHours,
      t.loggedHours,
      subProgress,
      `"${t.tags.join(', ')}"`,
    ];
  });

  // UTF-8 BOM \uFEFF ensures Thai script displays properly in Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `plancraft_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(projects: Project[], tasks: PlannerTask[]): void {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projects,
    tasks,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `plancraft_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importFromJSON(file: File): Promise<{ projects: Project[]; tasks: PlannerTask[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.projects || !parsed.tasks || !Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) {
          throw new Error('รูปแบบไฟล์ JSON ไม่ถูกต้องสำหรับ PlanCraft');
        }
        resolve({
          projects: parsed.projects,
          tasks: parsed.tasks,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    reader.readAsText(file);
  });
}
