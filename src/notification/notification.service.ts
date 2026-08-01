import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from 'src/utils/pagination-query.dto';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './notification.repo';
import { CreateNotificationInput } from './types/notification.type';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  create(input: CreateNotificationInput): Promise<Notification> {
    return this.notificationRepository.create(input);
  }

  createForAdmins(input: Omit<CreateNotificationInput, 'userId'>) {
    return this.notificationRepository.createAdminNotifications(input);
  }

  async findMine(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Notification>> {
    const result = await this.notificationRepository.findByUserId(
      userId,
      page,
      limit,
    );
    return this.toPaginated(result.data, result.total, page, limit);
  }

  async findUnread(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Notification>> {
    const result = await this.notificationRepository.findUnreadByUserId(
      userId,
      page,
      limit,
    );
    return this.toPaginated(result.data, result.total, page, limit);
  }

  async countUnread(userId: string) {
    return { count: await this.notificationRepository.countUnread(userId) };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.markAsRead(
      id,
      userId,
    );
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async markAllAsRead(userId: string) {
    return {
      updated: await this.notificationRepository.markAllAsRead(userId),
    };
  }

  async delete(id: string, userId: string) {
    const deleted = await this.notificationRepository.delete(id, userId);
    if (!deleted) throw new NotFoundException('Notification not found');
    return { success: true };
  }

  async deleteAllRead(userId: string) {
    return {
      deleted: await this.notificationRepository.deleteAllRead(userId),
    };
  }

  private toPaginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
