import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { UpdateEnrollmentProgressDto } from './dto/update-enrollment.dto';
import {
  CreateEnrollmentInput,
  EnrollmentWithCourse,
  SafeEnrollmentStudent,
} from './type/enrollment.type';
import { Enrollment } from './entities/enrollment.entity';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { EnrollmentRepository } from './enrollment.repo';

@Injectable()
export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  updateProgress(
    id: string,
    data: UpdateEnrollmentProgressDto,
  ): Promise<Enrollment> {
    return this.prisma.enrollment.update({
      where: {
        id,
      },
      data: { progress: data.progress },
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
  delete(id: string): Promise<Enrollment> {
    return this.prisma.enrollment.delete({
      where: {
        id,
      },
    });
  }
  async create(data: CreateEnrollmentInput): Promise<Enrollment> {
    return this.prisma.enrollment.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId,
      },
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
}
