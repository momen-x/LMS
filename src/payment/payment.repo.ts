import { PaymentStatus, Prisma } from '@prisma/client';
import { Payment } from './entities/payment.entity';

export abstract class PaymentRepository {
  abstract create(
    studentId: string,
    courseId: string,
    amount: Prisma.Decimal,
    currency: string,
    stripeSessionId: string,
  ): Promise<Payment>;

  abstract findByStripeSessionId(
    stripeSessionId: string,
  ): Promise<Payment | null>;

  abstract updateStatus(
    id: string,
    status: PaymentStatus,
    stripePaymentId?: string,
  ): Promise<Payment>;
  abstract findPendingPayment(
    studentId: string,
    courseId: string,
  ): Promise<Payment | null>;
  abstract markAsCompleted(
    id: string,
    stripePaymentId: string,
  ): Promise<Payment>;

  abstract markAsFailed(id: string): Promise<Payment>;
}
