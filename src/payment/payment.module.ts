import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CourseModule } from 'src/course/course.module';
import { PaymentRepository } from './payment.repo';
import { PrismaPaymentRepository } from './payment-prisma.repo';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: PaymentRepository,
      useClass: PrismaPaymentRepository,
    },
  ],
  exports: [PaymentService],
  imports: [CourseModule],
})
export class PaymentModule {}
