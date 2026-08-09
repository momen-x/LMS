import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CourseModule } from 'src/course/course.module';
import { PaymentRepository } from './payment.repo';
import { PrismaPaymentRepository } from './payment-prisma.repo';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';

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
  imports: [CourseModule, EnrollmentModule],
})
export class PaymentModule {}
