import { NotificationRef } from './notification-ref';

export type NotificationType = 'success' | 'error';

export interface SuccessNotification {
  type: 'success';
  message: string;
}

export interface ErrorNotification {
  type: 'error';
  text: string;
  retry?: () => void;
}

export type NotificationConfig = SuccessNotification | ErrorNotification;

export interface NotificationState {
  id: number;
  config: NotificationConfig;
  ref: NotificationRef;
}
