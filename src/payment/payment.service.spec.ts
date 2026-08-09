import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const course = {
    id: 'course-1',
    title: 'NestJS',
    description: 'Course',
    price: 25,
  };
  const payment = {
    id: 'payment-1',
    studentId: 'user-1',
    courseId: course.id,
    amount: new Prisma.Decimal(25),
    currency: 'USD',
    status: PaymentStatus.pending,
    stripePaymentId: null,
    stripeSessionId: 'cs_1',
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const paidSession = {
    id: 'cs_1',
    status: 'complete',
    payment_status: 'paid',
    payment_intent: 'pi_1',
    client_reference_id: 'user-1',
    metadata: { userId: 'user-1', courseId: 'course-1' },
  };

  function setup() {
    const paymentRepo = {
      create: jest.fn().mockResolvedValue(payment),
      findByStripeSessionId: jest.fn().mockResolvedValue(payment),
      findPendingPayment: jest.fn().mockResolvedValue(null),
      completePaymentAndCreateEnrollment: jest.fn().mockResolvedValue({
        payment: { ...payment, status: PaymentStatus.completed },
        completedNow: true,
        enrollmentCreated: true,
      }),
      markAsFailed: jest.fn(),
      markAsExpired: jest.fn(),
    };
    const courseService = { findOne: jest.fn().mockResolvedValue(course) };
    const enrollmentService = {
      create: jest.fn().mockResolvedValue({ id: 'enrollment-free' }),
      validateEnrollmentCreation: jest.fn().mockResolvedValue({}),
      isEnrolled: jest.fn().mockResolvedValue(true),
    };
    const config = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_fake',
          STRIPE_WEBHOOK_SECRET: 'whsec_fake',
          FRONTEND_URL: 'http://localhost:3000',
          STRIPE_CURRENCY: 'USD',
        };
        return values[key];
      }),
    };
    const service = new PaymentService(
      config as never,
      paymentRepo,
      courseService as never,
      enrollmentService as never,
    );
    const stripe = {
      checkout: {
        sessions: {
          retrieve: jest.fn(),
          create: jest
            .fn()
            .mockResolvedValue({ id: 'cs_new', url: 'https://checkout/new' }),
        },
      },
      webhooks: { constructEvent: jest.fn() },
    };
    Object.assign(service as object, { stripe });
    return { service, paymentRepo, courseService, enrollmentService, stripe };
  }

  it('enrolls a free course directly without creating a Stripe session', async () => {
    const { service, courseService, enrollmentService, stripe } = setup();
    courseService.findOne.mockResolvedValue({ ...course, price: 0 });

    await expect(service.create('user-1', course.id)).resolves.toEqual({
      id: 'enrollment-free',
    });
    expect(enrollmentService.create).toHaveBeenCalledWith({
      studentId: 'user-1',
      courseId: 'course-1',
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('reconciles a paid pending checkout instead of creating another session', async () => {
    const { service, stripe, paymentRepo } = setup();
    paymentRepo.findPendingPayment.mockResolvedValue(payment);
    stripe.checkout.sessions.retrieve.mockResolvedValue(paidSession);

    await expect(service.create('user-1', 'course-1')).resolves.toMatchObject({
      status: 'completed',
      courseId: 'course-1',
      isEnrollment: true,
    });
    expect(
      paymentRepo.completePaymentAndCreateEnrollment,
    ).toHaveBeenCalledTimes(1);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('returns pending for an open unpaid session', async () => {
    const { service, stripe, enrollmentService } = setup();
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      ...paidSession,
      status: 'open',
      payment_status: 'unpaid',
      payment_intent: null,
    });
    enrollmentService.isEnrolled.mockResolvedValue(false);

    await expect(
      service.verifyCheckoutSession('cs_1', 'user-1'),
    ).resolves.toEqual({
      status: 'pending',
      courseId: 'course-1',
      isEnrollment: false,
    });
  });

  it('completes a paid session and returns its enrollment', async () => {
    const { service, stripe, paymentRepo } = setup();
    stripe.checkout.sessions.retrieve.mockResolvedValue(paidSession);

    await expect(
      service.verifyCheckoutSession('cs_1', 'user-1'),
    ).resolves.toEqual({
      status: 'completed',
      courseId: 'course-1',
      isEnrollment: true,
    });
    expect(paymentRepo.completePaymentAndCreateEnrollment).toHaveBeenCalledWith(
      'payment-1',
      'user-1',
      'course-1',
      'pi_1',
    );
  });

  it('rejects a session owned by another user', async () => {
    const { service, stripe, paymentRepo } = setup();
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      ...paidSession,
      client_reference_id: 'user-2',
      metadata: { userId: 'user-2', courseId: 'course-1' },
    });

    await expect(
      service.verifyCheckoutSession('cs_1', 'user-1'),
    ).rejects.toThrow(ForbiddenException);
    expect(paymentRepo.findByStripeSessionId).not.toHaveBeenCalled();
  });

  it('returns not found when Stripe cannot find the session', async () => {
    const { service, stripe } = setup();
    stripe.checkout.sessions.retrieve.mockRejectedValue({
      code: 'resource_missing',
    });

    await expect(
      service.verifyCheckoutSession('missing', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it.each([
    ['webhook then verify', true],
    ['verify then webhook', false],
  ])('%s remains idempotent', async (_name, webhookFirst) => {
    const { service, stripe, paymentRepo } = setup();
    stripe.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: paidSession },
    });
    paymentRepo.completePaymentAndCreateEnrollment
      .mockResolvedValueOnce({
        payment: { ...payment, status: PaymentStatus.completed },
        completedNow: true,
        enrollmentCreated: true,
      })
      .mockResolvedValue({
        payment: { ...payment, status: PaymentStatus.completed },
        completedNow: false,
        enrollmentCreated: false,
      });
    const webhook = () =>
      service.handleWebhook({
        headers: { 'stripe-signature': 'signature' },
        rawBody: Buffer.from('{}'),
      } as never);
    const verify = () => service.verifyCheckoutSession('cs_1', 'user-1');

    if (webhookFirst) {
      await webhook();
      await verify();
    } else {
      await verify();
      await webhook();
    }

    expect(
      paymentRepo.completePaymentAndCreateEnrollment,
    ).toHaveBeenCalledTimes(2);
  });

  it('allows concurrent webhook and verify calls to share the idempotent completion', async () => {
    const { service, stripe, paymentRepo } = setup();
    stripe.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: paidSession },
    });

    await Promise.all([
      service.handleWebhook({
        headers: { 'stripe-signature': 'signature' },
        rawBody: Buffer.from('{}'),
      } as never),
      service.verifyCheckoutSession('cs_1', 'user-1'),
    ]);

    expect(
      paymentRepo.completePaymentAndCreateEnrollment,
    ).toHaveBeenCalledTimes(2);
  });
});
