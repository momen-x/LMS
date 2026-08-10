import { PrismaSectionRepository } from './section-prisma.repo';

describe('PrismaSectionRepository ordering', () => {
  it.each([
    [null, 1],
    [{ order: 2 }, 3],
  ])(
    'assigns the next course-scoped order',
    async (lastSection, expectedOrder) => {
      const transaction = {
        section: {
          findFirst: jest.fn().mockResolvedValue(lastSection),
          create: jest.fn().mockResolvedValue({ order: expectedOrder }),
        },
      };
      const prisma = {
        $transaction: jest.fn((callback) => callback(transaction)),
      };
      await new PrismaSectionRepository(prisma as never).create(
        { title: 'Section' },
        'course-1',
      );
      expect(transaction.section.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { courseId: 'course-1' } }),
      );
      expect(transaction.section.create).toHaveBeenCalledWith({
        data: { title: 'Section', courseId: 'course-1', order: expectedOrder },
      });
    },
  );

  it('normalizes later sibling orders after deletion', async () => {
    const transaction = {
      section: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ courseId: 'course-1', order: 2 }),
        delete: jest.fn().mockResolvedValue({ id: 'section-2' }),
        updateMany: jest.fn(),
      },
      lesson: {
        count: jest.fn().mockResolvedValue(2),
        aggregate: jest.fn().mockResolvedValue({ _sum: { duration: 20 } }),
      },
      course: { update: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    await new PrismaSectionRepository(prisma as never).delete('section-2');
    expect(transaction.section.updateMany).toHaveBeenCalledWith({
      where: { courseId: 'course-1', order: { gt: 2 } },
      data: { order: { decrement: 1 } },
    });
  });
});
