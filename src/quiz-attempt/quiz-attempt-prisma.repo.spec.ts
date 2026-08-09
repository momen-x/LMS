import { QuizAttemptStatus } from '@prisma/client';
import { PrismaQuizAttemptRepository } from './quiz-attempt-prisma.repo';

describe('PrismaQuizAttemptRepository', () => {
  it('scores only assigned answers and synchronizes the enrollment transactionally', async () => {
    const submitted = {
      id: 'attempt-1',
      studentId: 'student-1',
      quizId: 'quiz-1',
    };
    const transaction = {
      quizAttempt: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...submitted,
          status: QuizAttemptStatus.in_progress,
          questions: [{ questionId: 'q1' }, { questionId: 'q2' }],
          answers: [
            { questionId: 'q1', choice: { isCorrect: true } },
            { questionId: 'q2', choice: { isCorrect: false } },
          ],
          quiz: { courseId: 'course-1' },
        }),
        update: jest.fn().mockResolvedValue(submitted),
      },
      enrollment: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const repository = new PrismaQuizAttemptRepository(prisma as never);

    await expect(repository.submit('attempt-1')).resolves.toBe(submitted);
    expect(transaction.quizAttempt.update).toHaveBeenCalledWith({
      where: { id: 'attempt-1' },
      data: expect.objectContaining({
        status: QuizAttemptStatus.submitted,
        score: 50,
        correctAnswers: 1,
        totalQuestions: 2,
      }),
    });
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
