import { Prisma } from '@prisma/client';

export async function syncCourseContentStats(
  transaction: Prisma.TransactionClient,
  courseId: string,
): Promise<void> {
  const [lessonsCount, durationResult] = await Promise.all([
    transaction.lesson.count({
      where: { section: { courseId } },
    }),
    transaction.lesson.aggregate({
      where: { section: { courseId } },
      _sum: { duration: true },
    }),
  ]);

  await transaction.course.update({
    where: { id: courseId },
    data: {
      lessonsCount,
      duration: durationResult._sum.duration ?? 0,
    },
  });
}

export async function syncLessonDuration(
  transaction: Prisma.TransactionClient,
  lessonId: string,
): Promise<void> {
  const [lesson, durationResult] = await Promise.all([
    transaction.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      select: { section: { select: { courseId: true } } },
    }),
    transaction.media.aggregate({
      where: { lessonId },
      _sum: { duration: true },
    }),
  ]);

  await transaction.lesson.update({
    where: { id: lessonId },
    data: { duration: durationResult._sum.duration ?? 0 },
  });
  await syncCourseContentStats(transaction, lesson.section.courseId);
}

export async function syncCourseTotalStudents(
  transaction: Prisma.TransactionClient,
  courseId: string,
): Promise<void> {
  const totalStudents = await transaction.enrollment.count({
    where: { courseId },
  });

  await transaction.course.update({
    where: { id: courseId },
    data: { totalStudents },
  });
}
