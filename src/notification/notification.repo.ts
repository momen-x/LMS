import { Notification } from './entities/notification.entity';
import {
  CreateNotificationInput,
  NotificationPage,
} from './types/notification.type';

export abstract class NotificationRepository {
  abstract create(input: CreateNotificationInput): Promise<Notification>;
  abstract findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<NotificationPage>;
  abstract findUnreadByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<NotificationPage>;
  abstract countUnread(userId: string): Promise<number>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract markAsRead(id: string, userId: string): Promise<Notification | null>;
  abstract markAllAsRead(userId: string): Promise<number>;
  abstract delete(id: string, userId: string): Promise<boolean>;
  abstract deleteAllRead(userId: string): Promise<number>;
  abstract createCourseInformationNotification(
    courseId: string,
    title: string,
    text: string,
  ): Promise<{ count: number }>;
  abstract createAdminNotifications(
    input: Omit<CreateNotificationInput, 'userId'>,
  ): Promise<{ count: number }>;
}
