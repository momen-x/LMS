import { Prisma } from '@prisma/client';
import { Payment } from './entities/payment.entity';

export type PaymentCompletionResult = {
  payment: Payment;
  enrollmentCreated: boolean;
  completedNow: boolean;
};

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
  ): Promise<PaymentCompletionResult>;
  abstract markAsFailed(id: string): Promise<void>;
  abstract markAsExpired(id: string): Promise<void>;
}
