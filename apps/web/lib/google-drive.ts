import type { DriveProvider } from '@/lib/integration-providers';
import { ProviderError } from '@/lib/integration-providers';
import type { DriveFileCandidate } from '@/lib/types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
const GOOGLE_FOLDER = 'application/vnd.google-apps.folder';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export type GoogleDriveFile = DriveFileCandidate & {
  md5Checksum?: string;
};

function driveError(status: number): ProviderError {
  if (status === 401) return new ProviderError('unauthorized', 'Koneksi Google tidak lagi valid', false);
  if (status === 403) return new ProviderError('scope_missing', 'Izin Google Drive tidak tersedia', false);
  if (status === 404) return new ProviderError('invalid_request', 'File Google Drive tidak ditemukan', false);
  if (status === 429) return new ProviderError('rate_limited', 'Batas Google Drive tercapai', true);
  if (status >= 500) return new ProviderError('temporarily_unavailable', 'Google Drive sementara tidak tersedia', true);
  return new ProviderError('invalid_request', 'Permintaan Google Drive ditolak', false);
}

async function driveFetch(url: URL, accessToken: string) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw driveError(response.status);
  return response;
}

function normalizeFile(file: GoogleDriveFile): DriveFileCandidate | undefined {
  if (!file.id || !file.name || !file.mimeType || file.mimeType === GOOGLE_FOLDER) return undefined;
  const size = typeof file.size === 'number' ? file.size : Number(file.size);
  const normalizedSize = Number.isSafeInteger(size) && size >= 0 ? size : undefined;
  return {
    id: file.id,
    name: file.name.slice(0, 240),
    mimeType: file.mimeType,
    size: normalizedSize,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
    canDownload: file.canDownload === true,
    supported: file.canDownload === true && ALLOWED_MIME_TYPES.has(file.mimeType) && normalizedSize !== undefined && normalizedSize <= MAX_IMPORT_BYTES,
  };
}

export class GoogleDriveProvider implements DriveProvider {
  async listFiles(input: Parameters<DriveProvider['listFiles']>[0]) {
    const url = new URL(`${DRIVE_API}/files`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('q', "trashed = false and mimeType != 'application/vnd.google-apps.folder'");
    url.searchParams.set('spaces', 'drive');
    url.searchParams.set('orderBy', 'modifiedTime desc');
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,md5Checksum,capabilities(canDownload))');
    if (input.pageToken) url.searchParams.set('pageToken', input.pageToken);
    const response = await driveFetch(url, input.accessToken);
    const body = (await response.json()) as { files?: Array<Omit<GoogleDriveFile, 'canDownload'> & { capabilities?: { canDownload?: boolean } }>; nextPageToken?: string };
    const files = (body.files ?? []).map((file) => normalizeFile({ ...file, canDownload: file.capabilities?.canDownload === true } as GoogleDriveFile)).filter((file): file is DriveFileCandidate => Boolean(file));
    return { files, nextPageToken: body.nextPageToken };
  }

  async getFile(input: Parameters<DriveProvider['getFile']>[0]) {
    const url = new URL(`${DRIVE_API}/files/${encodeURIComponent(input.fileId)}`);
    url.searchParams.set('fields', 'id,name,mimeType,size,modifiedTime,webViewLink,md5Checksum,capabilities(canDownload)');
    const response = await driveFetch(url, input.accessToken);
    const file = (await response.json()) as Omit<GoogleDriveFile, 'canDownload'> & { capabilities?: { canDownload?: boolean } };
    const normalized = normalizeFile({ ...file, canDownload: file.capabilities?.canDownload === true } as GoogleDriveFile);
    if (!normalized) throw new ProviderError('invalid_request', 'Jenis file Google Drive tidak dapat diimpor', false);
    return { ...normalized, md5Checksum: file.md5Checksum } satisfies GoogleDriveFile;
  }

  async downloadFile(input: Parameters<DriveProvider['downloadFile']>[0]) {
    const url = new URL(`${DRIVE_API}/files/${encodeURIComponent(input.fileId)}`);
    url.searchParams.set('alt', 'media');
    return driveFetch(url, input.accessToken);
  }
}

export function validateDriveImport(file: DriveFileCandidate) {
  if (!file.canDownload) throw new ProviderError('invalid_request', 'File ini tidak mengizinkan download', false);
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) throw new ProviderError('invalid_request', 'Format file belum didukung untuk impor', false);
  if (file.size === undefined) throw new ProviderError('invalid_request', 'Ukuran file tidak tersedia sehingga impor tidak dapat diverifikasi', false);
  if (file.size !== undefined && file.size > MAX_IMPORT_BYTES) throw new ProviderError('invalid_request', 'Ukuran file maksimal 25 MB', false);
}

export { MAX_IMPORT_BYTES };
