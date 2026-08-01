import { PaymentStatus } from '@prisma/client';
import { PrismaPaymentRepository } from './payment-prisma.repo';

describe('PrismaPaymentRepository', () => {
  it('completes payment and upserts enrollment in one transaction', async () => {
    const payment = { id: 'payment-1', status: PaymentStatus.completed };
    const transaction = {
      payment: { update: jest.fn().mockResolvedValue(payment) },
      enrollment: {
        upsert: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
      },
      course: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    const repository = new PrismaPaymentRepository(prisma as never);

    await expect(
      repository.completePaymentAndCreateEnrollment(
        'payment-1',
        'user-1',
        'course-1',
        'pi_1',
      ),
    ).resolves.toBe(payment);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: {
        status: PaymentStatus.completed,
        stripePaymentId: 'pi_1',
      },
    });
    expect(transaction.enrollment.upsert).toHaveBeenCalledWith({
      where: {
        studentId_courseId: {
          studentId: 'user-1',
          courseId: 'course-1',
        },
      },
      create: { studentId: 'user-1', courseId: 'course-1' },
      update: {},
    });
    expect(transaction.enrollment.count).toHaveBeenCalledWith({
      where: { courseId: 'course-1' },
    });
    expect(transaction.course.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { totalStudents: 1 },
    });
  });
});
