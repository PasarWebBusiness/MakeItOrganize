import type { CalendarProvider } from '@/lib/integration-providers';
import { ProviderError } from '@/lib/integration-providers';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export type GoogleCalendarEventPayload = {
  id?: string;
  etag?: string;
  status?: string;
  summary?: string;
  recurrence?: string[];
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
};

type GoogleCalendarListResponse = {
  items?: GoogleCalendarEventPayload[];
  nextPageToken?: string;
  nextSyncToken?: string;
};

function calendarError(status: number): ProviderError {
  if (status === 401) return new ProviderError('unauthorized', 'Koneksi Google tidak lagi valid', false);
  if (status === 403) return new ProviderError('scope_missing', 'Izin Google Calendar tidak tersedia', false);
  if (status === 410) return new ProviderError('invalid_cursor', 'Cursor Google Calendar sudah kedaluwarsa', false);
  if (status === 429) return new ProviderError('rate_limited', 'Batas Google Calendar tercapai', true);
  if (status >= 500) return new ProviderError('temporarily_unavailable', 'Google Calendar sementara tidak tersedia', true);
  return new ProviderError('invalid_request', 'Permintaan Google Calendar ditolak', false);
}

export class GoogleCalendarProvider implements CalendarProvider {
  async listChanges(input: Parameters<CalendarProvider['listChanges']>[0]) {
    if (input.syncToken && input.timeMin) {
      throw new ProviderError('invalid_request', 'syncToken tidak dapat digabung dengan timeMin', false);
    }
    const url = new URL(`${CALENDAR_API}/calendars/primary/events`);
    url.searchParams.set('maxResults', '250');
    url.searchParams.set('showDeleted', 'true');
    if (input.syncToken) url.searchParams.set('syncToken', input.syncToken);
    if (input.pageToken) url.searchParams.set('pageToken', input.pageToken);
    if (input.timeMin) url.searchParams.set('timeMin', input.timeMin);

    const response = await fetch(url, {
      headers: { authorization: `Bearer ${input.accessToken}`, accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw calendarError(response.status);
    const body = (await response.json()) as GoogleCalendarListResponse;
    const events = (body.items ?? [])
      .filter((event): event is GoogleCalendarEventPayload & { id: string } => typeof event.id === 'string' && event.id.length > 0)
      .map((event) => ({
        externalId: event.id,
        etag: event.etag,
        deleted: event.status === 'cancelled',
        payload: event,
      }));
    return {
      events,
      nextPageToken: body.nextPageToken,
      nextSyncToken: body.nextSyncToken,
    };
  }

  async upsertEvent(): Promise<{ externalId: string; etag?: string }> {
    throw new ProviderError('invalid_request', 'Sinkronisasi keluar belum diaktifkan', false);
  }

  async deleteEvent(): Promise<void> {
    throw new ProviderError('invalid_request', 'Sinkronisasi keluar belum diaktifkan', false);
  }
}
