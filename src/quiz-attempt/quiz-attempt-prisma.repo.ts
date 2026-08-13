import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Prisma,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizAttemptStatus,
} from '@prisma/client';
import { syncEnrollmentProgress } from 'src/enrollment/enrollment-progress';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { QuizAttemptRepository, StudentAttemptView } from './quiz-attempt.repo';

const studentViewInclude = {
  quiz: {
    select: { id: true, totalMark: true, passingScore: true, duration: true },
  },
  questions: {
    orderBy: { order: 'asc' as const },
    select: {
      order: true,
      question: {
        select: {
          id: true,
          text: true,
          choices: { select: { id: true, text: true } },
        },
      },
    },
  },
  answers: { select: { questionId: true, choiceId: true } },
};

@Injectable()
export class PrismaQuizAttemptRepository implements QuizAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithRandomQuestions(
    studentId: string,
    quizId: string,
  ): Promise<StudentAttemptView> {
    return this.prisma.$transaction(
      async (tx) => {
        const quiz = await tx.quiz.findUniqueOrThrow({ where: { id: quizId } });
        const attemptNumber =
          (await tx.quizAttempt.count({ where: { studentId, quizId } })) + 1;
        if (attemptNumber > quiz.maxAttempts)
          throw new BadRequestException(
            'You have reached the maximum number of attempts',
          );
        const candidates = await tx.question.findMany({
          where: { questionBankId: quiz.questionBankId },
          select: { id: true },
        });
        if (candidates.length < quiz.questionCount)
          throw new BadRequestException(
            'The question bank does not contain enough questions',
          );
        const selected = [...candidates]
          .sort(() => Math.random() - 0.5)
          .slice(0, quiz.questionCount);
        return tx.quizAttempt.create({
          data: {
            studentId,
            quizId,
            attemptNumber,
            questions: {
              create: selected.map((question, index) => ({
                questionId: question.id,
                order: index + 1,
              })),
            },
          },
          include: studentViewInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  findOne(id: string): Promise<QuizAttempt | null> {
    return this.prisma.quizAttempt.findUnique({ where: { id } });
  }
  findStudentView(id: string): Promise<StudentAttemptView | null> {
    return this.prisma.quizAttempt.findUnique({
      where: { id },
      include: studentViewInclude,
    });
  }
  findActiveAttempt(
    studentId: string,
    quizId: string,
  ): Promise<StudentAttemptView | null> {
    return this.prisma.quizAttempt.findFirst({
      where: { studentId, quizId, status: QuizAttemptStatus.in_progress },
      include: studentViewInclude,
    });
  }
  countStudentAttempts(studentId: string, quizId: string): Promise<number> {
    return this.prisma.quizAttempt.count({ where: { studentId, quizId } });
  }
  async isQuestionAssigned(
    attemptId: string,
    questionId: string,
  ): Promise<boolean> {
    return (
      (await this.prisma.quizAttemptQuestion.count({
        where: { attemptId, questionId },
      })) > 0
    );
  }
  async choiceBelongsToQuestion(
    choiceId: string,
    questionId: string,
  ): Promise<boolean> {
    return (
      (await this.prisma.choice.count({
        where: { id: choiceId, questionId },
      })) > 0
    );
  }
  saveAnswer(
    attemptId: string,
    questionId: string,
    choiceId: string,
  ): Promise<QuizAttemptAnswer> {
    return this.prisma.quizAttemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: { choiceId },
      create: { attemptId, questionId, choiceId },
    });
  }
  submit(id: string): Promise<QuizAttempt> {
    return this.prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.findUniqueOrThrow({
        where: { id },
        include: {
          questions: true,
          answers: { include: { choice: { select: { isCorrect: true } } } },
          quiz: {
            select: { courseId: true, totalMark: true, passingScore: true },
          },
        },
      });
      if (attempt.status !== QuizAttemptStatus.in_progress)
        throw new BadRequestException(
          'This quiz attempt has already been submitted',
        );
      const totalQuestions = attempt.questions.length;
      if (!totalQuestions)
        throw new BadRequestException(
          'This attempt does not contain any questions',
        );
      const assigned = new Set(
        attempt.questions.map((item) => item.questionId),
      );
      const correctAnswers = attempt.answers.filter(
        (answer) => assigned.has(answer.questionId) && answer.choice.isCorrect,
      ).length;
      const score = (correctAnswers / totalQuestions) * 100;
      const earnedMark = Number(
        ((correctAnswers / totalQuestions) * attempt.quiz.totalMark).toFixed(2),
      );
      const updated = await tx.quizAttempt.update({
        where: { id },
        data: {
          status: QuizAttemptStatus.submitted,
          score,
          earnedMark,
          correctAnswers,
          totalQuestions,
          submittedAt: new Date(),
        },
      });
      const enrollment = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: attempt.studentId,
            courseId: attempt.quiz.courseId,
          },
        },
        select: { id: true },
      });
      if (enrollment) await syncEnrollmentProgress(tx, enrollment.id);
      return {
        ...updated,
        quiz: {
          totalMark: attempt.quiz.totalMark,
          passingScore: attempt.quiz.passingScore,
        },
        passed: score >= attempt.quiz.passingScore,
      };
    });
  }
  findByStudentAndQuiz(
    studentId: string,
    quizId: string,
  ): Promise<QuizAttempt[]> {
    return this.prisma.quizAttempt.findMany({
      where: { studentId, quizId },
      orderBy: { attemptNumber: 'desc' },
    });
  }
  async hasPerfectAttempt(studentId: string, quizId: string): Promise<boolean> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        studentId,
        quizId,
        status: 'submitted',
        score: {
          gte: 100,
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(attempt);
  }
}
