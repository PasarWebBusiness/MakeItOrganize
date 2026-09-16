'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { IdleSessionGuard } from '@/components/idle-session-guard';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare2,
  FileText,
  Files,
  History,
  Home,
  Menu,
  Moon,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  archiveCourseAction,
  createCalendarEventAction,
  createCourseAction,
  createTaskAction,
  deleteCalendarEventAction,
  deleteTaskAction,
  toggleTaskAction,
  updateCalendarEventAction,
  updateCourseAction,
  updateTaskTitleAction,
} from '@/app/actions/core';
import { syncGoogleCalendarAction } from '@/app/actions/integrations';
import {
  createNoteAction,
  deleteFileAction,
  deleteNoteAction,
  renameFileAction,
  recordActivityAction,
  updateNoteAction,
  uploadFileAction,
  saveCanvasAction,
} from '@/app/actions/resources';
import type {
  Activity,
  CalendarEvent,
  CanvasDocument,
  Course,
  FileItem,
  Note,
  NotificationItem,
  Task,
  ViewKey,
} from '@/lib/types';
import {
  AIView,
  CalendarView,
  CanvasView,
  CoursesView,
  DashboardView,
  FilesView,
  HistoryView,
  NotesView,
  NotificationsView,
  SettingsView,
  TasksView,
} from './app-views';

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: Record<string, unknown>,
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

const navigation: {
  label: string;
  view: ViewKey;
  icon: typeof Home;
  section?: string;
}[] = [
  { label: 'Hari ini', view: 'dashboard', icon: Home, section: 'Workspace' },
  { label: 'Kalender', view: 'calendar', icon: CalendarDays },
  { label: 'Tugas', view: 'tasks', icon: CheckSquare2 },
  { label: 'Mata kuliah', view: 'courses', icon: BookOpen },
  { label: 'File', view: 'files', icon: Files },
  { label: 'Catatan', view: 'notes', icon: FileText, section: 'Create' },
  { label: 'Canvas', view: 'canvas', icon: PenLine },
  {
    label: 'AI Assistant',
    view: 'ai',
    icon: Sparkles,
    section: 'Intelligence',
  },
  { label: 'History', view: 'history', icon: History },
  { label: 'Notifikasi', view: 'notifications', icon: Bell },
  { label: 'Settings', view: 'settings', icon: Settings },
];

const titles: Record<
  ViewKey,
  { eyebrow: string; title: string; description: string }
> = {
  dashboard: {
    eyebrow: 'SELASA, 8 SEPTEMBER',
    title: 'Selamat datang.',
    description: 'Satu kelas lagi dan dua hal penting perlu selesai hari ini.',
  },
  calendar: {
    eyebrow: 'SEPTEMBER 2026',
    title: 'Kalender',
    description:
      'Jadwal kuliah, waktu fokus, dan deadline dalam satu pandangan.',
  },
  tasks: {
    eyebrow: '4 TUGAS AKTIF',
    title: 'Tugas',
    description: 'Prioritas yang jelas tanpa kerumitan project management.',
  },
  courses: {
    eyebrow: 'SEMESTER 5',
    title: 'Mata kuliah',
    description:
      'Semua materi, tugas, dan jadwal terhubung ke konteks belajarmu.',
  },
  'course-detail': {
    eyebrow: 'MATA KULIAH',
    title: 'Detail mata kuliah',
    description: 'Semua resource terhubung ke mata kuliah ini.',
  },
  files: {
    eyebrow: 'PERSONAL WORKSPACE',
    title: 'File',
    description: 'Simpan, temukan, dan bagikan bahan perkuliahan.',
  },
  notes: {
    eyebrow: 'CATATAN TERHUBUNG',
    title: 'Notes',
    description: 'Tulis cepat dan temukan kembali melalui mata kuliah.',
  },
  canvas: {
    eyebrow: 'HANDWRITING',
    title: 'Canvas',
    description: 'Ruang bebas untuk stylus, diagram, dan catatan kelas.',
  },
  ai: {
    eyebrow: 'CONTEXT-AWARE',
    title: 'AI Assistant',
    description: 'Tanyakan jadwal, tugas, dan materi yang sudah kamu izinkan.',
  },
  history: {
    eyebrow: 'AUDIT TRAIL',
    title: 'History',
    description: 'Lihat siapa melakukan apa, kapan, dan dengan izin mana.',
  },
  notifications: {
    eyebrow: 'INBOX',
    title: 'Notifikasi',
    description: 'Pengingat penting tanpa kebisingan yang tidak perlu.',
  },
  settings: {
    eyebrow: 'PERSONAL WORKSPACE',
    title: 'Settings',
    description: 'Kelola akun, integrasi, izin AI, tampilan, dan keamanan.',
  },
};

export function WorkspaceApp({
  user,
  initialTasks,
  initialCourses,
  initialCalendarEvents,
  initialNotes,
  initialFiles,
  initialActivities,
  initialNotifications,
  initialCanvas,
  initialPreferences,
  initialGoogleConnection,
}: {
  user?: { name: string; email: string };
  initialTasks?: Task[];
  initialCourses?: Course[];
  initialCalendarEvents?: CalendarEvent[];
  initialNotes?: Note[];
  initialFiles?: FileItem[];
  initialActivities?: Activity[];
  initialNotifications?: NotificationItem[];
  initialCanvas?: CanvasDocument;
  initialPreferences?: {
    browserNotifications: boolean;
    emailNotifications: boolean;
    weeklySummary: boolean;
    aiRead: boolean;
    aiMove: boolean;
    aiCreate: boolean;
    readNotificationIds: string[];
  };
  initialGoogleConnection?: {
    connected: boolean;
    accountEmail?: string;
    grantedScopes: string[];
    status?: 'active' | 'reauth_required' | 'revoked' | 'error';
    calendarEnabled: boolean;
    lastSyncedAt?: string;
  };
}) {
  const [view, setView] = useState<ViewKey>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(initialTasks ?? []);
  const [notes, setNotes] = useState<Note[]>(initialNotes ?? []);
  const [files, setFiles] = useState<FileItem[]>(initialFiles ?? []);
  const [activities, setActivities] = useState<Activity[]>(initialActivities ?? []);
  const [courses, setCourses] = useState<Course[]>(initialCourses ?? []);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(
    initialCalendarEvents ?? [],
  );
  const [dark, setDark] = useState(() =>
    typeof document === 'undefined'
      ? false
      : document.documentElement.classList.contains('dark'),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourse, setTaskCourse] = useState(
    () => initialCourses?.[0]?.name ?? 'Tanpa mata kuliah',
  );
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [notifCount, setNotifCount] = useState(() =>
    Math.max(0, (initialNotifications?.length ?? 0) - (initialPreferences?.readNotificationIds.length ?? 0)),
  );
  const [canvas, setCanvas] = useState<CanvasDocument>(initialCanvas ?? { title: 'Canvas tanpa judul', course: 'Tanpa mata kuliah', strokes: '[]', updated: 'Belum disimpan' });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('mio-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view');
    if (requestedView !== 'settings' && requestedView !== 'calendar') return;
    const timer = window.setTimeout(() => setView(requestedView), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const addActivity = (activity: Activity, persist = true) => {
    setActivities((current) => [activity, ...current]);
    if (persist) void recordActivityAction(activity).catch(console.error);
  };

  const addTask = async (rawTitle = taskTitle, course = taskCourse) => {
    const clean = rawTitle.trim();
    if (!clean) return null;
    
    // Optimistic UI update
    const optimisticId = crypto.randomUUID();
    const task: Task = {
      id: optimisticId,
      title: clean,
      course,
      due: taskDue || 'Belum dijadwalkan',
      dueDate: taskDue || undefined,
      priority: taskPriority,
      status: 'todo',
    };
    
    setTasks((current) => [task, ...current]);
    
    setTaskTitle('');
    setTaskDue('');
    setTaskPriority('medium');
    setCreateOpen(false);
    
    // Server execution
    try {
      const realId = await createTaskAction({
        title: clean,
        courseName: course,
        dueAt: taskDue ? new Date(taskDue).getTime() : undefined,
        priority: taskPriority,
      });
      // Replace optimistic ID with real ID silently
      setTasks(current => current.map(t => t.id === optimisticId ? { ...t, id: realId } : t));
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'membuat task',
        resource: clean,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      });
      return { ...task, id: realId };
    } catch (error) {
      console.error(error);
      setTasks((current) => current.filter((item) => item.id !== optimisticId));
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Sistem',
        action: 'gagal membuat task',
        resource: clean,
        time: 'Baru saja',
        status: 'failed',
        authorization: 'Server validation',
      });
      return null;
    }
  };

  const addTaskRef = useRef(addTask);
  useEffect(() => {
    addTaskRef.current = addTask;
  });

  const toggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const newStatus = target.status === 'done' ? 'todo' : 'done';
    
    // Optimistic UI
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task,
      ),
    );
    
    // Server execution
    toggleTaskAction(id, newStatus)
      .then(() => addActivity({
        id: crypto.randomUUID(), actor: 'Kamu',
        action: newStatus === 'done' ? 'menyelesaikan task' : 'membuka kembali task',
        resource: target.title, time: 'Baru saja', status: 'success', authorization: 'User action',
      }))
      .catch((error) => {
        console.error(error);
        setTasks((current) => current.map((task) => task.id === id ? { ...task, status: target.status } : task));
      });
  };

  const editTask = (id: string, patch: Partial<Task>) => {
    const target = tasks.find((task) => task.id === id);
    if (!target) return;

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );
    if (patch.title) {
      updateTaskTitleAction(id, patch.title)
        .then(() => {
          addActivity({
            id: crypto.randomUUID(),
            actor: 'Kamu',
            action: 'memperbarui task',
            resource: patch.title || target.title,
            time: 'Baru saja',
            status: 'success',
            authorization: 'User action',
          });
        })
        .catch((error) => {
          console.error(error);
          setTasks((current) =>
            current.map((task) =>
              task.id === id ? { ...task, title: target.title } : task,
            ),
          );
          addActivity({
            id: crypto.randomUUID(),
            actor: 'Sistem',
            action: 'gagal memperbarui task',
            resource: target.title,
            time: 'Baru saja',
            status: 'failed',
            authorization: 'Server validation',
          });
        });
      return;
    }
    addActivity({
      id: crypto.randomUUID(),
      actor: 'Kamu',
      action: 'memperbarui task',
      resource: target.title,
      time: 'Baru saja',
      status: 'success',
      authorization: 'User action',
    });
  };

  const deleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const targetIndex = tasks.findIndex((task) => task.id === id);
    
    // Optimistic UI
    setTasks((current) => current.filter((t) => t.id !== id));
    
    // Server execution
    deleteTaskAction(id)
      .then(() => {
        addActivity({
          id: crypto.randomUUID(),
          actor: 'Kamu',
          action: 'menghapus task',
          resource: target.title,
          time: 'Baru saja',
          status: 'success',
          authorization: 'User action',
        });
      })
      .catch((error) => {
        console.error(error);
        setTasks((current) => {
          if (current.some((task) => task.id === id)) return current;
          const restored = [...current];
          restored.splice(targetIndex, 0, target);
          return restored;
        });
        addActivity({
          id: crypto.randomUUID(),
          actor: 'Sistem',
          action: 'gagal menghapus task',
          resource: target.title,
          time: 'Baru saja',
          status: 'failed',
          authorization: 'Server validation',
        });
      });
  };

  const addCourse = async (input: {
    name: string;
    code: string;
    lecturer: string;
    tone: string;
  }) => {
    const optimisticId = crypto.randomUUID();
    const course: Course = {
      id: optimisticId,
      ...input,
      progress: 0,
      tasks: 0,
      files: 0,
    };
    setCourses((current) => [course, ...current]);

    try {
      const id = await createCourseAction(input);
      const persisted = { ...course, id };
      setCourses((current) =>
        current.map((item) => (item.id === optimisticId ? persisted : item)),
      );
      if (taskCourse === 'Tanpa mata kuliah') setTaskCourse(input.name);
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'membuat mata kuliah',
        resource: input.name,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      });
      return true;
    } catch (error) {
      console.error(error);
      setCourses((current) =>
        current.filter((item) => item.id !== optimisticId),
      );
      return false;
    }
  };

  const editCourse = async (
    id: string,
    input: { name: string; code: string; lecturer: string; tone: string },
  ) => {
    const target = courses.find((course) => course.id === id);
    if (!target) return false;
    const updated = { ...target, ...input };
    setCourses((current) =>
      current.map((course) => (course.id === id ? updated : course)),
    );
    setTasks((current) =>
      current.map((task) =>
        task.course === target.name ? { ...task, course: input.name } : task,
      ),
    );
    if (taskCourse === target.name) setTaskCourse(input.name);

    try {
      await updateCourseAction(id, input);
      if (selectedCourse?.id === id) setSelectedCourse(updated);
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'memperbarui mata kuliah',
        resource: input.name,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      });
      return true;
    } catch (error) {
      console.error(error);
      setCourses((current) =>
        current.map((course) => (course.id === id ? target : course)),
      );
      setTasks((current) =>
        current.map((task) =>
          task.course === input.name ? { ...task, course: target.name } : task,
        ),
      );
      if (taskCourse === input.name) setTaskCourse(target.name);
      return false;
    }
  };

  const archiveCourse = async (id: string) => {
    const target = courses.find((course) => course.id === id);
    if (!target) return false;
    const targetIndex = courses.findIndex((course) => course.id === id);
    setCourses((current) => current.filter((course) => course.id !== id));

    try {
      await archiveCourseAction(id);
      if (selectedCourse?.id === id) {
        setSelectedCourse(null);
        setView('courses');
      }
      if (taskCourse === target.name) setTaskCourse('Tanpa mata kuliah');
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'mengarsipkan mata kuliah',
        resource: target.name,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      });
      return true;
    } catch (error) {
      console.error(error);
      setCourses((current) => {
        if (current.some((course) => course.id === id)) return current;
        const restored = [...current];
        restored.splice(targetIndex, 0, target);
        return restored;
      });
      return false;
    }
  };

  const addNote = async () => {
    try {
      const id = await createNoteAction({ title: 'Catatan tanpa judul', courseName: 'Tanpa mata kuliah', body: '' });
      const fresh: Note = {
      id,
      title: 'Catatan tanpa judul',
      course: 'Tanpa mata kuliah',
      body: '',
      updated: 'Baru saja',
    };
      setNotes((all) => [fresh, ...all]);
      return fresh;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    const previous = notes;
    setNotes((all) => all.filter((n) => n.id !== id));
    try { await deleteNoteAction(id); } catch (error) { console.error(error); setNotes(previous); }
  };

  const saveNote = async (note: Note) => {
    try {
      await updateNoteAction(note.id, { title: note.title || 'Catatan tanpa judul', courseName: note.course, body: note.body });
      return true;
    } catch (error) { console.error(error); return false; }
  };

  const addCalendarEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const optimisticId = crypto.randomUUID();
    const newEvent: CalendarEvent = { ...event, id: optimisticId };
    setCalendarEvents((all) => [...all, newEvent]);
    try {
      const id = await createCalendarEventAction({
        title: event.title,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        courseName: event.course,
      });
      setCalendarEvents((all) =>
        all.map((item) => (item.id === optimisticId ? { ...item, id } : item)),
      );
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'membuat event',
        resource: event.title,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      });
      return true;
    } catch (error) {
      console.error(error);
      setCalendarEvents((all) =>
        all.filter((item) => item.id !== optimisticId),
      );
      return false;
    }
  };

  const editCalendarEvent = async (id: string, patch: Omit<CalendarEvent, 'id'>) => {
    const target = calendarEvents.find((event) => event.id === id);
    if (!target) return false;
    setCalendarEvents((all) =>
      all.map((event) => (event.id === id ? { ...patch, id } : event)),
    );
    try {
      await updateCalendarEventAction(id, {
        title: patch.title,
        date: patch.date,
        startTime: patch.startTime,
        endTime: patch.endTime,
        courseName: patch.course,
      });
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'memperbarui event',
        resource: patch.title,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      });
      return true;
    } catch (error) {
      console.error(error);
      setCalendarEvents((all) =>
        all.map((event) => (event.id === id ? target : event)),
      );
      return false;
    }
  };

  const deleteCalendarEvent = async (id: string) => {
    const target = calendarEvents.find((event) => event.id === id);
    if (!target) return false;
    const targetIndex = calendarEvents.findIndex((event) => event.id === id);
    setCalendarEvents((all) => all.filter((event) => event.id !== id));
    try {
      await deleteCalendarEventAction(id);
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'menghapus event',
        resource: target.title,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      });
      return true;
    } catch (error) {
      console.error(error);
      setCalendarEvents((all) => {
        if (all.some((event) => event.id === id)) return all;
        const restored = [...all];
        restored.splice(targetIndex, 0, target);
        return restored;
      });
      return false;
    }
  };

  const syncGoogleCalendar = async () => {
    try {
      return await syncGoogleCalendarAction();
    } catch (error) {
      console.error(error);
      return { ok: false as const, synced: 0, removed: 0, skipped: 0 };
    }
  };

  const deleteFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    setFiles((all) => all.filter((f) => f.id !== id));
    if (target) {
      try { await deleteFileAction(id); } catch (error) { console.error(error); setFiles((all) => [target, ...all]); return; }
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'menghapus file',
        resource: target.name,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      }, false);
    }
  };

  const renameFile = async (id: string, newName: string) => {
    const target = files.find((file) => file.id === id);
    setFiles((all) =>
      all.map((f) =>
        f.id === id ? { ...f, name: newName, updated: 'Baru saja' } : f,
      ),
    );
    try { await renameFileAction(id, newName); } catch (error) { console.error(error); if (target) setFiles((all) => all.map((file) => file.id === id ? target : file)); return; }
    addActivity({
      id: crypto.randomUUID(),
      actor: 'Kamu',
      action: 'mengganti nama file',
      resource: newName,
      time: 'Baru saja',
      status: 'success',
      authorization: 'User action',
    }, false);
  };

  const uploadFiles = async (selected: File[], courseName: string) => {
    for (const file of selected) {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('courseName', courseName);
      const id = await uploadFileAction(formData);
      setFiles((all) => [{ id, name: file.name, type: file.name.split('.').at(-1)?.toUpperCase() || 'FILE', size: `${Math.max(1, Math.round(file.size / 1024))} KB`, course: courseName || 'Belum diatur', updated: 'Baru saja' }, ...all]);
    }
  };

  const saveCanvas = async (strokes: string) => {
    try {
      const id = await saveCanvasAction({ id: canvas.id, title: canvas.title, courseName: canvas.course, strokes });
      setCanvas((current) => ({ ...current, id, strokes, updated: 'Baru saja' }));
    } catch (error) { console.error(error); }
  };

  // AI tool registration
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'create_academic_task',
          title: 'Buat tugas akademik',
          description:
            'Membuat satu tugas baru dan menampilkannya pada daftar tugas MakeItOrganize.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', minLength: 1 },
              course: { type: 'string' },
            },
            required: ['title'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input: unknown) {
            const value = input as { title?: unknown; course?: unknown };
            if (typeof value.title !== 'string' || !value.title.trim())
              throw new Error('title wajib berupa teks');
            const task = await addTaskRef.current(
              value.title,
              typeof value.course === 'string'
                ? value.course
                : 'Tanpa mata kuliah',
            );
            if (!task) throw new Error('Task gagal dibuat');
            return { id: task.id, status: 'created', title: task.title };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const navigate = (next: ViewKey, course?: Course) => {
    if (next === 'course-detail' && course) {
      setSelectedCourse(course);
    }
    setView(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const title = view === 'course-detail' && selectedCourse
    ? {
        eyebrow: selectedCourse.code,
        title: selectedCourse.name,
        description: selectedCourse.lecturer,
      }
    : view === 'dashboard'
      ? {
          ...titles.dashboard,
          eyebrow: new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date()).toUpperCase(),
          title: `Selamat datang, ${user?.name?.split(' ')[0] || 'Kawan'}.`,
        }
      : titles[view];

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const syncedCourses = courses.map((course) => {
    const relatedTasks = tasks.filter((task) => task.course === course.name);
    return {
      ...course,
      tasks: relatedTasks.length,
      files: files.filter((file) => file.course === course.name).length,
      progress: relatedTasks.length ? Math.round((relatedTasks.filter((task) => task.status === 'done').length / relatedTasks.length) * 100) : 0,
    };
  });
  const syncedSelectedCourse = selectedCourse ? syncedCourses.find((course) => course.id === selectedCourse.id) ?? selectedCourse : null;

  return (
    <div className="app-frame">
      <IdleSessionGuard />
      {mobileOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand" aria-label="MakeItOrganize">
          <Image
            src="/favicon.svg"
            alt=""
            width={40}
            height={40}
            priority
          />
          <span className="brand-logo-text">
            MakeIt<span>Organize</span>
          </span>
          <button
            className="close-mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="side-nav" aria-label="Navigasi utama">
          {navigation.map((item) => (
            <div key={item.view}>
              {item.section && (
                <p className="nav-eyebrow nav-group">{item.section}</p>
              )}
              <button
                className={`nav-item ${(view === item.view || (item.view === 'courses' && view === 'course-detail')) ? 'is-active' : ''} ${item.view === 'ai' ? 'ai-nav' : ''}`}
                onClick={() => navigate(item.view)}
              >
                <item.icon size={19} />
                <span>{item.label}</span>
                {item.view === 'tasks' && activeTasks.length > 0 ? (
                  <span className="nav-count">{activeTasks.length}</span>
                ) : null}
                {item.view === 'notifications' && notifCount > 0 ? (
                  <span className="nav-count">{notifCount}</span>
                ) : null}
              </button>
            </div>
          ))}
        </nav>
        <button className="profile-chip" onClick={() => navigate('settings')}>
          <span className="avatar">{user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}</span>
          <span>
            <strong>{user?.name || 'User'}</strong>
            <small>Personal workspace</small>
          </span>
          <MoreHorizontal size={18} />
        </button>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={21} />
          </button>
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tugas, file, atau catatan..."
            />
          </label>
          <button
            className="icon-button"
            onClick={() => { navigate('notifications'); setNotifCount(0); }}
            aria-label="Notifikasi"
          >
            <Bell size={20} />
            {notifCount > 0 && <span className="notification-dot" />}
          </button>
          <button
            className="icon-button theme-button"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Button className="quick-add" onClick={() => setCreateOpen(true)}>
            <Plus size={17} /> Tambah tugas
          </Button>
        </header>
        <div className="dashboard-wrap">
          <section className="welcome-row page-intro">
            <div>
              <p className="date-label">{title.eyebrow}</p>
              <h1>{title.title}</h1>
              <p className="welcome-copy">{title.description}</p>
            </div>
            {view === 'dashboard' && (
              <div className="day-score">
                <span>
                  <strong>
                    {tasks.filter((task) => task.status === 'done').length}
                  </strong>
                  /{tasks.length}
                </span>
                <small>agenda selesai</small>
              </div>
            )}
          </section>
          {view === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              files={files}
              courses={syncedCourses}
              events={calendarEvents}
              onToggle={toggleTask}
              onNavigate={navigate}
            />
          )}
          {view === 'calendar' && (
            <CalendarView
              events={calendarEvents}
              onAdd={addCalendarEvent}
              onEdit={editCalendarEvent}
              onDelete={deleteCalendarEvent}
              courses={courses}
              googleConnection={initialGoogleConnection}
              onGoogleSync={syncGoogleCalendar}
            />
          )}
          {view === 'tasks' && (
            <TasksView
              tasks={tasks}
              courses={courses}
              query={query}
              onToggle={toggleTask}
              onEdit={editTask}
              onDelete={deleteTask}
              onAdd={() => setCreateOpen(true)}
            />
          )}
          {(view === 'courses' || view === 'course-detail') && (
            <CoursesView
              courses={syncedCourses}
              tasks={tasks}
              files={files}
              notes={notes}
              selectedCourse={syncedSelectedCourse}
              onNavigate={navigate}
              onSelectCourse={(c) => navigate('course-detail', c)}
              onBack={() => { setSelectedCourse(null); navigate('courses'); }}
              onToggleTask={toggleTask}
              onAdd={addCourse}
              onEdit={editCourse}
              onArchive={archiveCourse}
            />
          )}
          {view === 'files' && (
            <FilesView
              files={files}
              query={query}
              courses={courses}
              onDelete={deleteFile}
              onRename={renameFile}
              onUpload={uploadFiles}
            />
          )}
          {view === 'notes' && (
            <NotesView
              notes={notes}
              setNotes={setNotes}
              onAdd={addNote}
              onDelete={deleteNote}
              onSave={saveNote}
              courses={courses}
            />
          )}
          {view === 'canvas' && <CanvasView canvas={canvas} onSave={saveCanvas} />}
          {view === 'ai' && (
            <AIView tasks={tasks} notes={notes} files={files} />
          )}
          {view === 'history' && <HistoryView activities={activities} />}
          {view === 'notifications' && (
            <NotificationsView
              onUnreadChange={setNotifCount}
              initialRead={initialPreferences?.readNotificationIds}
              items={initialNotifications ?? []}
            />
          )}
          {view === 'settings' && (
            <SettingsView
              dark={dark}
              setDark={setDark}
              user={user}
              initialPreferences={initialPreferences}
              googleConnection={initialGoogleConnection}
            />
          )}
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Navigasi mobile">
        {[
          { view: 'dashboard' as const, label: 'Hari ini', icon: Home },
          { view: 'calendar' as const, label: 'Kalender', icon: CalendarDays },
          { view: 'tasks' as const, label: 'Tugas', icon: CheckSquare2 },
          { view: 'courses' as const, label: 'Kuliah', icon: BookOpen },
        ].map((item) => (
          <button
            className={view === item.view || (item.view === 'courses' && view === 'course-detail') ? 'is-active' : ''}
            key={item.view}
            onClick={() => navigate(item.view)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={
            !['dashboard', 'calendar', 'tasks', 'courses', 'course-detail'].includes(view)
              ? 'is-active'
              : ''
          }
          onClick={() => setMobileOpen(true)}
        >
          <MoreHorizontal size={20} />
          <span>Lainnya</span>
        </button>
      </nav>

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="create-dialog">
          <DialogHeader>
            <DialogTitle>Buat tugas baru</DialogTitle>
            <DialogDescription>
              Hubungkan tugas ke mata kuliah agar jadwal, file, dan AI memiliki
              konteks yang sama.
            </DialogDescription>
          </DialogHeader>
          <div className="form-stack">
            <label>
              Judul tugas
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Contoh: Kerjakan latihan Bab 4"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void addTask();
                }}
              />
            </label>
            <label>
              Mata kuliah
              <select
                value={taskCourse}
                onChange={(event) => setTaskCourse(event.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
                <option>Tanpa mata kuliah</option>
              </select>
            </label>
            <div className="form-row-2">
              <label>
                Tenggat (opsional)
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                />
              </label>
              <label>
                Prioritas
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                >
                  <option value="high">Tinggi</option>
                  <option value="medium">Sedang</option>
                  <option value="low">Rendah</option>
                </select>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button onClick={() => addTask()} disabled={!taskTitle.trim()}>
              Buat tugas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
