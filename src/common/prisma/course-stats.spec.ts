import { syncLessonDuration } from './course-stats';

describe('syncLessonDuration', () => {
  it.each([
    [25, 25],
    [null, 0],
  ])('stores the media duration sum %s as %i', async (sum, expected) => {
    const transaction = {
      lesson: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          section: { courseId: 'course-1' },
        }),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { duration: expected } }),
      },
      media: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { duration: sum } }),
      },
      course: { update: jest.fn() },
    };

    await syncLessonDuration(transaction as never, 'lesson-1');

    expect(transaction.media.aggregate).toHaveBeenCalledWith({
      where: { lessonId: 'lesson-1' },
      _sum: { duration: true },
    });
    expect(transaction.lesson.update).toHaveBeenCalledWith({
      where: { id: 'lesson-1' },
      data: { duration: expected },
    });
    expect(transaction.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { lessonsCount: 2, duration: expected },
    });
  });
});
