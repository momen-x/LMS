import { Prisma } from '@prisma/client';
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

  abstract findPendingPayment(
    studentId: string,
    courseId: string,
  ): Promise<Payment | null>;
  abstract completePaymentAndCreateEnrollment(
    paymentId: string,
    studentId: string,
    courseId: string,
    stripePaymentId: string,
  ): Promise<Payment>;
  abstract markAsFailed(id: string): Promise<void>;
  abstract markAsExpired(id: string): Promise<void>;
}
