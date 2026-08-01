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
