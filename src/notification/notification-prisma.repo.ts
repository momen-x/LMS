import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Notification } from './entities/notification.entity';
import { NotificationRepository } from './notification.repo';
import {
  CreateNotificationInput,
  NotificationPage,
} from './types/notification.type';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({ data: input });
  }

  findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<NotificationPage> {
    return this.findPage(userId, page, limit);
  }

  findUnreadByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<NotificationPage> {
    return this.findPage(userId, page, limit, false);
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    if (result.count === 0) return null;
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.notification.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  async deleteAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return result.count;
  }

  private async findPage(
    userId: string,
    page: number,
    limit: number,
    isRead?: boolean,
  ): Promise<NotificationPage> {
    const where = { userId, ...(isRead !== undefined && { isRead }) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, total };
  }
}
