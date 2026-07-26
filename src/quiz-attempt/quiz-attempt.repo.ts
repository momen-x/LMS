import { QuizAttemptStatus, StudentAnswer } from '@prisma/client';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { AttemptAnswerResult } from './types/attempt-answer-result.type';
export abstract class QuizAttemptRepository {
  abstract create(
    studentId: string,
    quizId: string,
    attemptNumber: number,
  ): Promise<QuizAttempt>;

  abstract findOne(id: string): Promise<QuizAttempt | null>;

  abstract findActiveAttempt(
    studentId: string,
    quizId: string,
  ): Promise<QuizAttempt | null>;

  abstract countStudentAttempts(
    studentId: string,
    quizId: string,
  ): Promise<number>;

  abstract saveAnswer(
    attemptId: string,
    questionId: string,
    choiceId: string,
  ): Promise<StudentAnswer>;

  abstract findAnswers(attemptId: string): Promise<
    Array<
      StudentAnswer & {
        choice: {
          isCorrect: boolean;
        };
      }
    >
  >;

  abstract countQuizQuestions(quizId: string): Promise<number>;

  abstract submit(
    id: string,
    data: {
      status: QuizAttemptStatus;
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      submittedAt: Date;
    },
  ): Promise<QuizAttempt>;

  abstract findByStudentAndQuiz(
    studentId: string,
    quizId: string,
  ): Promise<QuizAttempt[]>;
  abstract findAnswersByAttemptId(
    attemptId: string,
  ): Promise<AttemptAnswerResult[]>;
}
