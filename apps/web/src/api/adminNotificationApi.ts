import { apiRequestAuth } from './admin';
import { NotificationItem } from './notificationApi';

export async function getAdminNotifications() {
  return apiRequestAuth<{ data: NotificationItem[] }>('/admin/notifications');
}

export async function markAdminNotificationRead(id: string) {
  return apiRequestAuth<{ data: NotificationItem }>(`/admin/notifications/${id}/read`, {
    method: 'PATCH',
  });
}