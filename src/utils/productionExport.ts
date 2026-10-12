import { ProductionTask } from '../types/production';

export function exportProductionCSV(tasks: ProductionTask[], filenamePrefix: string = 'mold_production_plan'): void {
  const headers = [
    'ID',
    'WBS',
    'Name',
    'Duration',
    'Start_Date',
    'Finish_Date',
    'Scheduled_Work',
    'Overtime_Work',
    'Resource_Names',
    'Resource_Initials',
    'Resource_Group',
    'Percent_Complete',
    'Percent_Work_Complete',
    'Physical_Percent_Complete',
    'Cost'
  ];

  const rows = tasks.map((t) => [
    t.id,
    `"${t.wbs}"`,
    `"${t.name.replace(/"/g, '""')}"`,
    `"${t.duration}"`,
    `"${t.startDate}"`,
    `"${t.finishDate}"`,
    `"${t.scheduledWork}"`,
    `"${t.overtimeWork}"`,
    `"${(t.resourceNames || '').replace(/"/g, '""')}"`,
    `"${(t.resourceInitials || '').replace(/"/g, '""')}"`,
    `"${(t.resourceGroup || '').replace(/"/g, '""')}"`,
    t.percentComplete / 100,
    t.percentWorkComplete / 100,
    t.physicalPercentComplete / 100,
    t.cost
  ]);

  // UTF-8 BOM
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
