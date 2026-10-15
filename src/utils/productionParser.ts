import { ProductionTask, MachineSummary, JobSummary } from '../types/production';

// Robust CSV row parser supporting commas inside quotes
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse date string like "30 September 2025 8:00 AM" or "05 June 2026 10:00 AM"
const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

// Convert any date string with 12-hour AM/PM into 24-hour format (e.g. "8:00 AM" -> "08:00", "4:00 PM" -> "16:00")
export function formatTo24Hour(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const str = dateStr.toString().trim();
  if (!str) return '';

  const timeRegex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|a\.m\.|p\.m\.)\b/gi;
  return str.replace(timeRegex, (_match, hStr, mStr, sStr, ampmStr) => {
    let hour = parseInt(hStr, 10);
    const minute = mStr;
    const isPM = /pm|p\.m\./i.test(ampmStr);
    const isAM = /am|a\.m\./i.test(ampmStr);

    if (isPM && hour < 12) {
      hour += 12;
    } else if (isAM && hour === 12) {
      hour = 0;
    }

    const padHour = hour.toString().padStart(2, '0');
    return sStr ? `${padHour}:${minute}:${sStr}` : `${padHour}:${minute}`;
  });
}

export function parseDateString(dateStr: string): number {
  if (!dateStr || !dateStr.trim()) return 0;
  const clean = dateStr.trim();

  // Try standard Date.parse
  const direct = Date.parse(clean);
  if (!isNaN(direct)) return direct;

  // Custom regex: "05 June 2026 8:00 AM", "05 June 2026 14:00", "05 June 2026 08:00:00"
  const regex = /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i;
  const match = clean.match(regex);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const year = parseInt(match[3], 10);
    const month = MONTH_MAP[monthName] ?? 0;

    let hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;
    const ampm = match[7] ? match[7].toUpperCase() : null;

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    return new Date(year, month, day, hour, minute, second).getTime();
  }

  // Also try DD/MM/YYYY HH:mm or YYYY-MM-DD HH:mm
  const slashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;
  const slashMatch = clean.match(slashRegex);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    const year = parseInt(slashMatch[3], 10);
    const hour = slashMatch[4] ? parseInt(slashMatch[4], 10) : 0;
    const minute = slashMatch[5] ? parseInt(slashMatch[5], 10) : 0;
    return new Date(year, month, day, hour, minute).getTime();
  }

  return 0;
}

// Extract numeric hours from strings like "1,640h", "45h", "1816 hrs?", "30.5 hrs"
export function parseHours(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace(/,/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

// Parse percent value: e.g. 0.55 -> 55, 1 -> 100, "7.0000000000000007E-2" -> 7
export function parsePercent(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val.toString());
  if (isNaN(num)) return 0;
  // If <= 1, it's a decimal ratio like 0.78
  const pct = num <= 1.0 && num > 0 ? num * 100 : num;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

export function parseProductionCSV(csvText: string): ProductionTask[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  // Find column indices
  const getIdx = (name: string, fallbackIdx: number) => {
    const idx = headers.findIndex((h) => h.includes(name.toLowerCase()));
    return idx >= 0 ? idx : fallbackIdx;
  };

  const idIdx = getIdx('id', 0);
  const wbsIdx = getIdx('wbs', 1);
  const nameIdx = getIdx('name', 2);
  const durIdx = getIdx('duration', 3);
  const startIdx = getIdx('start', 4);
  const finishIdx = getIdx('finish', 5);
  const schedIdx = getIdx('scheduled', 6);
  const otIdx = getIdx('overtime', 7);
  const resNameIdx = getIdx('resource_name', 8);
  const resInitIdx = getIdx('resource_initial', 9);
  const resGroupIdx = getIdx('resource_group', 10);
  const pctIdx = getIdx('percent_complete', 11);
  const pctWorkIdx = getIdx('percent_work', 12);
  const physPctIdx = getIdx('physical', 13);
  const costIdx = getIdx('cost', 14);

  const rawRows: any[] = [];
  const categoryMap = new Map<string, string>(); // WBS level 1 -> Category Name
  const jobMap = new Map<string, string>();      // WBS level 2 -> Job Name

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 3) continue;

    const id = parseInt(cols[idIdx], 10) || i;
    const wbs = cols[wbsIdx] || `${i}`;
    const name = cols[nameIdx] || `Task ${id}`;
    const duration = cols[durIdx] || '';
    const startDate = formatTo24Hour(cols[startIdx] || '');
    const finishDate = formatTo24Hour(cols[finishIdx] || '');
    const scheduledWork = cols[schedIdx] || '';
    const overtimeWork = cols[otIdx] || '';
    const resourceNames = cols[resNameIdx] || '';
    const resourceInitials = cols[resInitIdx] || '';
    const resourceGroup = cols[resGroupIdx] || '';
    const percentComplete = parsePercent(cols[pctIdx]);
    const percentWorkComplete = parsePercent(cols[pctWorkIdx]);
    const physicalPercentComplete = parsePercent(cols[physPctIdx]);
    const cost = parseFloat(cols[costIdx]?.replace(/,/g, '') || '0') || 0;

    const wbsParts = wbs.split('.');
    const level = wbsParts.length;

    if (level === 1) {
      categoryMap.set(wbsParts[0], name);
    } else if (level === 2) {
      jobMap.set(`${wbsParts[0]}.${wbsParts[1]}`, name);
    }

    rawRows.push({
      id,
      wbs,
      name,
      duration,
      durationHours: parseHours(duration),
      startDate,
      finishDate,
      startTime: parseDateString(startDate),
      finishTime: parseDateString(finishDate),
      scheduledWork,
      scheduledHours: parseHours(scheduledWork),
      overtimeWork,
      overtimeHours: parseHours(overtimeWork),
      resourceNames,
      resourceInitials,
      resourceGroup,
      percentComplete,
      percentWorkComplete,
      physicalPercentComplete,
      cost,
      level,
      isSummary: !resourceNames || resourceNames.trim() === '',
      wbsParts,
    });
  }

  // Populate category and job code for each task
  return rawRows.map((row) => {
    const rootCat = categoryMap.get(row.wbsParts[0]) || `หมวด ${row.wbsParts[0]}`;
    const jobKey = row.wbsParts.length >= 2 ? `${row.wbsParts[0]}.${row.wbsParts[1]}` : row.wbs;
    const jobTitle = jobMap.get(jobKey) || row.name;

    return {
      ...row,
      projectCategory: rootCat,
      jobCode: jobTitle,
    };
  });
}

// Group tasks into Machine Summaries
export function computeMachineSummaries(tasks: ProductionTask[]): MachineSummary[] {
  const machineMap = new Map<string, {
    group: string;
    operator: string;
    totalScheduled: number;
    totalOT: number;
    completed: number;
    tasks: ProductionTask[];
  }>();

  // Filter only tasks that have resourceNames assigned
  tasks.forEach((t) => {
    if (!t.resourceNames || t.resourceNames.trim() === '') return;

    // Handle multiple machines if comma-separated e.g. "OKUMA GENOSL300-M (02),YAM 400x1000 (01)"
    const machines = t.resourceNames.split(',').map((m) => m.trim()).filter(Boolean);
    const groups = t.resourceGroup.split(',').map((g) => g.trim());
    const operators = t.resourceInitials.split(',').map((o) => o.trim());

    machines.forEach((m, idx) => {
      if (!machineMap.has(m)) {
        machineMap.set(m, {
          group: groups[idx] || groups[0] || 'เครื่องจักร',
          operator: operators[idx] || operators[0] || '-',
          totalScheduled: 0,
          totalOT: 0,
          completed: 0,
          tasks: [],
        });
      }
      const data = machineMap.get(m)!;
      data.totalScheduled += t.scheduledHours;
      data.totalOT += t.overtimeHours;
      if (t.percentComplete >= 100) {
        data.completed += t.scheduledHours;
      } else if (t.percentComplete > 0) {
        data.completed += t.scheduledHours * (t.percentComplete / 100);
      }
      data.tasks.push(t);
    });
  });

  const summaries: MachineSummary[] = [];

  machineMap.forEach((val, name) => {
    const totalHours = val.totalScheduled + val.totalOT;
    const activeTasks = val.tasks.filter((t) => t.percentComplete < 100);
    const completedHours = Math.round(val.completed * 10) / 10;
    
    // Utilization estimate based on scheduled load
    // Overloaded if > 150h or heavy OT
    let status: 'active' | 'busy' | 'idle' | 'overloaded' = 'active';
    if (val.totalScheduled > 120 || val.totalOT > 8) {
      status = 'overloaded';
    } else if (val.totalScheduled > 40) {
      status = 'busy';
    } else if (val.totalScheduled === 0) {
      status = 'idle';
    }

    const utilizationRate = Math.min(100, Math.round((val.completed / Math.max(1, val.totalScheduled)) * 100));

    summaries.push({
      name,
      group: val.group,
      operator: val.operator,
      totalScheduledHours: Math.round(val.totalScheduled * 10) / 10,
      totalOvertimeHours: Math.round(val.totalOT * 10) / 10,
      completedHours,
      activeTaskCount: activeTasks.length,
      totalTaskCount: val.tasks.length,
      utilizationRate,
      status,
    });
  });

  return summaries.sort((a, b) => b.totalScheduledHours - a.totalScheduledHours);
}

// Group tasks into Job/Project Summaries
export function computeJobSummaries(tasks: ProductionTask[]): JobSummary[] {
  // Find level 2 jobs (e.g. 1.1, 1.2, 2.1, 3.1) or top-level groups
  const jobsMap = new Map<string, {
    wbs: string;
    name: string;
    category: string;
    tasks: ProductionTask[];
  }>();

  tasks.forEach((t) => {
    const wbsParts = t.wbs.split('.');
    const jobKey = wbsParts.length >= 2 ? `${wbsParts[0]}.${wbsParts[1]}` : t.wbs;

    if (!jobsMap.has(jobKey)) {
      jobsMap.set(jobKey, {
        wbs: jobKey,
        name: t.jobCode || t.name,
        category: t.projectCategory,
        tasks: [],
      });
    }
    jobsMap.get(jobKey)!.tasks.push(t);
  });

  const result: JobSummary[] = [];

  jobsMap.forEach((entry, code) => {
    // Only leaf/operational tasks for metrics calculation
    const leafTasks = entry.tasks.filter((t) => !t.isSummary && t.scheduledHours > 0);
    const allTasksWithDates = entry.tasks.filter((t) => t.startTime > 0 && t.finishTime > 0);

    const totalHours = leafTasks.reduce((s, t) => s + t.scheduledHours, 0);
    const totalOT = leafTasks.reduce((s, t) => s + t.overtimeHours, 0);
    const totalCost = leafTasks.reduce((s, t) => s + t.cost, 0);

    let minStart = Infinity;
    let maxFinish = -Infinity;
    let startDateStr = '';
    let finishDateStr = '';

    allTasksWithDates.forEach((t) => {
      if (t.startTime < minStart) {
        minStart = t.startTime;
        startDateStr = t.startDate;
      }
      if (t.finishTime > maxFinish) {
        maxFinish = t.finishTime;
        finishDateStr = t.finishDate;
      }
    });

    const machines = new Set<string>();
    const groups = new Set<string>();

    leafTasks.forEach((t) => {
      if (t.resourceNames) {
        t.resourceNames.split(',').forEach((m) => machines.add(m.trim()));
      }
      if (t.resourceGroup) {
        t.resourceGroup.split(',').forEach((g) => groups.add(g.trim()));
      }
    });

    const completedHours = leafTasks.reduce((s, t) => s + (t.scheduledHours * (t.percentComplete / 100)), 0);
    const percentComplete = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

    result.push({
      code,
      wbs: entry.wbs,
      name: entry.name,
      category: entry.category,
      totalHours: Math.round(totalHours * 10) / 10,
      totalOvertimeHours: Math.round(totalOT * 10) / 10,
      totalCost,
      startDate: startDateStr,
      finishDate: finishDateStr,
      startTime: isFinite(minStart) ? minStart : 0,
      finishTime: isFinite(maxFinish) ? maxFinish : 0,
      percentComplete,
      percentWorkComplete: percentComplete,
      taskCount: entry.tasks.length,
      machineCount: machines.size,
      machinesUsed: Array.from(machines),
      groupsUsed: Array.from(groups),
    });
  });

  return result.sort((a, b) => a.wbs.localeCompare(b.wbs, undefined, { numeric: true }));
}

// Format date and time in Thai 24-hour format
export function formatDateTimeThai24h(isoOrDate?: string | Date | number): {
  dateStr: string;
  timeStr: string;
  fullStr: string;
} {
  const d = isoOrDate ? new Date(isoOrDate) : new Date();
  const valid = !isNaN(d.getTime()) ? d : new Date();

  const day = valid.getDate().toString().padStart(2, '0');
  const month = (valid.getMonth() + 1).toString().padStart(2, '0');
  const year = valid.getFullYear();
  const hours = valid.getHours().toString().padStart(2, '0');
  const minutes = valid.getMinutes().toString().padStart(2, '0');
  const seconds = valid.getSeconds().toString().padStart(2, '0');

  const dateStr = `${day}/${month}/${year}`;
  const timeStr = `${hours}:${minutes}:${seconds}`;
  const fullStr = `วันที่ ${dateStr} เวลา ${timeStr} น.`;

  return { dateStr, timeStr, fullStr };
}

