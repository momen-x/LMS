import { PrismaLessonRepository } from './lesson-prisma.repo';

describe('PrismaLessonRepository ordering', () => {
  it.each([
    [null, 1],
    [{ order: 2 }, 3],
  ])(
    'assigns the next section-scoped order',
    async (lastLesson, expectedOrder) => {
      const transaction = {
        section: {
          findUniqueOrThrow: jest
            .fn()
            .mockResolvedValue({ courseId: 'course-1' }),
        },
        lesson: {
          findFirst: jest.fn().mockResolvedValue(lastLesson),
          create: jest.fn().mockResolvedValue({ order: expectedOrder }),
          count: jest.fn().mockResolvedValue(1),
          aggregate: jest.fn().mockResolvedValue({ _sum: { duration: 0 } }),
        },
        course: { update: jest.fn() },
      };
      const prisma = {
        $transaction: jest.fn((callback) => callback(transaction)),
      };
      await new PrismaLessonRepository(prisma as never).create(
        { title: 'Lesson' },
        'section-1',
      );
      expect(transaction.lesson.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sectionId: 'section-1' } }),
      );
      expect(transaction.lesson.create).toHaveBeenCalledWith({
        data: { title: 'Lesson', sectionId: 'section-1', order: expectedOrder },
      });
    },
  );

  it('normalizes later sibling orders after deletion', async () => {
    const transaction = {
      lesson: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          sectionId: 'section-1',
          order: 2,
          section: { courseId: 'course-1' },
        }),
        delete: jest.fn().mockResolvedValue({ id: 'lesson-2' }),
        updateMany: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
        aggregate: jest.fn().mockResolvedValue({ _sum: { duration: 10 } }),
      },
      course: { update: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    await new PrismaLessonRepository(prisma as never).remove('lesson-2');
    expect(transaction.lesson.updateMany).toHaveBeenCalledWith({
      where: { sectionId: 'section-1', order: { gt: 2 } },
      data: { order: { decrement: 1 } },
    });
  });
});
