import { PrismaReviewRepository } from './review-prisma.repo';

describe('PrismaReviewRepository', () => {
  const review = {
    id: 'review-1',
    studentId: 'student-1',
    courseId: 'course-1',
    rating: 5,
    comment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function setup(average: number | null = 4) {
    const transaction = {
      review: {
        create: jest.fn().mockResolvedValue(review),
        update: jest.fn().mockResolvedValue(review),
        delete: jest.fn().mockResolvedValue(review),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: average } }),
      },
      course: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma: any = {
      review: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { rating: average },
          _count: { _all: 2 },
        }),
      },
      $transaction: jest.fn((input: any) =>
        typeof input === 'function' ? input(transaction) : Promise.all(input),
      ),
    };
    return {
      repository: new PrismaReviewRepository(prisma),
      prisma,
      transaction,
    };
  }

  it('creates a review and refreshes average rating atomically', async () => {
    const { repository, transaction } = setup(4.5);
    await repository.create('student-1', 'course-1', { rating: 5 });
    expect(transaction.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { averageRating: 4.5 },
    });
  });

  it('resets average rating to zero after the last review is deleted', async () => {
    const { repository, transaction } = setup(null);
    await repository.delete('review-1');
    expect(transaction.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { averageRating: 0 },
    });
  });

  it('refreshes average rating after a review update', async () => {
    const { repository, transaction } = setup(3.5);
    await repository.update('review-1', { rating: 3 });
    expect(transaction.review.update).toHaveBeenCalledWith({
      where: { id: 'review-1' },
      data: { rating: 3 },
    });
    expect(transaction.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { averageRating: 3.5 },
    });
  });

  it('selects only safe student fields in course review responses', async () => {
    const { repository, prisma } = setup();
    await repository.findByCourseId('course-1', 1, 10);
    const query = prisma.review.findMany.mock.calls[0][0];
    expect(query.include.student.select).toEqual({
      id: true,
      name: true,
      avatar: true,
    });
    expect(query.include.student.select).not.toHaveProperty('password');
    expect(query.include.student.select).not.toHaveProperty('providerId');
  });

  it('returns course rating statistics', async () => {
    const { repository } = setup(4.5);

    await expect(
      repository.getCourseRatingAggregate('course-1'),
    ).resolves.toEqual({
      averageRating: 4.5,
      totalReviews: 2,
    });
  });
});
