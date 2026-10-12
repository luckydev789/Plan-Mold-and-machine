export interface ProductionTask {
  id: number;
  wbs: string;
  name: string;
  duration: string;
  durationHours: number;
  startDate: string;        // original string e.g. "09 June 2026 8:00 AM"
  finishDate: string;       // original string e.g. "09 June 2026 11:00 AM"
  startTime: number;        // timestamp ms
  finishTime: number;       // timestamp ms
  scheduledWork: string;    // e.g. "3h"
  scheduledHours: number;   // 3
  overtimeWork: string;     // e.g. "0h"
  overtimeHours: number;    // 0
  resourceNames: string;    // e.g. "YAM 400x1000 (01)"
  resourceInitials: string; // e.g. "นายวีรชัย พ่วงกองนะ"
  resourceGroup: string;    // e.g. "Lathe", "Milling", "Turnmill", "QC", "EDM", "Wirecut"
  percentComplete: number;  // 0 - 100
  percentWorkComplete: number; // 0 - 100
  physicalPercentComplete: number;
  cost: number;
  isSummary: boolean;       // parent rollup row (e.g. WBS 1, 1.1, 1.1.1)
  level: number;            // 1, 2, 3, 4 based on WBS depth
  jobCode: string;          // e.g. "B470", "B472", "P120", or level 2 name
  projectCategory: string;  // e.g. "B แม่พิมพ์เป่าชุดใหม่ (NEW)"
}

export interface MachineSummary {
  name: string;
  group: string;
  operator: string;
  totalScheduledHours: number;
  totalOvertimeHours: number;
  completedHours: number;
  activeTaskCount: number;
  totalTaskCount: number;
  utilizationRate: number; // percentage
  status: 'active' | 'busy' | 'idle' | 'overloaded';
}

export interface JobSummary {
  code: string;
  wbs: string;
  name: string;
  category: string;
  totalHours: number;
  totalOvertimeHours: number;
  totalCost: number;
  startDate: string;
  finishDate: string;
  startTime: number;
  finishTime: number;
  percentComplete: number;
  percentWorkComplete: number;
  taskCount: number;
  machineCount: number;
  machinesUsed: string[];
  groupsUsed: string[];
}
