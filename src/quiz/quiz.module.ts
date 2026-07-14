import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { LessonModule } from 'src/lesson/lesson.module';
import { PrismaLessonRepository } from 'src/lesson/lesson-prisma.repo';
import { LessonService } from 'src/lesson/lesson.service';
import { LessonQuizController } from './Lesson-quiz.controller';

@Module({
  controllers: [QuizController, LessonQuizController],
  providers: [
    QuizService,
    { provide: LessonService, useClass: PrismaLessonRepository },
  ],
  imports: [LessonModule],
  exports: [QuizService],
})
export class QuizModule {}
