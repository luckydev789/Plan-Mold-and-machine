export type TaskStage = 'todo' | 'in_progress' | 'review' | 'completed';

export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type ViewMode = 'kanban' | 'timeline' | 'table' | 'calendar' | 'matrix';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Assignee {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  initials: string;
  color: string;
}

export interface PlannerTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  stage: TaskStage;
  priority: Priority;
  category: string;
  assigneeId: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  estimatedHours: number;
  loggedHours: number;
  subtasks: SubTask[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  category: string;
  startDate: string;
  targetEndDate: string;
  createdAt: string;
}

export interface FilterState {
  search: string;
  quickFilter: 'all' | 'my_tasks' | 'due_today' | 'high_priority' | 'overdue';
  category: string;
  stage: string;
  priority: string;
}
