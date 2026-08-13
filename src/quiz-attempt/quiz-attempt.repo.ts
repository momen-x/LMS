import { QuizAttempt, QuizAttemptAnswer } from '@prisma/client';

export type StudentAttemptView = QuizAttempt & {
  quiz: {
    id: string;
    totalMark: number;
    passingScore: number;
    duration: number;
  };
  questions: Array<{
    order: number;
    question: {
      id: string;
      text: string;
      choices: Array<{ id: string; text: string }>;
    };
  }>;
  answers: Array<{ questionId: string; choiceId: string }>;
};

export abstract class QuizAttemptRepository {
  abstract createWithRandomQuestions(
    studentId: string,
    quizId: string,
  ): Promise<StudentAttemptView>;
  abstract findOne(id: string): Promise<QuizAttempt | null>;
  abstract findStudentView(id: string): Promise<StudentAttemptView | null>;
  abstract findActiveAttempt(
    studentId: string,
    quizId: string,
  ): Promise<StudentAttemptView | null>;
  abstract countStudentAttempts(
    studentId: string,
    quizId: string,
  ): Promise<number>;
  abstract isQuestionAssigned(
    attemptId: string,
    questionId: string,
  ): Promise<boolean>;
  abstract choiceBelongsToQuestion(
    choiceId: string,
    questionId: string,
  ): Promise<boolean>;
  abstract saveAnswer(
    attemptId: string,
    questionId: string,
    choiceId: string,
  ): Promise<QuizAttemptAnswer>;
  abstract submit(id: string): Promise<QuizAttempt>;
  abstract findByStudentAndQuiz(
    studentId: string,
    quizId: string,
  ): Promise<QuizAttempt[]>;
  abstract hasPerfectAttempt(
    studentId: string,
    quizId: string,
  ): Promise<boolean>;
}
