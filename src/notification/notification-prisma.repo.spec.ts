import { PrismaNotificationRepository } from './notification-prisma.repo';

describe('PrismaNotificationRepository', () => {
  function setup() {
    const prisma: any = {
      notification: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({ id: 'notification-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((input: Promise<unknown>[]) => Promise.all(input)),
    };
    return {
      repository: new PrismaNotificationRepository(prisma),
      prisma,
    };
  }

  it('includes ownership in mark-as-read query', async () => {
    const { repository, prisma } = setup();
    await repository.markAsRead('notification-1', 'user-1');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
      data: { isRead: true },
    });
  });

  it('includes ownership in delete query', async () => {
    const { repository, prisma } = setup();
    await repository.delete('notification-1', 'user-1');
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
    });
  });

  it('filters unread pages by user and unread status', async () => {
    const { repository, prisma } = setup();
    await repository.findUnreadByUserId('user-1', 1, 20);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', isRead: false } }),
    );
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
    });
  });
});
