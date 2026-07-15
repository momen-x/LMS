import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { PrismaNotificationRepository } from './notification-prisma.repo';
import { NotificationRepository } from './notification.repo';
import { NotificationsService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationsService,
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationModule {}
