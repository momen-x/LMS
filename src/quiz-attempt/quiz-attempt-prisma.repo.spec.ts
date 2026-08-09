import { BadRequestException } from '@nestjs/common';
import { QuizAttemptStatus } from '@prisma/client';
import { PrismaQuizAttemptRepository } from './quiz-attempt-prisma.repo';

describe('PrismaQuizAttemptRepository scoring', () => {
  const submit = async (options: {
    totalQuestions: number;
    correctAnswers: number;
    totalMark?: number;
    passingScore?: number;
  }) => {
    const submitted = {
      id: 'attempt-1',
      studentId: 'student-1',
      quizId: 'quiz-1',
    };
    const questions = Array.from(
      { length: options.totalQuestions },
      (_, index) => ({
        questionId: `q${index + 1}`,
      }),
    );
    const answers = questions
      .slice(0, options.correctAnswers)
      .map((question) => ({
        questionId: question.questionId,
        choice: { isCorrect: true },
      }));
    const transaction = {
      quizAttempt: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          ...submitted,
          status: QuizAttemptStatus.in_progress,
          questions,
          answers,
          quiz: {
            courseId: 'course-1',
            totalMark: options.totalMark ?? 10,
            passingScore: options.passingScore ?? 50,
          },
        }),
        update: jest
          .fn()
          .mockImplementation(({ data }) => ({ ...submitted, ...data })),
      },
      enrollment: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transaction)),
    };
    const result = await new PrismaQuizAttemptRepository(
      prisma as never,
    ).submit('attempt-1');
    return { result, transaction };
  };

  it.each([
    [20, 16, 80, 8, true],
    [20, 7, 35, 3.5, false],
    [20, 10, 50, 5, true],
  ])(
    'scores %i attempt questions with %i correct',
    async (totalQuestions, correctAnswers, score, earnedMark, passed) => {
      const { result, transaction } = await submit({
        totalQuestions,
        correctAnswers,
      });
      expect(transaction.quizAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        data: expect.objectContaining({
          score,
          earnedMark,
          correctAnswers,
          totalQuestions,
        }),
      });
      expect(result).toEqual(expect.objectContaining({ passed }));
    },
  );

  it('rounds only the final decimal earned mark to two places', async () => {
    const { result } = await submit({ totalQuestions: 6, correctAnswers: 5 });
    expect(result.score).toBeCloseTo(83.33, 2);
    expect(result.earnedMark).toBe(8.33);
  });

  it('counts unanswered questions as incorrect and uses the attempt snapshot size', async () => {
    const { result } = await submit({ totalQuestions: 4, correctAnswers: 1 });
    expect(result).toEqual(
      expect.objectContaining({
        score: 25,
        earnedMark: 2.5,
        totalQuestions: 4,
      }),
    );
  });

  it('rejects an attempt with no assigned questions', async () => {
    await expect(
      submit({ totalQuestions: 0, correctAnswers: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
