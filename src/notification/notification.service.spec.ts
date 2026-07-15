import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notification.service';

describe('NotificationsService', () => {
  function setup() {
    const repository: any = {
      findByUserId: jest.fn().mockResolvedValue({ data: [], total: 21 }),
      findUnreadByUserId: jest.fn().mockResolvedValue({ data: [], total: 3 }),
      countUnread: jest.fn().mockResolvedValue(3),
      markAsRead: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      markAllAsRead: jest.fn().mockResolvedValue(3),
      delete: jest.fn().mockResolvedValue(true),
      deleteAllRead: jest.fn().mockResolvedValue(2),
    };
    return {
      service: new NotificationsService(repository),
      repository,
    };
  }

  it('queries only the authenticated user notifications', async () => {
    const { service, repository } = setup();
    await service.findMine('user-1', 2, 10);
    expect(repository.findByUserId).toHaveBeenCalledWith('user-1', 2, 10);
  });

  it('returns correct pagination metadata', async () => {
    const { service } = setup();
    await expect(service.findMine('user-1', 2, 10)).resolves.toMatchObject({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });

  it('returns unread count for the authenticated user', async () => {
    const { service, repository } = setup();
    await expect(service.countUnread('user-1')).resolves.toEqual({ count: 3 });
    expect(repository.countUnread).toHaveBeenCalledWith('user-1');
  });

  it('marks one and all notifications as read', async () => {
    const { service, repository } = setup();
    await service.markAsRead('notification-1', 'user-1');
    await expect(service.markAllAsRead('user-1')).resolves.toEqual({
      updated: 3,
    });
    expect(repository.markAsRead).toHaveBeenCalledWith(
      'notification-1',
      'user-1',
    );
  });

  it('hides notifications owned by another user as not found', async () => {
    const { service, repository } = setup();
    repository.markAsRead.mockResolvedValue(null);
    repository.delete.mockResolvedValue(false);
    await expect(
      service.markAsRead('notification-2', 'user-1'),
    ).rejects.toThrow(NotFoundException);
    await expect(service.delete('notification-2', 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
