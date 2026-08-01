import { QuizAttemptStatus } from '@prisma/client';
import { PrismaQuizAttemptRepository } from './quiz-attempt-prisma.repo';

describe('PrismaQuizAttemptRepository', () => {
  it('submits the attempt and locates its enrollment in one transaction', async () => {
    const attempt = {
      id: 'attempt-1',
      studentId: 'student-1',
      quizId: 'quiz-1',
      attemptNumber: 1,
      status: QuizAttemptStatus.submitted,
      score: 80,
      correctAnswers: 4,
      totalQuestions: 5,
      startedAt: new Date(),
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const transaction = {
      quizAttempt: { update: jest.fn().mockResolvedValue(attempt) },
      quiz: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          lesson: { section: { courseId: 'course-1' } },
        }),
      },
      enrollment: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const repository = new PrismaQuizAttemptRepository(prisma as never);
    const submittedAt = new Date();

    await expect(
      repository.submit('attempt-1', {
        status: QuizAttemptStatus.submitted,
        score: 80,
        correctAnswers: 4,
        totalQuestions: 5,
        submittedAt,
      }),
    ).resolves.toBe(attempt);

    expect(transaction.enrollment.findUnique).toHaveBeenCalledWith({
      where: {
        studentId_courseId: {
          studentId: 'student-1',
          courseId: 'course-1',
        },
      },
      select: { id: true },
    });
  });
});
