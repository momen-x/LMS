import { NotificationType } from '@prisma/client';
import { Notification } from '../entities/notification.entity';

export type CreateNotificationInput = {
  userId: string;
  title: string;
  text: string;
  type: NotificationType;
};

export type NotificationPage = {
  data: Notification[];
  total: number;
};
