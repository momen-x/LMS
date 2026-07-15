/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CourseService } from 'src/course/course.service';
import { PaymentRepository } from './payment.repo';
import { PaymentStatus, Prisma } from '@prisma/client';
import type { Request } from 'express';
import { EnrollmentService } from 'src/enrollment/enrollment.service';

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
    if (Number(course.price) === 0) {
      throw new BadRequestException(
        'This course is free and does not require payment',
      );
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
        if (existingSession.status === 'open' && existingSession.url) {
          return {
            payment: existingPendingPayment,
            checkoutUrl: existingSession.url,
          };
        }
        if (existingSession.status === PaymentStatus.expired) {
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
      success_url: `${this.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.FRONTEND_URL}/payment/cancel`,
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

    const stripePaymentId = this.paymentIntentId(session.payment_intent);
    if (!stripePaymentId) {
      this.logger.error(
        `Checkout session ${session.id} has no valid PaymentIntent ID`,
      );
      return;
    }

    const payment = await this.paymentRepo.findByStripeSessionId(session.id);
    if (!payment) {
      this.logger.warn(
        `No local payment found for Stripe session ${session.id}`,
      );
      return;
    }

    await this.paymentRepo.completePaymentAndCreateEnrollment(
      payment.id,
      payment.studentId,
      payment.courseId,
      stripePaymentId,
    );
  }
  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const payment = await this.paymentRepo.findByStripeSessionId(session.id);

    if (!payment) {
      return;
    }

    await this.paymentRepo.markAsExpired(payment.id);
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

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
