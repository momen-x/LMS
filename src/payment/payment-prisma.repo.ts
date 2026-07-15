import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PaymentRepository } from './payment.repo';
import { Payment } from './entities/payment.entity';

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
  ): Promise<Payment> {
    return this.prisma.$transaction(async (transaction) => {
      const payment = await transaction.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.completed,
          stripePaymentId,
        },
      });
      await transaction.enrollment.upsert({
        where: { studentId_courseId: { studentId, courseId } },
        create: { studentId, courseId },
        update: {},
      });
      return payment;
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
