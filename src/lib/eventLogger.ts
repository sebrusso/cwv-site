import { postJsonWithRetry } from './api';

export async function logEvent(eventType: string, eventData?: unknown) {
  try {
    await postJsonWithRetry('/api/log-event', {
      eventType,
      eventData,
    });
  } catch (err) {
    console.error('Failed to log event', err);
  }
}
