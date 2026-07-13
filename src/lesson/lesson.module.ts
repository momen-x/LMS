import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { LessonRepository } from './lesson.repo';
import { PrismaLessonRepository } from './lesson-prisma.repo';
import { SectionModule } from 'src/section/section.module';
import { SectionLessonController } from './section-lesson.controller';

@Module({
  controllers: [LessonController, SectionLessonController],
  providers: [
    LessonService,
    {
      provide: LessonRepository,
      useClass: PrismaLessonRepository,
    },
  ],
  imports: [SectionModule],
  exports: [LessonService],
})
export class LessonModule {}
