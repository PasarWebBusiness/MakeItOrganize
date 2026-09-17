import type { TasksProvider } from '@/lib/integration-providers';
import { ProviderError } from '@/lib/integration-providers';

const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';

export type GoogleTaskPayload = {
  id?: string;
  etag?: string;
  title?: string;
  notes?: string;
  status?: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  deleted?: boolean;
  hidden?: boolean;
  updated?: string;
};

type TaskListsResponse = {
  items?: Array<{ id?: string; title?: string }>;
  nextPageToken?: string;
};

type TasksResponse = {
  items?: GoogleTaskPayload[];
  nextPageToken?: string;
};

function tasksError(status: number): ProviderError {
  if (status === 401) return new ProviderError('unauthorized', 'Koneksi Google tidak lagi valid', false);
  if (status === 403) return new ProviderError('scope_missing', 'Izin Google Tasks tidak tersedia', false);
  if (status === 429) return new ProviderError('rate_limited', 'Batas Google Tasks tercapai', true);
  if (status >= 500) return new ProviderError('temporarily_unavailable', 'Google Tasks sementara tidak tersedia', true);
  return new ProviderError('invalid_request', 'Permintaan Google Tasks ditolak', false);
}

async function googleGet<T>(url: URL, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw tasksError(response.status);
  return response.json() as Promise<T>;
}

export class GoogleTasksProvider implements TasksProvider {
  async listTaskLists(input: Parameters<TasksProvider['listTaskLists']>[0]) {
    const url = new URL(`${TASKS_API}/users/@me/lists`);
    url.searchParams.set('maxResults', '1000');
    if (input.pageToken) url.searchParams.set('pageToken', input.pageToken);
    const body = await googleGet<TaskListsResponse>(url, input.accessToken);
    const taskLists = (body.items ?? []).filter(
      (item): item is { id: string; title: string } =>
        typeof item.id === 'string' && item.id.length > 0 && typeof item.title === 'string',
    );
    return { taskLists, nextPageToken: body.nextPageToken };
  }

  async listTasks(input: Parameters<TasksProvider['listTasks']>[0]) {
    const url = new URL(`${TASKS_API}/lists/${encodeURIComponent(input.taskListId)}/tasks`);
    url.searchParams.set('maxResults', '100');
    url.searchParams.set('showCompleted', 'true');
    url.searchParams.set('showDeleted', 'true');
    url.searchParams.set('showHidden', 'true');
    if (input.pageToken) url.searchParams.set('pageToken', input.pageToken);
    const body = await googleGet<TasksResponse>(url, input.accessToken);
    return { tasks: body.items ?? [], nextPageToken: body.nextPageToken };
  }
}
