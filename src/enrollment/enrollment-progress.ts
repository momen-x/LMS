import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Enrollment } from './entities/enrollment.entity';

export async function hasPassedAllCourseQuizzes(
  transaction: Prisma.TransactionClient,
  studentId: string,
  courseId: string,
): Promise<boolean> {
  const quizzes = await transaction.quiz.findMany({
    where: { lesson: { section: { courseId } } },
    select: {
      passingScore: true,
      attempts: {
        where: {
          studentId,
          status: 'submitted',
          score: { not: null },
        },
        select: { score: true },
      },
    },
  });

  return quizzes.every((quiz) =>
    quiz.attempts.some(
      (attempt) => attempt.score !== null && attempt.score >= quiz.passingScore,
    ),
  );
}

export async function syncEnrollmentProgress(
  transaction: Prisma.TransactionClient,
  enrollmentId: string,
): Promise<Enrollment> {
  const current = await transaction.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: {
      course: {
        select: {
          title: true,
        },
      },
    },
  });

  if (current.completed) {
    return current;
  }

  const [totalLessons, completedLessons, allRequiredQuizzesPassed] =
    await Promise.all([
      transaction.lesson.count({
        where: {
          section: {
            courseId: current.courseId,
          },
        },
      }),
      transaction.lessonProgress.count({
        where: {
          enrollmentId,
          completed: true,
        },
      }),
      hasPassedAllCourseQuizzes(
        transaction,
        current.studentId,
        current.courseId,
      ),
    ]);

  const progress =
    totalLessons === 0
      ? 0
      : Number(((completedLessons / totalLessons) * 100).toFixed(2));
  const allLessonsCompleted =
    totalLessons > 0 && completedLessons === totalLessons;
  const isCompleted = allLessonsCompleted && allRequiredQuizzesPassed;
  const transitionedToCompleted = !current.completed && isCompleted;

  const enrollment = await transaction.enrollment.update({
    where: {
      id: enrollmentId,
    },
    data: {
      progress,
      completed: isCompleted,
      completedAt: transitionedToCompleted ? new Date() : null,
    },
  });

  if (transitionedToCompleted) {
    await transaction.certificate.upsert({
      where: {
        studentId_courseId: {
          studentId: current.studentId,
          courseId: current.courseId,
        },
      },
      create: {
        studentId: current.studentId,
        courseId: current.courseId,
        certificateNumber: `CERT-${new Date().getFullYear()}-${randomUUID().toUpperCase()}`,
      },
      update: {},
    });

    await transaction.notification.createMany({
      data: [
        {
          userId: current.studentId,
          title: 'Course completed',
          text: `You completed ${current.course.title}.`,
          type: 'success',
        },
        {
          userId: current.studentId,
          title: 'Certificate issued',
          text: `Your certificate for ${current.course.title} is now available.`,
          type: 'success',
        },
      ],
    });
  }

  return enrollment;
}
