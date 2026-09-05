import { apiRequest } from './client';
import { ensureGuestToken } from './cartApi';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications() {
  const token = await ensureGuestToken();
  return apiRequest<{ data: NotificationItem[] }>('/notifications', { token });
}

export async function markNotificationRead(id: string) {
  const token = await ensureGuestToken();
  return apiRequest<{ data: NotificationItem }>(`/notifications/${id}/read`, { method: 'PATCH', token });
}
