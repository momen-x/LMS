import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { UpdateEnrollmentProgressDto } from './dto/update-enrollment.dto';
import {
  CreateEnrollmentInput,
  EnrollmentWithCourse,
  LessonCompletionResult,
  SafeEnrollmentStudent,
} from './type/enrollment.type';
import { Enrollment } from './entities/enrollment.entity';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { EnrollmentRepository } from './enrollment.repo';
import { syncCourseTotalStudents } from 'src/common/prisma/course-stats';
import { syncEnrollmentProgress } from './enrollment-progress';

@Injectable()
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  updateProgress(
    id: string,
    data: UpdateEnrollmentProgressDto,
  ): Promise<Enrollment> {
    const completed = data.progress === 100;
    return this.prisma.enrollment.update({
      where: {
        id,
      },
      data: {
        progress: data.progress,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  }
  markCompleted(id: string): Promise<Enrollment> {
    return this.prisma.enrollment.update({
      where: { id },
      data: {
        progress: 100,
        completed: true,
        completedAt: new Date(),
      },
    });
  }
  find(): Promise<Enrollment[]> {
    return this.prisma.enrollment.findMany();
  }

  findCourseStudent(
    courseId: string,
  ): Promise<(Enrollment & { student: SafeEnrollmentStudent })[]> {
    return this.prisma.enrollment.findMany({
      where: {
        courseId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
  }
  findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });
  }

  findOne(id: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: {
        id,
      },
    });
  }
  async delete(id: string): Promise<Enrollment> {
    return this.prisma.$transaction(async (transaction) => {
      const enrollment = await transaction.enrollment.delete({
        where: { id },
      });
      await syncCourseTotalStudents(transaction, enrollment.courseId);
      return enrollment;
    });
  }
  async create(data: CreateEnrollmentInput): Promise<Enrollment> {
    return this.prisma.$transaction(async (transaction) => {
      const enrollment = await transaction.enrollment.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
        },
      });
      await syncCourseTotalStudents(transaction, data.courseId);
      return enrollment;
    });
  }
  async hasCompletedPayment(
    studentId: string,
    courseId: string,
  ): Promise<boolean> {
    const payment = await this.prisma.payment.findFirst({
      where: { studentId, courseId, status: PaymentStatus.completed },
      select: { id: true },
    });
    return payment !== null;
  }

  findUserEnrollments(
    userId: string,
    courseId?: string,
  ): Promise<EnrollmentWithCourse[]> {
    return this.prisma.enrollment.findMany({
      where: {
        studentId: userId,
        ...(courseId ? { courseId } : {}),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            level: true,
            status: true,
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });
  }
  async getUserEnrollmentStats(userId: string) {
    const [totalCourses, completedCourses, progressResult] =
      await this.prisma.$transaction([
        this.prisma.enrollment.count({
          where: {
            studentId: userId,
          },
        }),

        this.prisma.enrollment.count({
          where: {
            studentId: userId,
            completed: true,
          },
        }),

        this.prisma.enrollment.aggregate({
          where: {
            studentId: userId,
          },
          _avg: {
            progress: true,
          },
        }),
      ]);

    return {
      totalCourses,
      completedCourses,
      inProgressCourses: totalCourses - completedCourses,
      averageProgress: progressResult._avg.progress ?? 0,
    };
  }

  async findLessonCourseId(lessonId: string): Promise<string | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { section: { select: { courseId: true } } },
    });
    return lesson?.section.courseId ?? null;
  }

  setLessonCompletion(
    enrollmentId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<LessonCompletionResult> {
    return this.prisma.$transaction(async (transaction) => {
      const existingProgress = await transaction.lessonProgress.findUnique({
        where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      });
      const lessonProgress = await transaction.lessonProgress.upsert({
        where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
        create: {
          enrollmentId,
          lessonId,
          completed,
          completedAt: completed ? new Date() : null,
        },
        update: {
          completed,
          completedAt:
            completed && !existingProgress?.completed
              ? new Date()
              : completed
                ? existingProgress?.completedAt
                : null,
        },
      });

      const enrollment = await syncEnrollmentProgress(
        transaction,
        enrollmentId,
      );
      return { enrollment, lessonProgress };
    });
  }
}
