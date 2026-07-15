import { PaymentStatus, Prisma } from '@prisma/client';

export class Payment {
  constructor(
    public id: string,
    public studentId: string,
    public courseId: string,
    public amount: Prisma.Decimal,
    public currency: string,
    public status: PaymentStatus,
    public stripePaymentId: string | null,
    public stripeSessionId: string | null,
    public refundedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
