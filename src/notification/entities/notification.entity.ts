import { NotificationType } from '@prisma/client';

export class Notification {
  constructor(
    public id: string,
    public userId: string,
    public title: string,
    public text: string,
    public type: NotificationType,
    public isRead: boolean,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
