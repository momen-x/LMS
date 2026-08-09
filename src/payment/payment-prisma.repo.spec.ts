import { PaymentStatus } from '@prisma/client';
import { PrismaPaymentRepository } from './payment-prisma.repo';

describe('PrismaPaymentRepository', () => {
  function setup(completedNow = true) {
    const payment = {
      id: 'payment-1',
      studentId: 'user-1',
      courseId: 'course-1',
      status: PaymentStatus.completed,
    };
    const transaction = {
      payment: {
        updateMany: jest
          .fn()
          .mockResolvedValue({ count: completedNow ? 1 : 0 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(payment),
      },
      enrollment: {
        findUnique: jest
          .fn()
          .mockResolvedValue(completedNow ? null : { id: 'enrollment-1' }),
        upsert: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
      },
      course: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          title: 'NestJS',
          instructorId: 'instructor-1',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      notification: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };
    return {
      repository: new PrismaPaymentRepository(prisma as never),
      transaction,
    };
  }

  it('atomically claims completion, enrolls, and creates notifications', async () => {
    const { repository, transaction } = setup();

    await expect(
      repository.completePaymentAndCreateEnrollment(
        'payment-1',
        'user-1',
        'course-1',
        'pi_1',
      ),
    ).resolves.toMatchObject({
      completedNow: true,
      enrollmentCreated: true,
    });

    expect(transaction.payment.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'payment-1',
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
        stripePaymentId: 'pi_1',
      },
    });
    expect(transaction.enrollment.upsert).toHaveBeenCalledTimes(1);
    expect(transaction.notification.createMany).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate enrollment or notifications after completion', async () => {
    const { repository, transaction } = setup(false);

    await expect(
      repository.completePaymentAndCreateEnrollment(
        'payment-1',
        'user-1',
        'course-1',
        'pi_1',
      ),
    ).resolves.toMatchObject({
      completedNow: false,
      enrollmentCreated: false,
    });

    expect(transaction.enrollment.upsert).not.toHaveBeenCalled();
    expect(transaction.notification.createMany).not.toHaveBeenCalled();
  });
});
