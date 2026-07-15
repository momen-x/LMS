import { Module } from '@nestjs/common';
import { CourseModule } from 'src/course/course.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { NotificationModule } from 'src/notification/notification.module';
import { CourseReviewController } from './course-review.controller';
import { PrismaReviewRepository } from './review-prisma.repo';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './review.repo';
import { ReviewService } from './review.service';

@Module({
  imports: [CourseModule, EnrollmentModule, NotificationModule],
  controllers: [CourseReviewController, ReviewController],
  providers: [
    ReviewService,
    { provide: ReviewRepository, useClass: PrismaReviewRepository },
  ],
})
export class ReviewModule {}
