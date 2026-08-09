import { QuizAttemptStatus } from '@prisma/client';

export class QuizAttempt {
  constructor(
    public id: string,
    public studentId: string,
    public quizId: string,
    public attemptNumber: number,
    public status: QuizAttemptStatus,
    public score: number | null,
    public earnedMark: number | null,
    public correctAnswers: number | null,
    public totalQuestions: number | null,
    public startedAt: Date,
    public submittedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
