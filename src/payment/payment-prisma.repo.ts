import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PaymentCompletionResult, PaymentRepository } from './payment.repo';
import { Payment } from './entities/payment.entity';
import { syncCourseTotalStudents } from 'src/common/prisma/course-stats';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    studentId: string,
    courseId: string,
    amount: Prisma.Decimal,
    currency: string,
    stripeSessionId: string,
  ): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        studentId,
        courseId,
        amount,
        currency,
        stripeSessionId,
      },
    });
  }

  findByStripeSessionId(stripeSessionId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: {
        stripeSessionId,
      },
    });
  }

  findPendingPayment(
    studentId: string,
    courseId: string,
  ): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: {
        studentId,
        courseId,
        status: {
          equals: PaymentStatus.pending,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  completePaymentAndCreateEnrollment(
    paymentId: string,
    studentId: string,
    courseId: string,
    stripePaymentId: string,
  ): Promise<PaymentCompletionResult> {
    return this.prisma.$transaction(async (transaction) => {
      const completion = await transaction.payment.updateMany({
        where: {
          id: paymentId,
          status: {
            in: [
              PaymentStatus.pending,
              PaymentStatus.failed,
              PaymentStatus.expired,
            ],
          },
        },
        data: {
          status: PaymentStatus.completed,
          stripePaymentId,
        },
      });

      if (completion.count === 0) {
        const payment = await transaction.payment.findUniqueOrThrow({
          where: { id: paymentId },
        });
        const enrollment = await transaction.enrollment.findUnique({
          where: { studentId_courseId: { studentId, courseId } },
          select: { id: true },
        });
        if (payment.status === PaymentStatus.completed && enrollment === null) {
          await transaction.enrollment.upsert({
            where: { studentId_courseId: { studentId, courseId } },
            create: { studentId, courseId },
            update: {},
          });
          await syncCourseTotalStudents(transaction, courseId);
        }
        return {
          payment,
          enrollmentCreated:
            payment.status === PaymentStatus.completed && enrollment === null,
          completedNow: false,
        };
      }

      const existingEnrollment = await transaction.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
        select: { id: true },
      });
      await transaction.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        create: { studentId, courseId },
        update: {},
      });
      await syncCourseTotalStudents(transaction, courseId);
      const course = await transaction.course.findUniqueOrThrow({
        where: { id: courseId },
        select: { title: true, instructorId: true },
      });
      await transaction.notification.createMany({
        data: [
          {
            userId: studentId,
            title: 'Enrollment successful',
            text: `You have successfully enrolled in ${course.title}.`,
            type: 'success',
          },
          {
            userId: course.instructorId,
            title: 'New enrollment',
            text: `A student enrolled in ${course.title}.`,
            type: 'info',
          },
        ],
      });
      const payment = await transaction.payment.findUniqueOrThrow({
        where: { id: paymentId },
      });
      return {
        payment,
        enrollmentCreated: existingEnrollment === null,
        completedNow: true,
      };
    });
  }
  async markAsFailed(id: string): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { id, status: PaymentStatus.pending },
      data: {
        status: PaymentStatus.failed,
      },
    });
  }
  async markAsExpired(id: string): Promise<void> {
    await this.prisma.payment.updateMany({
      where: { id, status: PaymentStatus.pending },
      data: { status: 'expired' },
    });
  }
}
