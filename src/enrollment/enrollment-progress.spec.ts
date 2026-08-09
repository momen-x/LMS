import { Prisma } from '@prisma/client';
import {
  hasPassedAllCourseQuizzes,
  syncEnrollmentProgress,
} from './enrollment-progress';

describe('enrollment progress synchronization', () => {
  const completedAt = new Date('2026-08-01T10:00:00.000Z');

  function setup(options?: {
    currentCompleted?: boolean;
    quizScore?: number;
    totalLessons?: number;
    completedLessons?: number;
  }) {
    const currentCompleted = options?.currentCompleted ?? false;
    const current = {
      id: 'enrollment-1',
      studentId: 'student-1',
      courseId: 'course-1',
      progress: currentCompleted ? 100 : 0,
      completed: currentCompleted,
      enrolledAt: new Date(),
      completedAt: currentCompleted ? completedAt : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      course: { title: 'NestJS' },
    };
    const updated = {
      ...current,
      progress: 100,
      completed: (options?.quizScore ?? 40) >= 50,
    };
    const transaction = {
      enrollment: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(current),
        update: jest.fn().mockResolvedValue(updated),
      },
      lesson: {
        count: jest.fn().mockResolvedValue(options?.totalLessons ?? 2),
      },
      lessonProgress: {
        count: jest.fn().mockResolvedValue(options?.completedLessons ?? 2),
      },
      quiz: {
        findMany: jest.fn().mockResolvedValue([
          {
            passingScore: 50,
            attempts: [{ score: options?.quizScore ?? 40 }],
          },
        ]),
      },
      certificate: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    return {
      current,
      transaction,
      transactionClient: transaction as unknown as Prisma.TransactionClient,
    };
  }

  it('keeps completion false when lessons are complete but a quiz is failed', async () => {
    const { transaction, transactionClient } = setup({ quizScore: 40 });

    await syncEnrollmentProgress(transactionClient, 'enrollment-1');

    expect(transaction.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'enrollment-1' },
      data: {
        progress: 100,
        completed: false,
        completedAt: null,
      },
    });
    expect(transaction.certificate.upsert).not.toHaveBeenCalled();
    expect(transaction.notification.createMany).not.toHaveBeenCalled();
  });

  it('completes after the final quiz is passed and creates artifacts once', async () => {
    const { transaction, transactionClient } = setup({ quizScore: 80 });

    await syncEnrollmentProgress(transactionClient, 'enrollment-1');

    expect(transaction.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'enrollment-1' },
      data: {
        progress: 100,
        completed: true,
        completedAt: expect.any(Date),
      },
    });
    expect(transaction.certificate.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.notification.createMany).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate completion artifacts when synchronization runs again', async () => {
    const { current, transaction, transactionClient } = setup({
      currentCompleted: true,
      quizScore: 80,
    });

    await expect(
      syncEnrollmentProgress(transactionClient, 'enrollment-1'),
    ).resolves.toBe(current);

    expect(transaction.enrollment.update).not.toHaveBeenCalled();
    expect(transaction.certificate.upsert).not.toHaveBeenCalled();
    expect(transaction.notification.createMany).not.toHaveBeenCalled();
  });

  it('preserves permanent completion after future content is added', async () => {
    const { current, transaction, transactionClient } = setup({
      currentCompleted: true,
      totalLessons: 3,
      completedLessons: 2,
      quizScore: 0,
    });

    const result = await syncEnrollmentProgress(
      transactionClient,
      'enrollment-1',
    );

    expect(result).toBe(current);
    expect(result.progress).toBe(100);
    expect(result.completed).toBe(true);
    expect(result.completedAt).toBe(completedAt);
    expect(transaction.lesson.count).not.toHaveBeenCalled();
    expect(transaction.quiz.findMany).not.toHaveBeenCalled();
  });

  it('treats a course without quizzes as having passed all quizzes', async () => {
    const { transaction, transactionClient } = setup();
    transaction.quiz.findMany.mockResolvedValue([]);

    await expect(
      hasPassedAllCourseQuizzes(transactionClient, 'student-1', 'course-1'),
    ).resolves.toBe(true);
  });

  it('finds all required quizzes directly by courseId', async () => {
    const { transaction, transactionClient } = setup({ quizScore: 80 });

    await hasPassedAllCourseQuizzes(
      transactionClient,
      'student-1',
      'course-1',
    );

    expect(transaction.quiz.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { courseId: 'course-1' } }),
    );
  });
});
