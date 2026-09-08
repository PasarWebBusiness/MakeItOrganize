export type ViewKey =
  | 'dashboard'
  | 'calendar'
  | 'tasks'
  | 'courses'
  | 'course-detail'
  | 'files'
  | 'notes'
  | 'canvas'
  | 'ai'
  | 'history'
  | 'notifications'
  | 'settings';

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type Task = {
  id: string;
  title: string;
  description?: string;
  course: string;
  due: string;
  dueDate?: string; // ISO date string YYYY-MM-DD
  priority: Priority;
  status: TaskStatus;
  reminder?: string;
  attachments?: string[];
};

export type Note = {
  id: string;
  title: string;
  course: string;
  body: string;
  updated: string;
};

export type FileItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  course: string;
  updated: string;
  starred?: boolean;
  shared?: boolean;
};

export type Activity = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  time: string;
  status: 'success' | 'pending' | 'failed';
  authorization?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;
  course?: string;
  type: 'class' | 'task' | 'deadline' | 'event' | 'focus';
  color?: string;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  lecturer: string;
  tone: string;
  progress: number;
  tasks: number;
  files: number;
  schedule?: string;
  room?: string;
};

export type Semester = {
  id: string;
  name: string;
  status: 'planned' | 'active' | 'archived';
  courses: Course[];
};
