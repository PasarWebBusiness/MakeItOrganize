'use server';

import { env } from 'cloudflare:workers';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/db';
import {
  auditEvents,
  courses,
  resourceVersions,
  resources,
} from '@/db/schema';
import { requireDefaultWorkspace } from '@/lib/authorization';
import { getGoogleDriveAccessToken } from '@/lib/google-identity';
import { GoogleDriveProvider, MAX_IMPORT_BYTES, validateDriveImport, type GoogleDriveFile } from '@/lib/google-drive';
import type { DriveFileCandidate } from '@/lib/types';

function cleanText(value: string, label: string, limit: number) {
  const result = value.trim();
  if (!result) throw new Error(`${label} wajib diisi`);
  if (result.length > limit) throw new Error(`${label} maksimal ${limit} karakter`);
  return result;
}

async function courseIdFor(workspaceId: string, courseName?: string) {
  if (!courseName || courseName === 'Tanpa mata kuliah' || courseName === 'Belum diatur') return null;
  const [course] = await getDb()
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.workspaceId, workspaceId), eq(courses.name, courseName), isNull(courses.deletedAt)))
    .limit(1);
  return course?.id ?? null;
}

async function audit(workspaceId: string, actorId: string, action: string, targetType: string, targetId: string, name: string) {
  await getDb().insert(auditEvents).values({
    id: crypto.randomUUID(),
    workspaceId,
    actorType: 'user',
    actorId,
    action,
    targetType,
    targetId,
    outcome: 'success',
    authorization: 'User action',
    redactedDiff: JSON.stringify({ name }),
    correlationId: crypto.randomUUID(),
    createdAt: new Date(),
  });
}

export async function recordActivityAction(data: { action: string; resource: string; status: 'success' | 'pending' | 'failed'; authorization?: string }) {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  await getDb().insert(auditEvents).values({
    id: crypto.randomUUID(), workspaceId, actorType: 'user', actorId: user.id,
    action: cleanText(data.action, 'Aktivitas', 160), targetType: 'workspace', targetId: workspaceId,
    outcome: data.status, authorization: data.authorization || 'User action',
    redactedDiff: JSON.stringify({ name: data.resource.slice(0, 240) }), correlationId: crypto.randomUUID(), createdAt: new Date(),
  });
}

export async function fetchWorkspaceResources() {
  const { workspaceId } = await requireDefaultWorkspace('read');
  return getDb()
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      mediaType: resources.mediaType,
      byteSize: resources.byteSize,
      courseName: courses.name,
      content: resourceVersions.content,
      updatedAt: resources.updatedAt,
    })
    .from(resources)
    .leftJoin(courses, eq(resources.courseId, courses.id))
    .leftJoin(resourceVersions, and(eq(resourceVersions.resourceId, resources.id), eq(resourceVersions.version, 1)))
    .where(and(eq(resources.workspaceId, workspaceId), isNull(resources.deletedAt)))
    .orderBy(desc(resources.updatedAt));
}

export async function fetchWorkspaceActivities() {
  const { workspaceId } = await requireDefaultWorkspace('read');
  return getDb()
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.workspaceId, workspaceId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(200);
}

export async function createNoteAction(data: { title: string; courseName?: string; body?: string }) {
  const { user, workspaceId } = await requireDefaultWorkspace('create');
  const id = crypto.randomUUID();
  const title = cleanText(data.title, 'Judul catatan', 200);
  const db = getDb();
  await db.insert(resources).values({
    id,
    workspaceId,
    courseId: await courseIdFor(workspaceId, data.courseName),
    ownerId: user.id,
    type: 'note',
    name: title,
    mediaType: 'text/html',
    state: 'ready',
  });
  await db.insert(resourceVersions).values({
    id: crypto.randomUUID(),
    resourceId: id,
    version: 1,
    content: data.body ?? '',
    createdBy: user.id,
    createdAt: new Date(),
  });
  await audit(workspaceId, user.id, 'membuat catatan', 'note', id, title);
  revalidatePath('/');
  return id;
}

export async function updateNoteAction(id: string, data: { title: string; courseName?: string; body: string }) {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  const title = cleanText(data.title, 'Judul catatan', 200);
  const db = getDb();
  await db.update(resources).set({
    name: title,
    courseId: await courseIdFor(workspaceId, data.courseName),
    updatedAt: new Date(),
  }).where(and(eq(resources.id, id), eq(resources.workspaceId, workspaceId), eq(resources.type, 'note'), isNull(resources.deletedAt)));
  await db.update(resourceVersions).set({ content: data.body }).where(and(eq(resourceVersions.resourceId, id), eq(resourceVersions.version, 1)));
  await audit(workspaceId, user.id, 'memperbarui catatan', 'note', id, title);
  revalidatePath('/');
}

export async function deleteNoteAction(id: string) {
  const { user, workspaceId } = await requireDefaultWorkspace('delete');
  const db = getDb();
  const [target] = await db.select({ name: resources.name }).from(resources).where(and(eq(resources.id, id), eq(resources.workspaceId, workspaceId), eq(resources.type, 'note'))).limit(1);
  await db.update(resources).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(resources.id, id), eq(resources.workspaceId, workspaceId), eq(resources.type, 'note')));
  await audit(workspaceId, user.id, 'menghapus catatan', 'note', id, target?.name ?? 'Catatan');
  revalidatePath('/');
}

export async function saveCanvasAction(data: { id?: string; title: string; courseName?: string; strokes: string }) {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  if (data.strokes.length > 2_000_000) throw new Error('Canvas terlalu besar untuk disimpan');
  const parsed: unknown = JSON.parse(data.strokes);
  if (!Array.isArray(parsed)) throw new Error('Data canvas tidak valid');
  const title = cleanText(data.title, 'Judul canvas', 200);
  const db = getDb();
  if (data.id) {
    await db.update(resources).set({ name: title, courseId: await courseIdFor(workspaceId, data.courseName), updatedAt: new Date() }).where(and(eq(resources.id, data.id), eq(resources.workspaceId, workspaceId), eq(resources.type, 'canvas'), isNull(resources.deletedAt)));
    await db.update(resourceVersions).set({ content: data.strokes }).where(and(eq(resourceVersions.resourceId, data.id), eq(resourceVersions.version, 1)));
    return data.id;
  }
  const id = crypto.randomUUID();
  await db.insert(resources).values({ id, workspaceId, courseId: await courseIdFor(workspaceId, data.courseName), ownerId: user.id, type: 'canvas', name: title, mediaType: 'application/json', state: 'ready' });
  await db.insert(resourceVersions).values({ id: crypto.randomUUID(), resourceId: id, version: 1, content: data.strokes, createdBy: user.id, createdAt: new Date() });
  await audit(workspaceId, user.id, 'membuat canvas', 'canvas', id, title);
  revalidatePath('/');
  return id;
}

export async function uploadFileAction(formData: FormData) {
  const { user, workspaceId } = await requireDefaultWorkspace('create');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) throw new Error('File wajib dipilih');
  if (file.size > 25 * 1024 * 1024) throw new Error('Ukuran file maksimal 25 MB');
  const name = cleanText(file.name, 'Nama file', 240);
  const id = crypto.randomUUID();
  const storageKey = `${workspaceId}/resources/${id}/original`;
  await env.FILES.put(storageKey, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  const db = getDb();
  await db.insert(resources).values({
    id,
    workspaceId,
    courseId: await courseIdFor(workspaceId, typeof formData.get('courseName') === 'string' ? formData.get('courseName') as string : ''),
    ownerId: user.id,
    type: 'file',
    name,
    mediaType: file.type || 'application/octet-stream',
    byteSize: file.size,
    state: 'ready',
  });
  await db.insert(resourceVersions).values({ id: crypto.randomUUID(), resourceId: id, version: 1, storageKey, createdBy: user.id, createdAt: new Date() });
  await audit(workspaceId, user.id, 'mengunggah file', 'file', id, name);
  revalidatePath('/');
  return id;
}

export async function renameFileAction(id: string, rawName: string) {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  const name = cleanText(rawName, 'Nama file', 240);
  await getDb().update(resources).set({ name, updatedAt: new Date() }).where(and(eq(resources.id, id), eq(resources.workspaceId, workspaceId), eq(resources.type, 'file'), isNull(resources.deletedAt)));
  await audit(workspaceId, user.id, 'mengganti nama file', 'file', id, name);
  revalidatePath('/');
}

export async function deleteFileAction(id: string) {
  const { user, workspaceId } = await requireDefaultWorkspace('delete');
  const db = getDb();
  const [target] = await db.select({ name: resources.name }).from(resources).where(and(eq(resources.id, id), eq(resources.workspaceId, workspaceId), eq(resources.type, 'file'))).limit(1);
  await db.update(resources).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(resources.id, id), eq(resources.workspaceId, workspaceId), eq(resources.type, 'file')));
  await audit(workspaceId, user.id, 'menghapus file', 'file', id, target?.name ?? 'File');
  revalidatePath('/');
}

export async function listGoogleDriveFilesAction(pageToken?: string) {
  const { user, workspaceId } = await requireDefaultWorkspace('read');
  const { accessToken } = await getGoogleDriveAccessToken(user.id, workspaceId);
  const result = await new GoogleDriveProvider().listFiles({
    accessToken,
    pageToken: pageToken?.slice(0, 2_000) || undefined,
  });
  return {
    files: result.files as DriveFileCandidate[],
    nextPageToken: result.nextPageToken,
  };
}

function checksumHex(buffer: ArrayBuffer) {
  return crypto.subtle.digest('SHA-256', buffer).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(''),
  );
}

export async function importGoogleDriveFileAction(data: { fileId: string; courseName?: string }) {
  const { user, workspaceId } = await requireDefaultWorkspace('create');
  const fileId = cleanText(data.fileId, 'ID file Drive', 300);
  const { connection, accessToken } = await getGoogleDriveAccessToken(user.id, workspaceId);
  const provider = new GoogleDriveProvider();
  const metadata = await provider.getFile({ accessToken, fileId }) as GoogleDriveFile;
  validateDriveImport(metadata);

  const response = await provider.downloadFile({ accessToken, fileId });
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_IMPORT_BYTES) throw new Error('Ukuran file maksimal 25 MB');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMPORT_BYTES) throw new Error('Ukuran file maksimal 25 MB');
  const checksum = await checksumHex(buffer);
  const externalId = `${connection.id}:${fileId}`;
  const db = getDb();
  const [existing] = await db.select({ id: resources.id }).from(resources).where(and(
    eq(resources.workspaceId, workspaceId),
    eq(resources.externalProvider, 'google_drive'),
    eq(resources.externalId, externalId),
  )).limit(1);
  const resourceId = existing?.id ?? crypto.randomUUID();
  const [latest] = existing
    ? await db.select({ version: resourceVersions.version }).from(resourceVersions).where(eq(resourceVersions.resourceId, resourceId)).orderBy(desc(resourceVersions.version)).limit(1)
    : [];
  const version = (latest?.version ?? 0) + 1;
  const storageKey = `${workspaceId}/resources/${resourceId}/v${version}/${crypto.randomUUID()}`;
  await env.FILES.put(storageKey, buffer, { httpMetadata: { contentType: metadata.mimeType } });
  const now = new Date();

  if (existing) {
    await db.update(resources).set({
      name: metadata.name,
      courseId: await courseIdFor(workspaceId, data.courseName),
      mediaType: metadata.mimeType,
      byteSize: buffer.byteLength,
      state: 'ready',
      externalUrl: metadata.webViewLink || null,
      deletedAt: null,
      updatedAt: now,
    }).where(and(eq(resources.id, resourceId), eq(resources.workspaceId, workspaceId)));
  } else {
    await db.insert(resources).values({
      id: resourceId,
      workspaceId,
      courseId: await courseIdFor(workspaceId, data.courseName),
      ownerId: user.id,
      type: 'file',
      name: metadata.name,
      mediaType: metadata.mimeType,
      byteSize: buffer.byteLength,
      state: 'ready',
      externalProvider: 'google_drive',
      externalId,
      externalUrl: metadata.webViewLink || null,
    });
  }
  await db.insert(resourceVersions).values({
    id: crypto.randomUUID(), resourceId, version, storageKey, checksum,
    createdBy: user.id, createdAt: now,
  });
  await audit(workspaceId, user.id, existing ? 'mengimpor versi baru dari Google Drive' : 'mengimpor file dari Google Drive', 'file', resourceId, metadata.name);
  revalidatePath('/');
  return {
    id: resourceId,
    name: metadata.name,
    type: metadata.name.split('.').at(-1)?.toUpperCase() || 'FILE',
    size: `${Math.max(1, Math.round(buffer.byteLength / 1024))} KB`,
    course: data.courseName || 'Belum diatur',
    updated: 'Baru saja',
  };
}
