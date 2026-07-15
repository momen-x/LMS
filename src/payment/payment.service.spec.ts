import { BadRequestException } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const course = {
    id: 'course-1',
    title: 'NestJS',
    description: 'Course',
    price: 25,
  };
  const pendingPayment = {
    id: 'payment-1',
    studentId: 'user-1',
    courseId: course.id,
    amount: new Prisma.Decimal(25),
    currency: 'USD',
    status: PaymentStatus.pending,
    stripePaymentId: null,
    stripeSessionId: 'cs_old',
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function setup() {
    const paymentRepo: any = {
      create: jest.fn().mockResolvedValue(pendingPayment),
      findByStripeSessionId: jest.fn(),
      findPendingPayment: jest.fn().mockResolvedValue(null),
      completePaymentAndCreateEnrollment: jest.fn(),
      markAsFailed: jest.fn(),
      markAsExpired: jest.fn(),
    };
    const courseService = { findOne: jest.fn().mockResolvedValue(course) };
    const enrollmentService = {
      validateEnrollmentCreation: jest.fn().mockResolvedValue({}),
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
      paymentRepo as never,
      courseService as never,
      enrollmentService as never,
    );
    const stripe: any = {
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
    return { service, paymentRepo, enrollmentService, stripe };
  }

  it('rejects checkout when the user is already enrolled', async () => {
    const { service, enrollmentService, stripe } = setup();
    enrollmentService.validateEnrollmentCreation.mockRejectedValue(
      new BadRequestException('Already enrolled in this course'),
    );

    await expect(service.create('user-1', course.id)).rejects.toThrow(
      BadRequestException,
    );
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('reuses only an open pending session with a URL', async () => {
    const { service, paymentRepo, stripe } = setup();
    paymentRepo.findPendingPayment.mockResolvedValue(pendingPayment);
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      status: 'open',
      url: 'https://checkout/old',
    });

    await expect(service.create('user-1', course.id)).resolves.toMatchObject({
      checkoutUrl: 'https://checkout/old',
    });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('expires an unusable pending session and creates a new one', async () => {
    const { service, paymentRepo, stripe } = setup();
    paymentRepo.findPendingPayment.mockResolvedValue(pendingPayment);
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      status: 'expired',
      url: null,
    });

    await expect(service.create('user-1', course.id)).resolves.toMatchObject({
      checkoutUrl: 'https://checkout/new',
    });
    expect(paymentRepo.markAsExpired).toHaveBeenCalledWith(pendingPayment.id);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('does not enroll an unpaid completed checkout', async () => {
    const { service, paymentRepo, stripe } = setup();
    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid',
          payment_status: 'unpaid',
          payment_intent: 'pi_1',
        },
      },
    });

    await service.handleWebhook({
      headers: { 'stripe-signature': 'signature' },
      rawBody: Buffer.from('{}'),
    } as never);

    expect(paymentRepo.findByStripeSessionId).not.toHaveBeenCalled();
    expect(
      paymentRepo.completePaymentAndCreateEnrollment,
    ).not.toHaveBeenCalled();
  });

  it('accepts an expanded PaymentIntent and reprocesses duplicate delivery', async () => {
    const { service, paymentRepo, stripe } = setup();
    paymentRepo.findByStripeSessionId.mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.completed,
    });
    stripe.webhooks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_old',
          payment_status: 'paid',
          payment_intent: { id: 'pi_1' },
        },
      },
    });
    const request = {
      headers: { 'stripe-signature': 'signature' },
      rawBody: Buffer.from('{}'),
    } as never;

    await service.handleWebhook(request);
    await service.handleWebhook(request);

    expect(
      paymentRepo.completePaymentAndCreateEnrollment,
    ).toHaveBeenCalledTimes(2);
    expect(paymentRepo.completePaymentAndCreateEnrollment).toHaveBeenCalledWith(
      'payment-1',
      'user-1',
      'course-1',
      'pi_1',
    );
  });
});
