import { WorkspaceApp } from '@/components/workspace-app';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  fetchUserCalendarEvents,
  fetchUserCourses,
  fetchUserTasks,
} from '@/app/actions/core';
import type {
  CalendarEvent,
  Course,
  Priority,
  Task,
  TaskStatus,
} from '@/lib/types';

const priorities = new Set<Priority>(['high', 'medium', 'low']);
const statuses = new Set<TaskStatus>(['todo', 'in_progress', 'done', 'cancelled']);

function jakartaParts(value: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [dbTasks, dbCourses, dbEvents] = await Promise.all([
    fetchUserTasks(),
    fetchUserCourses(),
    fetchUserCalendarEvents(),
  ]);
  
  // Map DB schema to UI Task type
  const mappedTasks: Task[] = dbTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    course: task.courseName || 'Tanpa mata kuliah',
    due: task.dueAt ? new Date(task.dueAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Belum dijadwalkan',
    dueDate: task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : undefined,
    priority: priorities.has(task.priority as Priority) ? (task.priority as Priority) : 'medium',
    status: statuses.has(task.status as TaskStatus) ? (task.status as TaskStatus) : 'todo',
  }));

  const mappedCourses: Course[] = dbCourses.map((course) => ({
    id: course.id,
    name: course.name,
    code: course.code || 'TANPA KODE',
    lecturer: course.lecturer || 'Dosen belum diatur',
    tone: ['coral', 'amber', 'blue', 'purple'].includes(course.color)
      ? course.color
      : 'blue',
    progress: 0,
    tasks: mappedTasks.filter((task) => task.course === course.name).length,
    files: 0,
  }));

  const mappedEvents: CalendarEvent[] = dbEvents.map((event) => {
    const start = jakartaParts(event.startsAt);
    const end = jakartaParts(event.endsAt);
    return {
      id: event.id,
      title: event.title,
      date: start.date,
      startTime: start.time === '00:00' ? undefined : start.time,
      endTime: end.date === start.date ? end.time : undefined,
      course: event.courseName || undefined,
      type: 'event',
      color: 'blue',
    };
  });

  return (
    <WorkspaceApp
      user={user}
      initialTasks={mappedTasks}
      initialCourses={mappedCourses}
      initialCalendarEvents={mappedEvents}
    />
  );
}
