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

  updateStatus(
    id: string,
    status: PaymentStatus,
    stripePaymentId?: string,
  ): Promise<Payment> {
    return this.prisma.payment.update({
      where: {
        id,
      },
      data: {
        status,
        stripePaymentId,
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
    });
  }
  markAsCompleted(id: string, stripePaymentId: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: {
        id,
      },
      data: {
        status: PaymentStatus.completed,
        stripePaymentId,
      },
    });
  }
  markAsFailed(id: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: {
        id,
      },
      data: {
        status: PaymentStatus.failed,
      },
    });
  }
}
