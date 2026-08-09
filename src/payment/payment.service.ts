/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CourseService } from 'src/course/course.service';
import { PaymentRepository } from './payment.repo';
import { PaymentStatus, Prisma } from '@prisma/client';
import type { Request } from 'express';
import { EnrollmentService } from 'src/enrollment/enrollment.service';

export type CheckoutSessionStatus = {
  status: 'pending' | 'completed' | 'failed' | 'expired';
  courseId: string;
  isEnrollment: boolean;
  amount?: Prisma.Decimal;
  currency?: string;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;
  private FRONTEND_URL: string;
  private currency: string;
  constructor(
    private config: ConfigService,
    private readonly paymentRepo: PaymentRepository,
    private readonly courseService: CourseService,
    private readonly enrollmentService: EnrollmentService,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow('STRIPE_SECRET_KEY'));
    this.FRONTEND_URL = this.config.getOrThrow('FRONTEND_URL');
    this.currency = this.config.getOrThrow('STRIPE_CURRENCY');
  }
  async create(userId: string, courseId: string) {
    const course = await this.courseService.findOne(courseId);
    //user must enrollment for the course, even if it is free, in order for the system (back-end ) to track progress, complete the course, and generate certificates.

    if (Number(course.price) === 0) {
      return await this.enrollmentService.create({
        courseId,
        studentId: userId,
      });
    }
    await this.enrollmentService.validateEnrollmentCreation(userId, courseId);

    const existingPendingPayment = await this.paymentRepo.findPendingPayment(
      userId,
      courseId,
    );

    if (existingPendingPayment && existingPendingPayment.stripeSessionId) {
      try {
        const existingSession = await this.stripe.checkout.sessions.retrieve(
          existingPendingPayment.stripeSessionId,
        );
        if (existingSession.payment_status === 'paid') {
          const result =
            await this.completePaidCheckoutSession(existingSession);
          if (!result) {
            throw new NotFoundException('Local payment not found');
          }
          return {
            payment: result.payment,
            status: 'completed' as const,
            courseId,
            isEnrollment: true,
          };
        }
        if (existingSession.status === 'open' && existingSession.url) {
          return {
            payment: existingPendingPayment,
            checkoutUrl: existingSession.url,
          };
        }
        if (existingSession.status === 'expired') {
          await this.paymentRepo.markAsExpired(existingPendingPayment.id);
        } else {
          await this.paymentRepo.markAsFailed(existingPendingPayment.id);
        }
      } catch (error) {
        this.logger.warn(
          `Unable to reuse Stripe session ${existingPendingPayment.stripeSessionId}: ${this.errorMessage(error)}`,
        );
        await this.paymentRepo.markAsFailed(existingPendingPayment.id);
      }
    }
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      metadata: {
        userId,
        courseId,
      },
      line_items: [
        {
          price_data: {
            currency: this.currency,
            product_data: {
              name: course.title,
              description: course.description,
            },
            unit_amount: Math.round(Number(course.price) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: userId,
      success_url: `${this.FRONTEND_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.FRONTEND_URL}/payments/cancel`,
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }

    const payment = await this.paymentRepo.create(
      userId,
      courseId,
      new Prisma.Decimal(course.price),
      this.currency,
      session.id,
    );

    return {
      payment,
      checkoutUrl: session.url,
    };
  }
  async verifyCheckoutSession(
    sessionId: string,
    currentUserId: string,
  ): Promise<CheckoutSessionStatus> {
    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 'resource_missing'
      ) {
        throw new NotFoundException('Checkout session not found');
      }
      throw error;
    }

    const { userId, courseId } = this.validatedMetadata(session);
    if (
      userId !== currentUserId ||
      (session.client_reference_id &&
        session.client_reference_id !== currentUserId)
    ) {
      throw new ForbiddenException(
        'Checkout session does not belong to the current user',
      );
    }

    const payment = await this.paymentRepo.findByStripeSessionId(session.id);
    if (!payment) {
      throw new NotFoundException('Local payment not found');
    }
    if (payment.studentId !== currentUserId || payment.courseId !== courseId) {
      throw new ForbiddenException(
        'Checkout session does not match the current user payment',
      );
    }

    if (session.payment_status === 'paid') {
      await this.completePaidCheckoutSession(session);
    } else if (session.status === 'expired') {
      await this.paymentRepo.markAsExpired(payment.id);
    }

    const isEnrollment = await this.enrollmentService.isEnrolled(
      currentUserId,
      courseId,
    );
    const status = this.checkoutStatus(session, payment.status, isEnrollment);
    this.logger.log(
      `Checkout verification status=${status} sessionId=${session.id} paymentId=${payment.id} studentId=${currentUserId} courseId=${courseId}`,
    );
    return {
      status,
      courseId,
      isEnrollment,
      amount: payment.amount,
      currency: payment.currency,
    };
  }
  async handleWebhook(req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'];

    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Invalid stripe signature');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw webhook body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        this.config.getOrThrow('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (error) {
      this.logger.warn(
        `Stripe webhook verification failed: ${this.errorMessage(error)}`,
      );
      throw new BadRequestException('Invalid Stripe webhook payload');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'checkout.session.expired':
        await this.handleCheckoutExpired(event.data.object);
        break;
    }

    return {
      received: true,
    };
  }
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') {
      this.logger.warn(
        `Ignoring unpaid completed checkout session ${session.id}`,
      );
      return;
    }

    await this.completePaidCheckoutSession(session);
  }

  private async completePaidCheckoutSession(session: Stripe.Checkout.Session) {
    const { userId, courseId } = this.validatedMetadata(session);
    const stripePaymentId = this.paymentIntentId(session.payment_intent);
    if (!stripePaymentId) {
      throw new BadRequestException(
        'Paid checkout session has no valid PaymentIntent ID',
      );
    }
    const payment = await this.paymentRepo.findByStripeSessionId(session.id);
    if (!payment) {
      this.logger.warn(
        `Ignoring paid Stripe session without a local payment sessionId=${session.id}`,
      );
      return null;
    }
    if (payment.studentId !== userId || payment.courseId !== courseId) {
      throw new ForbiddenException(
        'Checkout metadata does not match the local payment',
      );
    }
    const result = await this.paymentRepo.completePaymentAndCreateEnrollment(
      payment.id,
      userId,
      courseId,
      stripePaymentId,
    );
    this.logger.log(
      `Payment completion completedNow=${result.completedNow} enrollmentCreated=${result.enrollmentCreated} sessionId=${session.id} paymentId=${payment.id} studentId=${userId} courseId=${courseId}`,
    );
    return result;
  }
  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const payment = await this.paymentRepo.findByStripeSessionId(session.id);

    if (!payment) {
      return;
    }

    await this.paymentRepo.markAsExpired(payment.id);
    this.logger.log(
      `Checkout expired sessionId=${session.id} paymentId=${payment.id} studentId=${payment.studentId} courseId=${payment.courseId}`,
    );
  }

  private paymentIntentId(
    paymentIntent: string | Stripe.PaymentIntent | null,
  ): string | null {
    if (typeof paymentIntent === 'string' && paymentIntent.length > 0) {
      return paymentIntent;
    }
    if (
      paymentIntent &&
      typeof paymentIntent === 'object' &&
      typeof paymentIntent.id === 'string' &&
      paymentIntent.id.length > 0
    ) {
      return paymentIntent.id;
    }
    return null;
  }

  private validatedMetadata(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId?.trim();
    const courseId = session.metadata?.courseId?.trim();
    if (!userId || !courseId) {
      throw new BadRequestException(
        'Checkout session has invalid payment metadata',
      );
    }
    return { userId, courseId };
  }

  private checkoutStatus(
    session: Stripe.Checkout.Session,
    localStatus: PaymentStatus,
    isEnrollment: boolean,
  ): CheckoutSessionStatus['status'] {
    if (session.payment_status === 'paid' && isEnrollment) return 'completed';
    if (session.status === 'expired' || localStatus === PaymentStatus.expired) {
      return 'expired';
    }
    if (
      localStatus === PaymentStatus.failed ||
      (session.status === 'complete' && session.payment_status === 'unpaid')
    ) {
      return 'failed';
    }
    return 'pending';
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
