'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Files,
  Folder,
  LockKeyhole,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CanvasBoard } from './canvas-board';
import type {
  Activity,
  CalendarEvent,
  Course,
  FileItem,
  Note,
  Task,
  ViewKey,
} from '@/lib/types';

/* ─── Shared helpers ─────────────────────────────────────── */

const courseTone: Record<string, string> = {
  'Statistika II': 'coral',
  'Manajemen Operasi': 'amber',
  'Pemrograman Web': 'blue',
  'Metode Penelitian': 'purple',
};

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: typeof CheckCircle2;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  compact,
}: {
  task: Task;
  onToggle: (id: string) => void;
  compact?: boolean;
}) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';
  return (
    <div className={`task-row ${task.status === 'done' ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''}`}>
      <Checkbox
        checked={task.status === 'done'}
        onCheckedChange={() => onToggle(task.id)}
        aria-label={`Tandai ${task.title} selesai`}
      />
      <span className={`course-dot ${courseTone[task.course] || 'green'}`} />
      <div className="task-copy">
        <strong>{task.title}</strong>
        <p>{task.course}</p>
      </div>
      {overdue && !compact && (
        <span className="overdue-pill">
          <AlertTriangle size={10} /> Lewat tenggat
        </span>
      )}
      <time className={overdue ? 'overdue-time' : ''}>{task.due}</time>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────── */

export function DashboardView({
  tasks,
  files,
  onToggle,
  onNavigate,
}: {
  tasks: Task[];
  files: FileItem[];
  onToggle: (id: string) => void;
  onNavigate: (view: ViewKey) => void;
}) {
  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const overdueTasks = activeTasks.filter((t) => isOverdue(t.dueDate));
  const recentFiles = [...files].slice(0, 2);

  return (
    <>
      <section className="ai-brief">
        <div className="ai-orb">
          <Sparkles size={22} />
        </div>
        <div className="ai-copy">
          <span className="ai-label">RINGKASAN CERDAS</span>
          <p>
            {overdueTasks.length > 0 ? (
              <>
                <strong>{overdueTasks.length} tugas melewati tenggat.</strong> Prioritaskan &ldquo;
                {overdueTasks[0].title}&rdquo; hari ini.
              </>
            ) : (
              <>
                Kamu punya jeda <strong>2 jam</strong> sebelum kelas berikutnya.
                Mulai tugas Regresi sekarang agar selesai sebelum tenggat malam ini.
              </>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          className="ai-action"
          onClick={() => onNavigate('ai')}
        >
          Buat rencana <ChevronRight size={16} />
        </Button>
      </section>
      <div className="dashboard-grid">
        <section className="panel today-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">AGENDA</span>
              <h2>Hari ini</h2>
            </div>
            <button className="text-action" onClick={() => onNavigate('calendar')}>
              Lihat kalender
            </button>
          </div>
          <div className="timeline">
            <Timeline time="08.00" title="Statistika II" detail="Gedung B · Ruang 204" state="past" />
            <Timeline time="13.30" title="Manajemen Operasi" detail="Online · Google Meet" state="current" />
            <Timeline time="16.00" title="Waktu fokus" detail="Kerjakan analisis regresi" />
          </div>
        </section>
        <section className="panel tasks-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">PRIORITAS</span>
              <h2>Perlu dikerjakan</h2>
            </div>
            {overdueTasks.length > 0 && (
              <span className="overdue-badge">
                <AlertTriangle size={11} /> {overdueTasks.length} lewat tenggat
              </span>
            )}
          </div>
          <div className="task-list">
            {activeTasks.slice(0, 3).map((task) => (
              <TaskRow key={task.id} task={task} onToggle={onToggle} compact />
            ))}
            {activeTasks.length === 0 && (
              <EmptyState icon={CheckCircle2} title="Semua selesai!" text="Tidak ada tugas aktif." />
            )}
          </div>
          <button className="all-tasks" onClick={() => onNavigate('tasks')}>
            Semua tugas <ChevronRight size={16} />
          </button>
        </section>
        <section className="panel focus-panel">
          <div className="focus-icon">
            <BookOpen size={21} />
          </div>
          <div>
            <span className="section-kicker">LANJUTKAN</span>
            <h3>Statistika II</h3>
            <p>Materi terakhir: Regresi Linear Berganda</p>
          </div>
          <div className="progress-track">
            <span style={{ width: '68%' }} />
          </div>
          <small>5 dari 7 materi minggu ini dibaca</small>
          <button className="open-course" onClick={() => onNavigate('courses')}>
            Buka mata kuliah <ChevronRight size={16} />
          </button>
        </section>
        <section className="panel files-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">TERBARU</span>
              <h2>File &amp; catatan</h2>
            </div>
            <button className="text-action" onClick={() => onNavigate('files')}>
              Lihat semua
            </button>
          </div>
          {recentFiles.map((f) => (
            <RecentFile
              key={f.id}
              icon={f.type === 'PDF' ? 'PDF' : f.type === 'XLSX' ? 'XLS' : f.type.slice(0, 3)}
              title={f.name}
              detail={`${f.course} · ${f.updated}`}
              tone={f.type === 'PDF' ? 'pdf' : f.type === 'XLSX' ? 'xlsx' : 'note'}
            />
          ))}
        </section>
      </div>
    </>
  );
}

function Timeline({ time, title, detail, state = '' }: { time: string; title: string; detail: string; state?: string }) {
  return (
    <div className={`timeline-row ${state ? `is-${state}` : ''}`}>
      <time>{time}</time>
      <span className="timeline-line"><i /></span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      {state === 'past' && <span className="status-pill done">Selesai</span>}
      {state === 'current' && <span className="status-pill current">35 menit lagi</span>}
    </div>
  );
}

function RecentFile({ icon, title, detail, tone }: { icon: string; title: string; detail: string; tone: string }) {
  return (
    <div className="recent-file">
      <span className={`file-icon ${tone}`}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <MoreHorizontal size={18} />
    </div>
  );
}

/* ─── Calendar ───────────────────────────────────────────── */

export function CalendarView({
  events,
  onAdd,
  onEdit,
  onDelete,
  courses,
  googleConnection,
  onGoogleSync,
}: {
  events: CalendarEvent[];
  onAdd: (event: Omit<CalendarEvent, 'id'>) => Promise<boolean>;
  onEdit: (id: string, event: Omit<CalendarEvent, 'id'>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  courses: Course[];
  googleConnection?: {
    connected: boolean;
    calendarEnabled: boolean;
    accountEmail?: string;
    lastSyncedAt?: string;
  };
  onGoogleSync: () => Promise<{ ok: boolean; synced: number; removed: number; skipped: number }>;
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [calendarMode, setCalendarMode] = useState<'month' | 'week' | 'year'>('month');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [syncFailed, setSyncFailed] = useState(false);
  const autoSyncStarted = useRef(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
  );
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarStatus = params.get('calendar');
    if (calendarStatus === 'synced') {
      const count = Number(params.get('count') ?? 0);
      const timer = window.setTimeout(
        () => {
          setSyncFailed(false);
          setSyncNotice(`${Number.isFinite(count) ? count : 0} event Google berhasil disinkronkan.`);
        },
        0,
      );
      return () => window.clearTimeout(timer);
    }
    if (calendarStatus !== 'sync_pending' || autoSyncStarted.current) return;
    autoSyncStarted.current = true;
    void (async () => {
      setSyncingGoogle(true);
      setSyncNotice('Menyesuaikan Calendar dari akun Google…');
      const result = await onGoogleSync();
      if (result.ok) {
        window.location.replace(`/?view=calendar&calendar=synced&count=${result.synced}`);
        return;
      }
      setSyncingGoogle(false);
      setSyncFailed(true);
      setSyncNotice('Akun berhasil masuk, tetapi Calendar belum dapat disinkronkan. Coba lagi dari tombol Sinkronkan.');
    })();
  }, [onGoogleSync]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const navigateCalendar = (direction: -1 | 1) => {
    if (calendarMode === 'year') {
      setCurrentMonth(new Date(year + direction, month, 1));
      return;
    }
    if (calendarMode === 'week') {
      const nextDate = new Date(year, month, selectedDay + direction * 7);
      setCurrentMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      setSelectedDay(nextDate.getDate());
      return;
    }
    setCurrentMonth(new Date(year, month + direction, 1));
    setSelectedDay(1);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr);
  };

  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const selectedEvents = events.filter((e) => e.date === selectedDateStr);

  const openCreate = () => {
    setEditingEvent(null);
    setNewTitle('');
    setNewDate(selectedDateStr);
    setNewTime('');
    setNewEndTime('');
    setNewCourse('');
    setFormError('');
    setCreateOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewTitle(event.title);
    setNewDate(event.date);
    setNewTime(event.startTime || '');
    setNewEndTime(event.endTime || '');
    setNewCourse(event.course || '');
    setFormError('');
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    setFormError('');
    const nextEvent: Omit<CalendarEvent, 'id'> = {
      title: newTitle.trim(),
      date: newDate,
      startTime: newTime || undefined,
      endTime: newEndTime || undefined,
      course: newCourse || undefined,
      type: 'event',
      color: 'blue',
    };
    const success = editingEvent
      ? await onEdit(editingEvent.id, nextEvent)
      : await onAdd(nextEvent);
    setSaving(false);
    if (success) setCreateOpen(false);
    else setFormError('Event tidak dapat disimpan. Periksa waktu lalu coba lagi.');
  };

  const isToday = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

  const syncGoogle = async () => {
    setSyncingGoogle(true);
    setSyncNotice('');
    setSyncFailed(false);
    const result = await onGoogleSync();
    setSyncingGoogle(false);
    if (!result.ok) {
      setSyncFailed(true);
      setSyncNotice('Sinkronisasi gagal. Periksa izin Google lalu coba lagi.');
      return;
    }
    window.location.assign(`/?view=calendar&calendar=synced&count=${result.synced}`);
  };

  return (
    <div className="calendar-layout">
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div>
            <button onClick={() => navigateCalendar(-1)} aria-label="Periode sebelumnya">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => navigateCalendar(1)} aria-label="Periode berikutnya">
              <ChevronRight size={18} />
            </button>
            <strong>{monthName}</strong>
          </div>
          <div>
            <button className={`view-pill ${calendarMode === 'month' ? 'active' : ''}`} onClick={() => setCalendarMode('month')}>Bulan</button>
            <button className={`view-pill ${calendarMode === 'week' ? 'active' : ''}`} onClick={() => setCalendarMode('week')}>Minggu</button>
            <button className={`view-pill ${calendarMode === 'year' ? 'active' : ''}`} onClick={() => setCalendarMode('year')}>Tahun</button>
            <Button onClick={openCreate}>
              <Plus size={16} /> Event
            </Button>
          </div>
        </div>
        {calendarMode === 'month' && <div className="month-grid">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
            <span className="weekday" key={d}>{d}</span>
          ))}
          {Array.from({ length: startOffset }, (_, i) => (
            <div className="day-cell empty" key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            return (
              <button
                type="button"
                className={`day-cell ${isToday(day) ? 'today' : ''} ${selectedDay === day ? 'selected' : ''}`}
                key={day}
                onClick={() => setSelectedDay(day)}
                aria-label={`${day} ${monthName}`}
              >
                <span>{day}</span>
                {dayEvents.slice(0, 2).map((evt) => (
                  <i key={evt.id} className={`cal-event ${evt.color || 'green'}`}>
                    {evt.title}
                  </i>
                ))}
                {dayEvents.length > 2 && (
                  <i className="cal-event-more">+{dayEvents.length - 2}</i>
                )}
              </button>
            );
          })}
        </div>}
        {calendarMode === 'week' && (
          <div className="week-grid">
            {Array.from({ length: 7 }, (_, index) => {
              const selectedDate = new Date(year, month, selectedDay);
              const mondayOffset = (selectedDate.getDay() + 6) % 7;
              const date = new Date(year, month, selectedDay - mondayOffset + index);
              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const dayEvents = events.filter((event) => event.date === dateKey);
              return (
                <button
                  key={dateKey}
                  className={`week-day ${dateKey === selectedDateStr ? 'selected' : ''}`}
                  onClick={() => {
                    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                    setSelectedDay(date.getDate());
                  }}
                >
                  <span>{date.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                  <strong>{date.getDate()}</strong>
                  {dayEvents.map((event) => <i key={event.id}>{event.startTime || 'Seharian'} · {event.title}</i>)}
                </button>
              );
            })}
          </div>
        )}
        {calendarMode === 'year' && (
          <div className="year-grid">
            {Array.from({ length: 12 }, (_, monthIndex) => (
              <button
                key={monthIndex}
                className={monthIndex === month ? 'selected' : ''}
                onClick={() => { setCurrentMonth(new Date(year, monthIndex, 1)); setSelectedDay(1); setCalendarMode('month'); }}
              >
                <strong>{new Date(year, monthIndex, 1).toLocaleDateString('id-ID', { month: 'long' })}</strong>
                <span>{events.filter((event) => event.date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, '0')}`)).length} event</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <aside className="panel agenda-side">
        <span className="section-kicker">
          {selectedDay} {currentMonth.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}
        </span>
        <h3>Agenda hari ini</h3>
        {selectedEvents.length > 0 ? (
          selectedEvents.map((evt) => (
            <div key={evt.id} className="agenda-event">
              <span className={`agenda-dot ${evt.color || 'green'}`} />
              <div>
                <strong>{evt.title}</strong>
                {evt.startTime && (
                  <small>{evt.startTime}{evt.endTime ? `–${evt.endTime}` : ''}</small>
                )}
                {evt.course && <small>{evt.course}</small>}
              </div>
              <div className="agenda-event-actions">
                <button onClick={() => openEdit(evt)} aria-label={`Edit ${evt.title}`}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => setDeleteTarget(evt)} aria-label={`Hapus ${evt.title}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="agenda-empty">Tidak ada event di tanggal ini.</p>
        )}
        <div className="sync-card">
          <Cloud size={18} />
          <div>
            <strong>Google Calendar</strong>
            <small>
              {!googleConnection?.connected
                ? 'Akun Google belum terhubung'
                : !googleConnection.calendarEnabled
                  ? 'Izin Calendar belum diberikan'
                  : googleConnection.lastSyncedAt
                    ? `Terakhir sync ${new Date(googleConnection.lastSyncedAt).toLocaleString('id-ID')}`
                    : 'Siap disinkronkan'}
            </small>
          </div>
          {!googleConnection?.calendarEnabled ? (
            <button
              type="button"
              onClick={() => window.location.assign('/api/integrations/google/connect?feature=calendar&returnTo=/?view=calendar')}
            >
              Aktifkan
            </button>
          ) : (
            <button type="button" disabled={syncingGoogle} onClick={() => void syncGoogle()}>
              {syncingGoogle ? 'Sync…' : 'Sinkronkan'}
            </button>
          )}
        </div>
        {syncNotice && <output className={`sync-notice ${syncFailed ? 'error' : 'success'}`}>{syncNotice}</output>}
        <Button className="agenda-add" variant="outline" onClick={openCreate}>
          <Plus size={15} /> Tambah event
        </Button>
      </aside>

      {/* Create Event Dialog */}
      {createOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
          <div className="modal-card">
            <div className="modal-head">
              <strong>{editingEvent ? 'Edit event' : 'Tambah event'}</strong>
              <button onClick={() => setCreateOpen(false)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <div className="form-stack">
              {formError && <div className="auth-error" role="alert">{formError}</div>}
              <label>
                Judul
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Kelas Statistika II"
                />
              </label>
              <div className="form-row-2">
                <label>
                  Tanggal
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </label>
                <label>
                  Mulai (opsional)
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                </label>
              </div>
              <label>
                Selesai (opsional)
                <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
              </label>
              <label>
                Mata kuliah (opsional)
                <select value={newCourse} onChange={(e) => setNewCourse(e.target.value)}>
                  <option value="">Tanpa mata kuliah</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.name}>{course.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Batal</Button>
              <Button onClick={() => void handleSave()} disabled={saving || !newTitle.trim()}>
                {saving ? 'Menyimpan…' : 'Simpan event'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus event?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} akan dihapus dari kalender lokal workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) void onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Tasks ──────────────────────────────────────────────── */

export function TasksView({
  tasks,
  courses,
  query,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
}: {
  tasks: Task[];
  courses: { name: string }[];
  query: string;
  onToggle: (id: string) => void;
  onEdit: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const [filter, setFilter] = useState('Semua');
  const [courseFilter, setCourseFilter] = useState('');
  const [sort, setSort] = useState<'due' | 'priority' | 'created'>('due');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  const visible = tasks
    .filter((t) => {
      const matchQuery = t.title.toLowerCase().includes(query.toLowerCase());
      const matchFilter =
        filter === 'Selesai'
          ? t.status === 'done'
          : filter === 'Aktif'
          ? t.status !== 'done' && t.status !== 'cancelled'
          : filter === 'Lewat tenggat'
          ? isOverdue(t.dueDate) && t.status !== 'done'
          : true;
      const matchCourse = courseFilter ? t.course === courseFilter : true;
      return matchQuery && matchFilter && matchCourse;
    })
    .sort((a, b) => {
      if (sort === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sort === 'due') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate) && t.status !== 'done').length;

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id: string) => {
    if (editTitle.trim()) onEdit(id, { title: editTitle.trim() });
    setEditingId(null);
  };

  return (
    <section className="panel content-panel">
      <div className="content-toolbar">
        <div className="filter-row">
          {['Semua', 'Aktif', 'Selesai', 'Lewat tenggat'].map((item) => (
            <button
              className={filter === item ? 'active' : ''}
              onClick={() => setFilter(item)}
              key={item}
            >
              {item === 'Lewat tenggat' && overdueCount > 0 ? (
                <>{item} <span className="filter-badge">{overdueCount}</span></>
              ) : item}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <select
            className="sort-select"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter mata kuliah"
          >
            <option value="">Semua mata kuliah</option>
            {courses.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as 'due' | 'priority' | 'created')}
            aria-label="Urutkan"
          >
            <option value="due">Urutkan: Tenggat</option>
            <option value="priority">Urutkan: Prioritas</option>
            <option value="created">Urutkan: Terbaru</option>
          </select>
          <Button onClick={onAdd}>
            <Plus size={16} /> Tugas baru
          </Button>
        </div>
      </div>
      <div className="full-task-list">
        {visible.map((task) => {
          const overdue = isOverdue(task.dueDate) && task.status !== 'done';
          return (
            <div
              className={`full-task ${task.status === 'done' ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''}`}
              key={task.id}
            >
              <Checkbox
                checked={task.status === 'done'}
                onCheckedChange={() => onToggle(task.id)}
              />
              <span className={`course-badge ${courseTone[task.course] || 'green'}`}>
                {task.course}
              </span>
              <div>
                {editingId === task.id ? (
                  <input
                    className="task-inline-edit"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEdit(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(task.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                ) : (
                  <strong>{task.title}</strong>
                )}
                <small>
                  {task.status === 'in_progress'
                    ? 'Sedang dikerjakan'
                    : task.status === 'done'
                    ? 'Selesai'
                    : task.status === 'cancelled'
                    ? 'Dibatalkan'
                    : 'Belum dimulai'}
                </small>
              </div>
              <span className={`priority ${task.priority}`}>
                {task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
              </span>
              <time className={overdue ? 'overdue-time' : ''}>
                {overdue && <AlertTriangle size={9} />} {task.due}
              </time>
              <div className="task-actions">
                <button
                  aria-label={`Edit ${task.title}`}
                  onClick={() => startEdit(task)}
                  title="Edit judul"
                >
                  <Pencil size={14} />
                </button>
                <button
                  aria-label={`Hapus ${task.title}`}
                  onClick={() => onDelete(task.id)}
                  title="Hapus tugas"
                  className="danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <EmptyState
            icon={CheckCircle2}
            title="Tidak ada tugas di sini"
            text="Ubah filter atau tambahkan tugas baru."
            action={
              <Button size="sm" onClick={onAdd}>
                <Plus size={14} /> Tugas baru
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
}

/* ─── Courses ────────────────────────────────────────────── */

export function CoursesView({
  courses,
  tasks,
  files,
  notes,
  selectedCourse,
  onNavigate,
  onSelectCourse,
  onBack,
  onToggleTask,
  onAdd,
  onEdit,
  onArchive,
}: {
  courses: Course[];
  tasks: Task[];
  files: FileItem[];
  notes: Note[];
  selectedCourse: Course | null;
  onNavigate: (view: ViewKey) => void;
  onSelectCourse: (course: Course) => void;
  onBack: () => void;
  onToggleTask: (id: string) => void;
  onAdd: (course: {
    name: string;
    code: string;
    lecturer: string;
    tone: string;
  }) => Promise<boolean>;
  onEdit: (
    id: string,
    course: { name: string; code: string; lecturer: string; tone: string },
  ) => Promise<boolean>;
  onArchive: (id: string) => Promise<boolean>;
}) {
  const [tab, setTab] = useState<'ringkasan' | 'tugas' | 'file' | 'catatan'>('ringkasan');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Course | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [tone, setTone] = useState('blue');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditingCourse(null);
    setName('');
    setCode('');
    setLecturer('');
    setTone('blue');
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setName(course.name);
    setCode(course.code === 'TANPA KODE' ? '' : course.code);
    setLecturer(course.lecturer === 'Dosen belum diatur' ? '' : course.lecturer);
    setTone(course.tone);
    setFormError('');
    setEditorOpen(true);
  };

  const saveCourse = async () => {
    if (!name.trim()) {
      setFormError('Nama mata kuliah wajib diisi.');
      return;
    }
    setSaving(true);
    setFormError('');
    const input = {
      name: name.trim(),
      code: code.trim(),
      lecturer: lecturer.trim(),
      tone,
    };
    const success = editingCourse
      ? await onEdit(editingCourse.id, input)
      : await onAdd(input);
    setSaving(false);
    if (success) setEditorOpen(false);
    else setFormError('Perubahan tidak dapat disimpan. Coba lagi.');
  };

  if (selectedCourse) {
    const courseTasks = tasks.filter((t) => t.course === selectedCourse.name);
    const courseFiles = files.filter((f) => f.course === selectedCourse.name);
    const courseNotes = notes.filter((n) => n.course === selectedCourse.name);

    return (
      <div className="course-detail">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Semua mata kuliah
        </button>
        <div className={`course-detail-header ${selectedCourse.tone}`}>
          <div className="course-monogram large">{selectedCourse.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</div>
          <div>
            <span className="section-kicker">{selectedCourse.code}</span>
            <h2>{selectedCourse.name}</h2>
            <p>{selectedCourse.lecturer}</p>
            {selectedCourse.schedule && (
              <div className="course-meta-row">
                <CalendarDays size={13} />
                <span>{selectedCourse.schedule}</span>
                {selectedCourse.room && <span>· {selectedCourse.room}</span>}
              </div>
            )}
          </div>
          <div className="course-detail-progress">
            <strong>{selectedCourse.progress}%</strong>
            <small>materi dipelajari</small>
            <div className="progress-track">
              <span style={{ width: `${selectedCourse.progress}%` }} />
            </div>
          </div>
        </div>
        <div className="course-tabs">
          {(['ringkasan', 'tugas', 'file', 'catatan'] as const).map((t) => (
            <button
              key={t}
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="course-tab-content panel">
          {tab === 'ringkasan' && (
            <div className="course-summary">
              <div className="summary-stats">
                <div className="stat-card">
                  <CheckSquare2 size={20} />
                  <strong>{courseTasks.filter((t) => t.status !== 'done').length}</strong>
                  <small>Tugas aktif</small>
                </div>
                <div className="stat-card">
                  <Files size={20} />
                  <strong>{courseFiles.length}</strong>
                  <small>File</small>
                </div>
                <div className="stat-card">
                  <FileText size={20} />
                  <strong>{courseNotes.length}</strong>
                  <small>Catatan</small>
                </div>
              </div>
              {courseTasks.filter((t) => t.status !== 'done').length > 0 && (
                <div className="summary-section">
                  <h4>Tugas mendatang</h4>
                  {courseTasks
                    .filter((t) => t.status !== 'done')
                    .slice(0, 3)
                    .map((t) => (
                      <div key={t.id} className="task-row">
                        <Checkbox
                          checked={t.status === 'done'}
                          onCheckedChange={() => onToggleTask(t.id)}
                          aria-label={t.title}
                        />
                        <span className={`course-dot ${courseTone[t.course] || 'green'}`} />
                        <div className="task-copy">
                          <strong>{t.title}</strong>
                          <p>{t.due}</p>
                        </div>
                        <span className={`priority ${t.priority}`}>
                          {t.priority === 'high' ? 'Tinggi' : t.priority === 'medium' ? 'Sedang' : 'Rendah'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              {courseFiles.length > 0 && (
                <div className="summary-section">
                  <h4>File terbaru</h4>
                  {courseFiles.slice(0, 3).map((f) => (
                    <div key={f.id} className="recent-file">
                      <span className={`file-icon ${f.type === 'PDF' ? 'pdf' : f.type === 'XLSX' ? 'xlsx' : 'note'}`}>
                        {f.type.slice(0, 3)}
                      </span>
                      <div>
                        <strong>{f.name}</strong>
                        <p>{f.updated}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'tugas' && (
            <div className="course-tab-list">
              {courseTasks.length === 0 ? (
                <EmptyState icon={CheckSquare2} title="Belum ada tugas" text="Tambah tugas untuk mata kuliah ini." />
              ) : (
                courseTasks.map((t) => (
                  <div key={t.id} className={`task-row ${t.status === 'done' ? 'is-done' : ''}`}>
                    <Checkbox checked={t.status === 'done'} onCheckedChange={() => onToggleTask(t.id)} aria-label={t.title} />
                    <span className={`course-dot ${courseTone[t.course] || 'green'}`} />
                    <div className="task-copy">
                      <strong>{t.title}</strong>
                      <p>{t.due}</p>
                    </div>
                    <span className={`priority ${t.priority}`}>
                      {t.priority === 'high' ? 'Tinggi' : t.priority === 'medium' ? 'Sedang' : 'Rendah'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === 'file' && (
            <div className="course-tab-list">
              {courseFiles.length === 0 ? (
                <EmptyState icon={Files} title="Belum ada file" text="Upload file untuk mata kuliah ini." />
              ) : (
                courseFiles.map((f) => (
                  <div key={f.id} className="recent-file">
                    <span className={`file-icon ${f.type === 'PDF' ? 'pdf' : f.type === 'XLSX' ? 'xlsx' : 'note'}`}>
                      {f.type.slice(0, 3)}
                    </span>
                    <div>
                      <strong>{f.name}</strong>
                      <p>{f.size} · {f.updated}</p>
                    </div>
                    <button aria-label={`Download ${f.name}`}><Download size={16} /></button>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === 'catatan' && (
            <div className="course-tab-list">
              {courseNotes.length === 0 ? (
                <EmptyState icon={FileText} title="Belum ada catatan" text="Buat catatan untuk mata kuliah ini." />
              ) : (
                courseNotes.map((n) => (
                  <button key={n.id} className="note-card-btn" onClick={() => onNavigate('notes')}>
                    <strong>{n.title}</strong>
                    <p>{n.body.slice(0, 80)}{n.body.length > 80 ? '…' : ''}</p>
                    <small>{n.updated}</small>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="course-list-toolbar">
        <div>
          <strong>{courses.length} mata kuliah aktif</strong>
          <span>Data tersimpan di personal workspace</span>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Mata kuliah baru
        </Button>
      </div>
      <div className="course-grid">
        {courses.map((course) => (
          <article className={`course-card ${course.tone}`} key={course.id}>
          <div className="course-top">
            <span>{course.code}</span>
            <button
              aria-label={`Edit ${course.name}`}
              onClick={() => openEdit(course)}
              title="Edit mata kuliah"
            >
              <Pencil size={17} />
            </button>
          </div>
          <div className="course-monogram">
            {course.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
          </div>
          <h2>{course.name}</h2>
          <p>{course.lecturer}</p>
          {course.schedule && (
            <div className="course-schedule">
              <CalendarDays size={11} />
              <span>{course.schedule}</span>
            </div>
          )}
          <div className="course-stats">
            <span><CheckSquare2 size={15} />{course.tasks} tugas</span>
            <span><Files size={15} />{course.files} file</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${course.progress}%` }} />
          </div>
          <footer>
            <small>{course.progress}% materi dipelajari</small>
            <button onClick={() => onSelectCourse(course)}>
              Buka <ChevronRight size={15} />
            </button>
          </footer>
          </article>
        ))}
        {courses.length === 0 && (
          <div className="panel course-empty-panel">
            <EmptyState
              icon={BookOpen}
              title="Belum ada mata kuliah"
              text="Tambahkan mata kuliah agar tugas, catatan, file, dan jadwal memiliki konteks yang sama."
              action={
                <Button size="sm" onClick={openCreate}>
                  <Plus size={14} /> Mata kuliah baru
                </Button>
              }
            />
          </div>
        )}
      </div>

      {editorOpen && (
        <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
          <div className="modal-card" aria-labelledby="course-editor-title">
            <div className="modal-head">
              <strong id="course-editor-title">
                {editingCourse ? 'Edit mata kuliah' : 'Mata kuliah baru'}
              </strong>
              <button onClick={() => setEditorOpen(false)} aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <div className="form-stack">
              {formError && <div className="auth-error" role="alert">{formError}</div>}
              <label>
                Nama mata kuliah
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Contoh: Statistika II"
                  maxLength={120}
                />
              </label>
              <div className="form-row-2">
                <label>
                  Kode
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="TI12345"
                    maxLength={32}
                  />
                </label>
                <label>
                  Warna
                  <select value={tone} onChange={(event) => setTone(event.target.value)}>
                    <option value="blue">Biru</option>
                    <option value="coral">Koral</option>
                    <option value="amber">Amber</option>
                    <option value="purple">Ungu</option>
                  </select>
                </label>
              </div>
              <label>
                Dosen
                <input
                  value={lecturer}
                  onChange={(event) => setLecturer(event.target.value)}
                  placeholder="Nama dosen (opsional)"
                  maxLength={120}
                />
              </label>
            </div>
            <div className="modal-footer course-modal-footer">
              {editingCourse && (
                <Button
                  variant="ghost"
                  className="danger-action"
                  onClick={() => {
                    setEditorOpen(false);
                    setArchiveTarget(editingCourse);
                  }}
                >
                  <Archive size={15} /> Arsipkan
                </Button>
              )}
              <span className="modal-footer-spacer" />
              <Button variant="ghost" onClick={() => setEditorOpen(false)}>
                Batal
              </Button>
              <Button onClick={() => void saveCourse()} disabled={saving || !name.trim()}>
                {saving ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan mata kuliah?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.name} akan hilang dari daftar aktif. Tugas dan resource yang terhubung tidak ikut dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (archiveTarget) void onArchive(archiveTarget.id);
                setArchiveTarget(null);
              }}
            >
              Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ─── Files ──────────────────────────────────────────────── */

export function FilesView({
  files,
  setFiles,
  query,
  courses,
  addActivity,
  onDelete,
  onRename,
}: {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  query: string;
  courses: { name: string }[];
  addActivity: (a: Activity) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [courseFilter, setCourseFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'updated'>('updated');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const visible = files
    .filter((f) => {
      const matchQ = f.name.toLowerCase().includes(query.toLowerCase());
      const matchC = courseFilter ? f.course === courseFilter : true;
      return matchQ && matchC;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') {
        const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ''));
        return parse(b.size) - parse(a.size);
      }
      return 0;
    });

  const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    const incoming = selected.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.name.split('.').at(-1)?.toUpperCase() || 'FILE',
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      course: courseFilter || 'Belum diatur',
      updated: 'Baru saja',
    }));
    setFiles((all) => [...incoming, ...all]);
    incoming.forEach((file) =>
      addActivity({
        id: crypto.randomUUID(),
        actor: 'Kamu',
        action: 'mengunggah file',
        resource: file.name,
        time: 'Baru saja',
        status: 'success',
        authorization: 'User action',
      }),
    );
    event.target.value = '';
  };

  const openContext = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const startRename = (file: FileItem) => {
    setContextMenu(null);
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const saveRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const folders = courses.map((c) => ({
    name: c.name,
    count: files.filter((f) => f.course === c.name).length,
  })).filter((f) => f.count > 0);

  return (
    <>
      <input ref={inputRef} className="sr-only" type="file" multiple onChange={upload} />
      {contextMenu && (
        <div className="modal-overlay transparent" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setContextMenu(null); }}>
          <div
            className="context-menu"
            style={{
              top: Math.max(12, Math.min(contextMenu.y, window.innerHeight - 210)),
              left: Math.max(12, Math.min(contextMenu.x, window.innerWidth - 190)),
            }}
          >
            <button onClick={() => { startRename(files.find((f) => f.id === contextMenu.id)!); }}>
              <Pencil size={14} /> Ganti nama
            </button>
            <button>
              <Files size={14} /> Pindah ke folder
            </button>
            <button>
              <Download size={14} /> Unduh
            </button>
            <button className="danger" onClick={() => { onDelete(contextMenu.id); setContextMenu(null); }}>
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      )}
      <section className="panel content-panel">
        <div className="content-toolbar">
          <div className="filter-row">
            <button className={!courseFilter ? 'active' : ''} onClick={() => setCourseFilter('')}>Semua file</button>
            {courses.slice(0, 3).map((c) => (
              <button
                key={c.name}
                className={courseFilter === c.name ? 'active' : ''}
                onClick={() => setCourseFilter(c.name)}
              >
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'updated')}
              aria-label="Urutkan"
            >
              <option value="updated">Urutkan: Terbaru</option>
              <option value="name">Urutkan: Nama</option>
              <option value="size">Urutkan: Ukuran</option>
            </select>
            <Button onClick={() => inputRef.current?.click()}>
              <Upload size={16} /> Upload
            </Button>
          </div>
        </div>
        {folders.length > 0 && !courseFilter && (
          <div className="folder-row">
            {folders.map((f) => (
              <button type="button" key={f.name} onClick={() => setCourseFilter(f.name)}>
                <Folder />
                <strong>{f.name}</strong>
                <small>{f.count} item</small>
              </button>
            ))}
          </div>
        )}
        <div className="file-table">
          <div className="file-table-head">
            <span>Nama</span>
            <span>Mata kuliah</span>
            <span>Ukuran</span>
            <span>Diubah</span>
            <span />
          </div>
          {visible.map((file) => (
            <div className="file-table-row" key={file.id}>
              <span className={`doc-icon ${file.type.toLowerCase()}`}>
                {file.type === 'XLSX' ? <FileSpreadsheet /> : <File />}
              </span>
              <span>
                {renamingId === file.id ? (
                  <input
                    className="task-inline-edit"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                  />
                ) : (
                  <strong>{file.name}</strong>
                )}
                <small>{file.type}{file.starred ? ' · ⭐' : ''}{file.shared ? ' · Dibagikan' : ''}</small>
              </span>
              <span>{file.course}</span>
              <span>{file.size}</span>
              <span>{file.updated}</span>
              <button
                aria-label={`Menu ${file.name}`}
                onClick={(e) => openContext(e, file.id)}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
          {visible.length === 0 && (
            <EmptyState
              icon={Files}
              title="Tidak ada file"
              text={query ? 'Tidak ada file yang cocok dengan pencarian.' : 'Upload file pertamamu.'}
              action={
                <Button size="sm" onClick={() => inputRef.current?.click()}>
                  <Upload size={14} /> Upload
                </Button>
              }
            />
          )}
        </div>
      </section>
    </>
  );
}

/* ─── Notes ──────────────────────────────────────────────── */

export function NotesView({
  notes,
  setNotes,
  onAdd,
  onDelete,
}: {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  onAdd: () => Note;
  onDelete: (id: string) => void;
}) {
  const [selected, setSelected] = useState(notes[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase()) ||
      n.course.toLowerCase().includes(search.toLowerCase()),
  );

  const note = notes.find((item) => item.id === selected) || notes[0];

  const update = (change: Partial<Note>) =>
    setNotes((all) =>
      all.map((item) =>
        item.id === selected
          ? { ...item, ...change, updated: 'Baru saja' }
          : item,
      ),
    );

  const create = () => {
    const fresh = onAdd();
    setSelected(fresh.id);
  };

  const handleDelete = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    onDelete(id);
    setSelected(remaining[0]?.id ?? '');
  };

  const formatSelection = (tag: 'strong' | 'em' | 'h2' | 'blockquote' | 'code' | 'ul' | 'ol') => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    const element = document.createElement(tag);
    if (tag === 'ul' || tag === 'ol') {
      const item = document.createElement('li');
      item.appendChild(range.extractContents());
      element.appendChild(item);
    } else {
      element.appendChild(range.extractContents());
    }
    range.insertNode(element);
    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(element);
    selection.addRange(nextRange);
    update({ body: editor.innerHTML });
  };

  return (
    <div className="notes-layout">
      <aside className="panel note-list">
        <div className="note-list-head">
          <strong>Catatan</strong>
          <button onClick={create} aria-label="Catatan baru">
            <Plus size={18} />
          </button>
        </div>
        <div className="note-search">
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari catatan..."
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Hapus pencarian">
              <X size={14} />
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <p className="note-empty">Tidak ada catatan ditemukan.</p>
        ) : (
          filtered.map((item) => (
            <button
              className={selected === item.id ? 'active' : ''}
              onClick={() => setSelected(item.id)}
              key={item.id}
            >
              <strong>{item.title}</strong>
              <span>{item.course}</span>
              <small>{item.updated}</small>
            </button>
          ))
        )}
      </aside>
      {note ? (
        <section className="panel note-editor">
          <div className="editor-toolbar">
            <div>
              <button onClick={() => formatSelection('strong')} title="Tebal" aria-label="Tebal">
                <strong>B</strong>
              </button>
              <button onClick={() => formatSelection('em')} title="Miring" aria-label="Miring">
                <em>I</em>
              </button>
              <button onClick={() => formatSelection('h2')} title="Heading 2" aria-label="Heading 2">H2</button>
              <button onClick={() => formatSelection('ul')} title="Daftar bullet" aria-label="Daftar bullet">• List</button>
              <button onClick={() => formatSelection('ol')} title="Daftar angka" aria-label="Daftar angka">1. List</button>
              <button onClick={() => formatSelection('blockquote')} title="Kutipan" aria-label="Kutipan">❞</button>
              <button onClick={() => formatSelection('code')} title="Kode" aria-label="Kode">{'</>'}</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Tersimpan otomatis</span>
              <button
                className="note-delete-btn"
                onClick={() => handleDelete(note.id)}
                aria-label="Hapus catatan"
                title="Hapus catatan"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <input
            className="note-title"
            value={note.title}
            onChange={(event) => update({ title: event.target.value })}
            placeholder="Judul catatan"
          />
          <div className="note-course-row">
            <select
              className="note-course-select"
              value={note.course}
              onChange={(e) => update({ course: e.target.value })}
              aria-label="Pilih mata kuliah"
            >
              <option>Statistika II</option>
              <option>Manajemen Operasi</option>
              <option>Pemrograman Web</option>
              <option>Metode Penelitian</option>
              <option>Tanpa mata kuliah</option>
            </select>
          </div>
          <div
            key={note.id}
            ref={editorRef}
            className="note-editor-rich"
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: note.body }}
            onInput={(event) => update({ body: event.currentTarget.innerHTML })}
            aria-label="Isi catatan"
            data-placeholder="Mulai menulis…"
          />
        </section>
      ) : (
        <section className="panel note-editor">
          <EmptyState
            icon={FileText}
            title="Belum ada catatan"
            text="Buat catatan pertamamu."
            action={<Button size="sm" onClick={create}><Plus size={14} /> Catatan baru</Button>}
          />
        </section>
      )}
    </div>
  );
}

/* ─── Canvas ─────────────────────────────────────────────── */

export function CanvasView() {
  return (
    <section className="canvas-view">
      <div className="canvas-meta panel">
        <div>
          <span className="section-kicker">STATISTIKA II</span>
          <h2>Catatan kelas — Regresi</h2>
          <p>Terakhir disimpan baru saja</p>
        </div>
        <div>
          <Button variant="outline">
            <Download size={16} /> Ekspor
          </Button>
          <Button variant="outline">
            <Sparkles size={16} /> Baca dengan AI
          </Button>
        </div>
      </div>
      <CanvasBoard />
    </section>
  );
}

/* ─── AI ─────────────────────────────────────────────────── */

const SUGGESTED_PROMPTS = [
  'Apa yang harus aku kerjakan minggu ini?',
  'Ringkas tugas Statistika II.',
  'Cari waktu terbaik untuk mengerjakan proposal.',
  'Rapikan file-file saya.',
];

const STEP_LABELS: Record<string, string> = {
  searching: '🔎 Mencari resource yang dapat kamu akses...',
  reading: '📄 Membaca bagian yang relevan...',
  analyzing: '🧠 Menganalisis konteks...',
  generating: '✨ Menyusun jawaban...',
};

export function AIView({
  tasks,
  notes,
  files,
  addActivity,
}: {
  tasks: Task[];
  notes: Note[];
  files: FileItem[];
  addActivity: (a: Activity) => void;
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Halo! Mode demo siap membantu menjelajahi jadwal, tugas, file, dan catatan di workspace ini.',
    },
  ]);
  const [input, setInput] = useState('');
  const [approval, setApproval] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState('');
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSteps = (steps: string[], onDone: () => void) => {
    let i = 0;
    const next = () => {
      if (i >= steps.length) { onDone(); return; }
      setStep(steps[i]);
      i++;
      stepTimerRef.current = setTimeout(next, 600);
    };
    next();
  };

  const cancel = () => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    setRunning(false);
    setStep('');
  };

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages((all) => [...all, { role: 'user', text: msg }]);
    setInput('');
    setRunning(true);
    runSteps(['searching', 'reading', 'analyzing', 'generating'], () => {
      setRunning(false);
      setStep('');
      if (/pindah|rapikan|buat|jadwal/i.test(msg)) {
        setApproval(true);
      } else {
        const activeTask = tasks.find((t) => t.status !== 'done');
        setMessages((all) => [
          ...all,
          {
            role: 'assistant',
            text: `Berdasarkan kalender dan ${tasks.length} tugas, prioritas terdekatmu adalah "${activeTask?.title ?? 'belum ada'}". Aku menemukan ${Math.min(files.length, 3)} sumber terkait di workspace ini.`,
          },
        ]);
      }
    });
  };

  const approve = (mode: string) => {
    setApproval(false);
    setMessages((all) => [
      ...all,
      {
        role: 'assistant',
        text: `Selesai. 3 file Statistika II sudah dipindahkan ke folder Materi. Action ini tercatat di History. Izin: ${mode}.`,
      },
    ]);
    addActivity({
      id: crypto.randomUUID(),
      actor: 'Gemini',
      action: 'memindahkan 3 file',
      resource: 'Statistika II / Materi',
      time: 'Baru saja',
      status: 'success',
      authorization: mode,
    });
  };

  return (
    <div className="ai-layout">
      <aside className="panel ai-context">
        <span className="section-kicker">KONTEKS AKTIF</span>
        <h3>Personal workspace</h3>
        <div className="context-item">
          <CheckCircle2 size={17} />
          <span>
            Kalender<small>7 event pekan ini</small>
          </span>
        </div>
        <div className="context-item">
          <CheckCircle2 size={17} />
          <span>
            Tugas<small>{tasks.length} task ditemukan</small>
          </span>
        </div>
        <div className="context-item">
          <CheckCircle2 size={17} />
          <span>
            File<small>{files.length} file contoh tersedia</small>
          </span>
        </div>
        <div className="context-item">
          <CheckCircle2 size={17} />
          <span>
            Catatan<small>{notes.length} catatan tersedia</small>
          </span>
        </div>
        <div className="privacy-note">
          <ShieldCheck size={18} />
          <p>
            AI tidak dapat melewati izin workspace atau melakukan perubahan
            tanpa persetujuanmu.
          </p>
        </div>
      </aside>
      <section className="panel ai-chat">
        <div className="chat-head">
          <div className="ai-orb">
            <Sparkles size={19} />
          </div>
          <div>
            <strong>MakeItOrganize AI</strong>
            <small>Demo lokal · Context-aware</small>
          </div>
          <span className="online-dot">Siap</span>
        </div>
        <div className="messages">
          {messages.map((message, index) => (
            <div className={`message ${message.role}`} key={index}>
              {message.text}
              {message.role === 'assistant' && index > 0 && (
                <div className="sources">
                  <span>
                    <FileText size={13} /> Modul Regresi.pdf
                  </span>
                  <span>
                    <CalendarDays size={13} /> Kalender
                  </span>
                </div>
              )}
            </div>
          ))}
          {running && (
            <div className="ai-progress">
              <Sparkles size={16} />
              <span>{STEP_LABELS[step] || 'Memproses...'}</span>
              <button className="cancel-btn" onClick={cancel} aria-label="Batalkan">
                <X size={14} />
              </button>
            </div>
          )}
          {approval && (
            <div className="approval-card">
              <header>
                <LockKeyhole size={19} />
                <div>
                  <strong>Izin diperlukan</strong>
                  <small>Gemini ingin memindahkan file</small>
                </div>
              </header>
              <div className="approval-diff">
                <span>
                  Dari <strong>Downloads</strong>
                </span>
                <ChevronRight size={15} />
                <span>
                  Ke <strong>Statistika II / Materi</strong>
                </span>
              </div>
              <p>3 file · dapat dibatalkan dari History</p>
              <footer>
                <Button variant="ghost" onClick={() => setApproval(false)}>
                  Tolak
                </Button>
                <Button variant="outline" onClick={() => approve('Allow once')}>
                  Izinkan sekali
                </Button>
                <Button onClick={() => approve('Allow conversation')}>
                  Izinkan percakapan
                </Button>
              </footer>
            </div>
          )}
        </div>
        {!running && messages.length === 1 && (
          <div className="suggested-prompts">
            {SUGGESTED_PROMPTS.map((p) => (
              <button key={p} className="prompt-chip" onClick={() => send(p)}>
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="chat-compose">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Tanyakan jadwal, materi, atau minta AI mengorganisir..."
          />
          <div>
            <span>AI dapat membuat kesalahan. Periksa informasi penting.</span>
            <Button onClick={() => send()} disabled={!input.trim() || running}>
              Kirim
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── History ────────────────────────────────────────────── */

export function HistoryView({ activities }: { activities: Activity[] }) {
  const [filter, setFilter] = useState('Semua aktivitas');
  const [search, setSearch] = useState('');

  const visible = activities.filter((item) => {
    const matchSearch =
      item.resource.toLowerCase().includes(search.toLowerCase()) ||
      item.action.toLowerCase().includes(search.toLowerCase()) ||
      item.actor.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'AI' ? item.actor === 'Gemini' :
      filter === 'File' ? item.action.includes('file') :
      filter === 'Task' ? item.action.includes('task') :
      true;
    return matchSearch && matchFilter;
  });

  return (
    <section className="panel content-panel">
      <div className="content-toolbar">
        <div className="filter-row">
          {['Semua aktivitas', 'AI', 'File', 'Task'].map((item) => (
            <button
              className={filter === item ? 'active' : ''}
              onClick={() => setFilter(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <label className="search-inline">
            <Search size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari history..."
            />
          </label>
          <Button variant="outline">
            <Download size={16} /> Ekspor
          </Button>
        </div>
      </div>
      <div className="activity-list">
        {visible.length === 0 ? (
          <EmptyState icon={History} title="Tidak ada aktivitas" text="Belum ada aktivitas yang sesuai." />
        ) : (
          visible.map((item) => (
            <div className="activity-row" key={item.id}>
              <span className={`activity-icon ${item.actor === 'Gemini' ? 'ai' : ''}`}>
                {item.actor === 'Gemini' ? (
                  <Sparkles />
                ) : item.actor === 'Google Calendar' ? (
                  <CalendarDays />
                ) : (
                  <UserRound />
                )}
              </span>
              <div>
                <p>
                  <strong>{item.actor}</strong> {item.action}
                </p>
                <span>{item.resource}</span>
                <small>
                  {item.time} · Authorized: {item.authorization ?? 'User action'}
                </small>
              </div>
              <span className={`status-pill ${item.status}`}>
                {item.status === 'success' ? 'Berhasil' : item.status === 'failed' ? 'Gagal' : 'Menunggu'}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// Fixes undefined History icon for empty state
const History = FileText;

/* ─── Notifications ──────────────────────────────────────── */

export function NotificationsView({
  onUnreadChange,
  initialRead = [],
}: {
  onUnreadChange: (count: number) => void;
  initialRead?: number[];
}) {
  const [read, setRead] = useState<number[]>(initialRead);
  const [filter, setFilter] = useState('Semua');
  const items = [
    {
      id: 1,
      title: 'Tugas Statistika II deadline malam ini',
      text: 'Selesaikan analisis regresi sebelum 21.00.',
      time: '12 menit lalu',
      type: 'task',
    },
    {
      id: 2,
      title: 'Kelas dimulai 30 menit lagi',
      text: 'Manajemen Operasi · Google Meet',
      time: '1 jam lalu',
      type: 'calendar',
    },
    {
      id: 3,
      title: 'Ringkasan mingguan siap',
      text: '5 task selesai dan 3 materi baru minggu ini.',
      time: 'Kemarin',
      type: 'ai',
    },
  ];

  const visible = items.filter((item) =>
    filter === 'Task' ? item.type === 'task' :
    filter === 'Kalender' ? item.type === 'calendar' :
    filter === 'AI' ? item.type === 'ai' :
    true,
  );

  const updateRead = (next: number[]) => {
    setRead(next);
    localStorage.setItem('mio-read-notifications', JSON.stringify(next));
    onUnreadChange(Math.max(0, items.length - next.length));
    void import('../app/actions/preferences').then(({ markNotificationsReadAction }) =>
      markNotificationsReadAction(next),
    );
  };

  return (
    <section className="panel content-panel">
      <div className="content-toolbar">
        <div className="filter-row">
          {['Semua', 'Task', 'Kalender', 'AI'].map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="toolbar-right">
          <strong style={{ fontSize: 13 }}>{items.length - read.length} belum dibaca</strong>
          <button
            className="text-action"
            onClick={() => updateRead(items.map((item) => item.id))}
          >
            Tandai semua dibaca
          </button>
        </div>
      </div>
      <div className="notification-list">
        {visible.map((item) => (
          <button
            className={read.includes(item.id) ? 'read' : ''}
            key={item.id}
            onClick={() => updateRead(Array.from(new Set([...read, item.id])))}
          >
            <span className={`notification-icon ${item.type}`}>
              {item.type === 'task' ? (
                <CheckSquare2 />
              ) : item.type === 'calendar' ? (
                <CalendarDays />
              ) : (
                <Sparkles />
              )}
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
              <em>{item.time}</em>
            </span>
            {!read.includes(item.id) && <i />}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── Settings ───────────────────────────────────────────── */

export function SettingsView({
  dark,
  setDark,
  user,
  initialPreferences,
  googleConnection,
}: {
  dark: boolean;
  setDark: (value: boolean) => void;
  user?: { name: string; email: string };
  initialPreferences?: {
    browserNotifications: boolean;
    emailNotifications: boolean;
    weeklySummary: boolean;
    aiRead: boolean;
    aiMove: boolean;
    aiCreate: boolean;
  };
  googleConnection?: {
    connected: boolean;
    accountEmail?: string;
    grantedScopes: string[];
    status?: 'active' | 'reauth_required' | 'revoked' | 'error';
    calendarEnabled: boolean;
    lastSyncedAt?: string;
  };
}) {
  const [activeSection, setActiveSection] = useState('akun');
  const [googleNotice, setGoogleNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('google');
    const messages: Record<string, { tone: 'success' | 'error'; text: string }> = {
      connected: { tone: 'success', text: 'Akun Google berhasil dihubungkan.' },
      calendar_connected: { tone: 'success', text: 'Izin Google Calendar berhasil diaktifkan.' },
      cancelled: { tone: 'error', text: 'Proses menghubungkan Google dibatalkan.' },
      invalid_state: { tone: 'error', text: 'Sesi OAuth tidak valid atau sudah kedaluwarsa.' },
      unavailable: { tone: 'error', text: 'Google OAuth belum dikonfigurasi pada environment ini.' },
      failed: { tone: 'error', text: 'Akun Google belum dapat dihubungkan. Silakan coba lagi.' },
    };
    if (!status || !messages[status]) return;
    const timer = window.setTimeout(() => setGoogleNotice(messages[status]), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const persistedSetter = (key: string, setter: (value: boolean) => void) => (value: boolean) => {
    window.localStorage.setItem(`mio-setting-${key}`, String(value));
    setter(value);
    const serverKeys = {
      browser: 'browserNotifications',
      email: 'emailNotifications',
      weekly: 'weeklySummary',
      'ai-read': 'aiRead',
      'ai-move': 'aiMove',
      'ai-create': 'aiCreate',
    } as const;
    const serverKey = serverKeys[key as keyof typeof serverKeys];
    if (serverKey) {
      void import('../app/actions/preferences').then(({ updatePreferenceAction }) =>
        updatePreferenceAction(serverKey, value),
      );
    }
  };
  const [browser, setBrowser] = useState(initialPreferences?.browserNotifications ?? false);
  const [email, setEmailNotif] = useState(initialPreferences?.emailNotifications ?? false);
  const [weekly, setWeekly] = useState(initialPreferences?.weeklySummary ?? false);
  const [aiMove, setAiMove] = useState(initialPreferences?.aiMove ?? true);
  const [aiRead, setAiRead] = useState(initialPreferences?.aiRead ?? true);
  const [aiCreate, setAiCreate] = useState(initialPreferences?.aiCreate ?? false);

  const sections = [
    { id: 'akun', label: 'Akun', icon: UserRound },
    { id: 'workspace', label: 'Workspace', icon: Users },
    { id: 'ai', label: 'Izin AI', icon: ShieldCheck },
    { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
    { id: 'tampilan', label: 'Tampilan', icon: Palette },
  ];

  const aiPermissions = [
    { id: 'read', label: 'Baca file & catatan', text: 'AI membaca konten yang kamu izinkan untuk menjawab pertanyaan.', checked: aiRead, onChange: persistedSetter('ai-read', setAiRead) },
    { id: 'move', label: 'Pindahkan & rapikan file', text: 'Tetap meminta izin untuk tindakan bulk atau sensitif.', checked: aiMove, onChange: persistedSetter('ai-move', setAiMove) },
    { id: 'create', label: 'Buat task & event', text: 'AI dapat membuat task/event atas namamu dengan konfirmasimu.', checked: aiCreate, onChange: persistedSetter('ai-create', setAiCreate) },
  ];

  const members = [
    {
      name: user?.name || 'User',
      email: user?.email || 'Belum ada email',
      role: 'Owner',
      initials: (user?.name || 'User')
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase(),
    },
  ];

  return (
    <div className="settings-layout">
      <aside className="panel settings-menu">
        {sections.map((s) => (
          <button
            key={s.id}
            className={activeSection === s.id ? 'active' : ''}
            onClick={() => setActiveSection(s.id)}
          >
            <s.icon size={17} /> {s.label}
          </button>
        ))}
      </aside>
      <div className="settings-sections">
        {activeSection === 'akun' && (
          <>
            <section className="panel settings-card">
              <div className="account-summary">
                <span className="avatar large">
                  {(user?.name || 'User')
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{user?.name || 'User'}</strong>
                  <small>{user?.email || 'Belum ada email'}</small>
                </div>
                <Button variant="outline">Edit profil</Button>
              </div>
            </section>
            <section className="panel settings-card">
              <span className="section-kicker">INTEGRASI</span>
              <h2>Layanan terhubung</h2>
              {googleNotice && (
                <output className={`integration-notice ${googleNotice.tone}`}>
                  {googleNotice.text}
                </output>
              )}
              <div className="google-connection-row">
                <span className="google-connection-icon"><Cloud size={19} /></span>
                <div>
                  <strong>Akun Google</strong>
                  <small>
                    {googleConnection?.connected
                      ? `${googleConnection.accountEmail ?? 'Akun terhubung'} · OAuth aktif`
                      : googleConnection?.status === 'reauth_required'
                        ? 'Sesi Google perlu dihubungkan ulang.'
                        : 'Hubungkan identitas Google sebelum mengaktifkan Calendar, Tasks, atau Drive.'}
                  </small>
                </div>
                <button
                  type="button"
                  className={`integration-action ${googleConnection?.connected ? 'connected' : ''}`}
                  onClick={() => window.location.assign('/api/integrations/google/connect?returnTo=/?view=settings')}
                >
                  {googleConnection?.connected ? 'Hubungkan ulang' : 'Hubungkan Google'}
                </button>
              </div>
              <div className="integration-roadmap" aria-label="Status modul integrasi Google">
                <span className={googleConnection?.connected ? 'ready' : ''}>OAuth</span>
                <span className={googleConnection?.calendarEnabled ? 'ready' : ''}>
                  {googleConnection?.calendarEnabled ? 'Calendar aktif' : 'Calendar berikutnya'}
                </span>
                <span>Tasks berikutnya</span>
                <span>Drive berikutnya</span>
              </div>
              {googleConnection?.connected && !googleConnection.calendarEnabled && (
                <button
                  type="button"
                  className="integration-action calendar-consent-action"
                  onClick={() => window.location.assign('/api/integrations/google/connect?feature=calendar&returnTo=/?view=settings')}
                >
                  Aktifkan Google Calendar
                </button>
              )}
            </section>
            <section className="panel settings-card">
              <span className="section-kicker">KEAMANAN</span>
              <h2>Sesi aktif</h2>
              <div className="session-row">
                <div>
                  <strong>Sesi ini</strong>
                  <small>Aktif sekarang</small>
                </div>
                <button 
                  className="text-action danger"
                  onClick={async () => {
                    const { logoutAction } = await import('../app/(auth)/actions');
                    await logoutAction();
                  }}
                >
                  Keluar
                </button>
              </div>
            </section>
          </>
        )}
        {activeSection === 'workspace' && (
          <section className="panel settings-card">
            <span className="section-kicker">PERSONAL WORKSPACE</span>
            <h2>Anggota workspace</h2>
            <div className="member-list">
              {members.map((m) => (
                <div key={m.email} className="member-row">
                  <span className="avatar">{m.initials}</span>
                  <div>
                    <strong>{m.name}</strong>
                    <small>{m.email}</small>
                  </div>
                  <span className="role-badge">{m.role}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" style={{ marginTop: 14 }}>
              <Plus size={15} /> Undang anggota
            </Button>
          </section>
        )}
        {activeSection === 'ai' && (
          <section className="panel settings-card">
            <span className="section-kicker">AI PERMISSIONS</span>
            <h2>Kontrol tindakan AI</h2>
            <p className="settings-desc">
              AI hanya dapat melakukan tindakan yang kamu izinkan. Perubahan pada permission ini berlaku mulai percakapan berikutnya.
            </p>
            {aiPermissions.map((p) => (
              <SettingRow
                key={p.id}
                icon={ShieldCheck}
                title={p.label}
                text={p.text}
                checked={p.checked}
                onChange={p.onChange}
              />
            ))}
          </section>
        )}
        {activeSection === 'notifikasi' && (
          <section className="panel settings-card">
            <span className="section-kicker">PREFERENSI</span>
            <h2>Notifikasi &amp; pengingat</h2>
            <SettingRow
              icon={Bell}
              title="Notifikasi browser"
              text="Deadline, kelas, dan reminder penting."
              checked={browser}
              onChange={persistedSetter('browser', setBrowser)}
            />
            <SettingRow
              icon={MessageSquareText}
              title="Notifikasi email"
              text="Pengingat dikirim ke email terdaftar."
              checked={email}
              onChange={persistedSetter('email', setEmailNotif)}
            />
            <SettingRow
              icon={Sparkles}
              title="Ringkasan mingguan"
              text="Dikirim Senin pagi jika ada hal actionable."
              checked={weekly}
              onChange={persistedSetter('weekly', setWeekly)}
            />
          </section>
        )}
        {activeSection === 'tampilan' && (
          <section className="panel settings-card">
            <span className="section-kicker">TEMA</span>
            <h2>Tampilan &amp; tema</h2>
            <SettingRow
              icon={dark ? Sun : Moon}
              title="Mode gelap"
              text="Gunakan theme gelap yang dirancang khusus."
              checked={dark}
              onChange={setDark}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  text,
  checked,
  onChange,
  disabled = false,
}: {
  icon: typeof Cloud;
  title: string;
  text: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="setting-row">
      <span>
        <Icon size={18} />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
