import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { CourseSectionController } from './course-section.controller';

import { PrismaSectionRepository } from './section-prisma.repo';
import { SectionRepository } from './section.repo';
import { CourseModule } from 'src/course/course.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { NotificationRepository } from 'src/notification/notification.repo';
import { PrismaNotificationRepository } from 'src/notification/notification-prisma.repo';

@Module({
  controllers: [SectionController, CourseSectionController],
  providers: [
    SectionService,
    { provide: SectionRepository, useClass: PrismaSectionRepository },
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository,
    },
  ],
  imports: [CourseModule, EnrollmentModule],
  exports: [SectionService],
})
export class SectionModule {}
