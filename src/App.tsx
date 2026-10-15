import React, { useState, useEffect, useMemo } from 'react';
import { ProductionTask } from './types/production';
import { RAW_PRODUCTION_CSV } from './data/rawProductionCsv';
import { 
  parseProductionCSV, 
  computeMachineSummaries, 
  computeJobSummaries,
  formatTo24Hour 
} from './utils/productionParser';
import { ProductionHeader, ProductionViewMode } from './components/production/ProductionHeader';
import { MachineDashboard } from './components/production/MachineDashboard';
import { JobDashboard } from './components/production/JobDashboard';
import { ProductionGantt } from './components/production/ProductionGantt';
import { MasterDataTable } from './components/production/MasterDataTable';
import { FileUploadModal } from './components/production/FileUploadModal';
import { AIAdvisorModal } from './components/production/AIAdvisorModal';

const STORAGE_KEY = 'moldcraft_production_tasks_v3';
const STORAGE_TIME_KEY = 'moldcraft_last_upload_time_v3';

export default function App() {
  // Load tasks from localStorage or parse RAW_PRODUCTION_CSV (ensuring 24h format)
  const [tasks, setTasks] = useState<ProductionTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('moldcraft_production_tasks_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: ProductionTask) => ({
            ...t,
            startDate: formatTo24Hour(t.startDate),
            finishDate: formatTo24Hour(t.finishDate),
          }));
        }
      }
    } catch (e) {
      console.error('Error loading stored production tasks:', e);
    }
    return parseProductionCSV(RAW_PRODUCTION_CSV);
  });

  // Last uploaded date and time
  const [lastUploadTime, setLastUploadTime] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TIME_KEY);
      if (saved) return saved;
    } catch (e) {
      console.error('Error reading upload time:', e);
    }
    const initialTime = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_TIME_KEY, initialTime);
    } catch (e) {}
    return initialTime;
  });

  // Current active view: machine, job, timeline, master
  const [currentView, setCurrentView] = useState<ProductionViewMode>('machine');

  // Selected Machine & Job State
  const [selectedMachine, setSelectedMachine] = useState<string>('DMG MORI NTX2000');
  const [selectedJobWbs, setSelectedJobWbs] = useState<string>('1.1');

  // Timeline filters
  const [timelineFilterType, setTimelineFilterType] = useState<'all' | 'machine' | 'job'>('all');
  const [timelineFilterValue, setTimelineFilterValue] = useState<string>('');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [aiAdvisorModalOpen, setAIAdvisorModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  }, [tasks]);

  // Compute machine and job summaries
  const machineSummaries = useMemo(() => computeMachineSummaries(tasks), [tasks]);
  const jobSummaries = useMemo(() => computeJobSummaries(tasks), [tasks]);

  // Ensure selectedMachine and selectedJobWbs exist
  useEffect(() => {
    if (machineSummaries.length > 0 && !machineSummaries.some((m) => m.name === selectedMachine)) {
      setSelectedMachine(machineSummaries[0].name);
    }
  }, [machineSummaries, selectedMachine]);

  useEffect(() => {
    if (jobSummaries.length > 0 && !jobSummaries.some((j) => j.wbs === selectedJobWbs)) {
      setSelectedJobWbs(jobSummaries[0].wbs);
    }
  }, [jobSummaries, selectedJobWbs]);

  // Handlers for switching to Gantt view
  const handleOpenGanttForMachine = (machineName: string) => {
    setSelectedMachine(machineName);
    setTimelineFilterType('machine');
    setTimelineFilterValue(machineName);
    setCurrentView('timeline');
  };

  const handleOpenGanttForJob = (jobWbs: string) => {
    setSelectedJobWbs(jobWbs);
    setTimelineFilterType('job');
    setTimelineFilterValue(jobWbs);
    setCurrentView('timeline');
  };

  const handleSelectMachineFromJob = (machineName: string) => {
    setSelectedMachine(machineName);
    setCurrentView('machine');
  };

  const handleUpdateTasks = (newTasks: ProductionTask[], mode: 'overwrite' | 'append') => {
    const formatted = newTasks.map((t) => ({
      ...t,
      startDate: formatTo24Hour(t.startDate),
      finishDate: formatTo24Hour(t.finishDate),
    }));
    if (mode === 'overwrite') {
      setTasks(formatted);
    } else {
      setTasks((prev) => [...prev, ...formatted]);
    }
    const now = new Date().toISOString();
    setLastUploadTime(now);
    try {
      localStorage.setItem(STORAGE_TIME_KEY, now);
    } catch (e) {}
  };

  const handleResetToDefault = () => {
    const defaultData = parseProductionCSV(RAW_PRODUCTION_CSV);
    setTasks(defaultData);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('moldcraft_production_tasks_v2');
    const now = new Date().toISOString();
    setLastUploadTime(now);
    try {
      localStorage.setItem(STORAGE_TIME_KEY, now);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      {/* Executive Top Header */}
      <ProductionHeader
        currentView={currentView}
        onViewChange={(v) => {
          if (v === 'timeline' && currentView === 'machine') {
            setTimelineFilterType('machine');
            setTimelineFilterValue(selectedMachine);
          } else if (v === 'timeline' && currentView === 'job') {
            setTimelineFilterType('job');
            setTimelineFilterValue(selectedJobWbs);
          }
          setCurrentView(v);
        }}
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenAIAdvisor={() => setAIAdvisorModalOpen(true)}
        totalTasks={tasks.length}
        totalMachines={machineSummaries.length}
        totalJobs={jobSummaries.length}
        lastUploadTime={lastUploadTime}
      />

      {/* Main View Area */}
      <main className="flex-1 py-4">
        {currentView === 'machine' && (
          <MachineDashboard
            tasks={tasks}
            machineSummaries={machineSummaries}
            selectedMachine={selectedMachine}
            onSelectMachine={setSelectedMachine}
            onOpenGanttForMachine={handleOpenGanttForMachine}
          />
        )}

        {currentView === 'job' && (
          <JobDashboard
            tasks={tasks}
            jobSummaries={jobSummaries}
            selectedJobWbs={selectedJobWbs}
            onSelectJob={setSelectedJobWbs}
            onOpenGanttForJob={handleOpenGanttForJob}
            onSelectMachineFromJob={handleSelectMachineFromJob}
          />
        )}

        {currentView === 'timeline' && (
          <ProductionGantt
            tasks={tasks}
            machineSummaries={machineSummaries}
            jobSummaries={jobSummaries}
            initialFilterType={timelineFilterType}
            initialFilterValue={timelineFilterValue}
            onSelectMachine={setSelectedMachine}
            onSelectJob={setSelectedJobWbs}
          />
        )}

        {currentView === 'master' && (
          <MasterDataTable
            tasks={tasks}
            onSelectMachine={(m) => {
              setSelectedMachine(m);
              setCurrentView('machine');
            }}
            onSelectJob={(j) => {
              setSelectedJobWbs(j);
              setCurrentView('job');
            }}
            onOpenUpload={() => setUploadModalOpen(true)}
            lastUploadTime={lastUploadTime}
          />
        )}
      </main>

      {/* Modals */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpdateTasks={handleUpdateTasks}
        onResetToDefault={handleResetToDefault}
        lastUploadTime={lastUploadTime}
      />

      <AIAdvisorModal
        isOpen={aiAdvisorModalOpen}
        onClose={() => setAIAdvisorModalOpen(false)}
        tasks={tasks}
        machineSummaries={machineSummaries}
        jobSummaries={jobSummaries}
      />
    </div>
  );
}
