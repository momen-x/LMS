import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CourseModule } from 'src/course/course.module';
import { LessonController } from './lesson.controller';
import { LessonRepository } from './lesson.repo';
import { PrismaLessonRepository } from './lesson-prisma.repo';
import { SectionModule } from 'src/section/section.module';
import { NotificationRepository } from 'src/notification/notification.repo';
import { PrismaNotificationRepository } from 'src/notification/notification-prisma.repo';
import { SectionLessonController } from './section-lesson.controller';
import { LessonsControllerPreview } from './lessons-is-preview.controller';

@Module({
  controllers: [
    LessonController,
    SectionLessonController,
    LessonsControllerPreview,
  ],
  providers: [
    LessonService,
    {
      provide: LessonRepository,
      useClass: PrismaLessonRepository,
    },
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository,
    },
  ],
  imports: [SectionModule, CourseModule],
  exports: [LessonService],
})
export class LessonModule {}
