import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CourseService } from 'src/course/course.service';
import { PaymentRepository } from './payment.repo';
import { PaymentStatus, Prisma } from '@prisma/client';
import * as express from 'express';

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private FRONTEND_URL: string;
  private currency: string;
  constructor(
    private config: ConfigService,
    private readonly paymentRepo: PaymentRepository,
    private readonly courseService: CourseService,
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
    //check by user id if the user already in the course or not

    const existingPendingPayment = await this.paymentRepo.findPendingPayment(
      userId,
      courseId,
    );

    if (existingPendingPayment && existingPendingPayment.stripeSessionId) {
      const existingSession = await this.stripe.checkout.sessions.retrieve(
        existingPendingPayment.stripeSessionId,
      );

      return {
        payment: existingPendingPayment,
        checkoutUrl: existingSession.url,
      };
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
  async handleWebhook(req: express.Request) {
    const signature = req.headers['stripe-signature'];

    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Invalid stripe signature');
    }

    const event = this.stripe.webhooks.constructEvent(
      req['rawBody'],
      signature,
      this.config.getOrThrow('STRIPE_WEBHOOK_SECRET'),
    );

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
    const payment = await this.paymentRepo.findByStripeSessionId(session.id);
    if (!payment) {
      return;
    }
    if (payment.status === PaymentStatus.completed) {
      return;
    }

    await this.paymentRepo.markAsCompleted(
      payment.id,
      session.payment_intent as string,
    );

    // Here, after completing the Enrollment form, this user is registered for this course
  }
  private async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    const payment = await this.paymentRepo.findByStripeSessionId(session.id);

    if (!payment) {
      return;
    }

    await this.paymentRepo.markAsFailed(payment.id);
  }
}
