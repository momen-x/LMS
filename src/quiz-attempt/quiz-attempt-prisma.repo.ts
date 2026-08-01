import { Injectable } from '@nestjs/common';
import { QuizAttemptStatus, StudentAnswer } from '@prisma/client';

import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { QuizAttemptRepository } from './quiz-attempt.repo';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { AttemptAnswerResult } from './types/attempt-answer-result.type';
import { syncEnrollmentProgress } from 'src/enrollment/enrollment-progress';

@Injectable()
export class PrismaQuizAttemptRepository implements QuizAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    studentId: string,
    quizId: string,
    attemptNumber: number,
  ): Promise<QuizAttempt> {
    return this.prisma.quizAttempt.create({
      data: {
        studentId,
        quizId,
        attemptNumber,
      },
    });
  }

  findOne(id: string): Promise<QuizAttempt | null> {
    return this.prisma.quizAttempt.findUnique({
      where: { id },
    });
  }

  findActiveAttempt(
    studentId: string,
    quizId: string,
  ): Promise<QuizAttempt | null> {
    return this.prisma.quizAttempt.findFirst({
      where: {
        studentId,
        quizId,
        status: QuizAttemptStatus.in_progress,
      },
    });
  }

  countStudentAttempts(studentId: string, quizId: string): Promise<number> {
    return this.prisma.quizAttempt.count({
      where: {
        studentId,
        quizId,
      },
    });
  }

  saveAnswer(
    attemptId: string,
    questionId: string,
    choiceId: string,
  ): Promise<StudentAnswer> {
    return this.prisma.studentAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        choiceId,
      },
      create: {
        attemptId,
        questionId,
        choiceId,
      },
    });
  }

  findAnswers(attemptId: string) {
    return this.prisma.studentAnswer.findMany({
      where: {
        attemptId,
      },
      include: {
        choice: {
          select: {
            isCorrect: true,
          },
        },
      },
    });
  }

  countQuizQuestions(quizId: string): Promise<number> {
    return this.prisma.question.count({
      where: {
        quizId,
      },
    });
  }

  submit(
    id: string,
    data: {
      status: QuizAttemptStatus;
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      submittedAt: Date;
    },
  ): Promise<QuizAttempt> {
    return this.prisma.$transaction(async (transaction) => {
      const attempt = await transaction.quizAttempt.update({
        where: { id },
        data,
      });
      const quiz = await transaction.quiz.findUniqueOrThrow({
        where: { id: attempt.quizId },
        select: {
          lesson: {
            select: {
              section: {
                select: { courseId: true },
              },
            },
          },
        },
      });
      const enrollment = await transaction.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: attempt.studentId,
            courseId: quiz.lesson.section.courseId,
          },
        },
        select: { id: true },
      });
      if (enrollment) {
        await syncEnrollmentProgress(transaction, enrollment.id);
      }
      return attempt;
    });
  }

  findByStudentAndQuiz(
    studentId: string,
    quizId: string,
  ): Promise<QuizAttempt[]> {
    return this.prisma.quizAttempt.findMany({
      where: {
        studentId,
        quizId,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });
  }
  async findAnswersByAttemptId(
    attemptId: string,
  ): Promise<AttemptAnswerResult[]> {
    return this.prisma.studentAnswer.findMany({
      where: {
        attemptId,
      },
      select: {
        questionId: true,
        choiceId: true,
      },
    });
  }
}
