import { apiRequest } from './client';

const SESSION_KEY = 'guddi-silai-analytics-session';

function sessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

export function trackEvent(input: { type: string; productId?: string; properties?: Record<string, unknown> }) {
  return apiRequest('/analytics/events', {
    method: 'POST',
    body: { ...input, sessionId: sessionId() },
  }).catch(() => undefined);
}
