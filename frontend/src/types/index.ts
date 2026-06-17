export type NotificationType = 'Event' | 'Result' | 'Placement';

export interface Notification {
  id: string;
  studentId: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  score?: number; // Added in priority calculations
}

export interface MetaData {
  total: number;
  limit: number;
  offset: number;
  cursor: string | null;
}

export interface NotificationFeedResponse {
  success: boolean;
  data: Notification[];
  meta: MetaData;
}

export interface SingleNotificationResponse {
  success: boolean;
  data: Notification;
}
