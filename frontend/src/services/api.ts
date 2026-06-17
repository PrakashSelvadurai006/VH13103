import { NotificationFeedResponse, Notification, SingleNotificationResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch a paginated, filtered, sorted feed of notifications.
 */
export async function getNotifications(params: {
  studentId?: number;
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
  cursor?: string;
}): Promise<NotificationFeedResponse> {
  const url = new URL(`${API_BASE_URL}/notifications`);
  
  if (params.studentId !== undefined) url.searchParams.append('studentId', String(params.studentId));
  if (params.type) url.searchParams.append('type', params.type);
  if (params.isRead !== undefined) url.searchParams.append('isRead', String(params.isRead));
  if (params.limit !== undefined) url.searchParams.append('limit', String(params.limit));
  if (params.offset !== undefined) url.searchParams.append('offset', String(params.offset));
  if (params.cursor) url.searchParams.append('cursor', params.cursor);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch notifications');
  }
  return res.json();
}

/**
 * Patch isRead status for an individual notification.
 */
export async function markAsRead(id: string, isRead = true): Promise<SingleNotificationResponse> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isRead }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to mark notification as read');
  }
  return res.json();
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(id: string): Promise<SingleNotificationResponse> {
  const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete notification');
  }
  return res.json();
}

/**
 * Fetch the top 10 notifications for a student calculated dynamically via Min-Heap.
 */
export async function getPriorityNotifications(studentId: number): Promise<{ success: boolean; data: Notification[] }> {
  const res = await fetch(`${API_BASE_URL}/notifications/student/${studentId}/priority`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch priority notifications');
  }
  return res.json();
}

/**
 * Create a notification for a single student.
 */
export async function createNotification(studentId: number, type: string, message: string): Promise<SingleNotificationResponse> {
  const res = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, type, message }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create notification');
  }
  return res.json();
}

/**
 * Enqueue bulk notifications for processing.
 */
export async function sendBulkNotifications(type: string, message: string, studentIds?: number[]): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/notifications/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, message, studentIds }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to trigger bulk notifications');
  }
  return res.json();
}
