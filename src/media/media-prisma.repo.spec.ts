import { MediaType } from '@prisma/client';
import { PrismaMediaRepository } from './media-prisma.repo';

describe('PrismaMediaRepository duration synchronization', () => {
  const setup = (sum: number | null) => {
    const transaction = {
      media: {
        create: jest.fn().mockResolvedValue({ id: 'media-1' }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ lessonId: 'lesson-1' }),
        update: jest.fn().mockResolvedValue({ id: 'media-1' }),
        delete: jest.fn().mockResolvedValue({ id: 'media-1' }),
        aggregate: jest.fn().mockResolvedValue({ _sum: { duration: sum } }),
      },
      lesson: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          section: { courseId: 'course-1' },
        }),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { duration: sum ?? 0 } }),
      },
      course: { update: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    return {
      repository: new PrismaMediaRepository(prisma as never),
      transaction,
    };
  };

  it('recalculates Lesson duration after media creation', async () => {
    const { repository, transaction } = setup(25);
    await repository.create(
      { type: MediaType.video, duration: 15 },
      'lesson-1',
      'url',
    );
    expect(transaction.lesson.update).toHaveBeenCalledWith({
      where: { id: 'lesson-1' },
      data: { duration: 25 },
    });
  });

  it('recalculates Lesson duration after a duration update', async () => {
    const { repository, transaction } = setup(30);
    await repository.update('media-1', { duration: 20 });
    expect(transaction.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { duration: 30 } }),
    );
  });

  it('recalculates Lesson duration after deletion and falls back to zero', async () => {
    const { repository, transaction } = setup(null);
    await repository.remove('media-1');
    expect(transaction.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { duration: 0 } }),
    );
  });
});
