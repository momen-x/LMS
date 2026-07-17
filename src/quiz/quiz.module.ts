import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { LessonModule } from 'src/lesson/lesson.module';
import { LessonQuizController } from './Lesson-quiz.controller';
import { QuizRepository } from './quiz.repo';
import { PrismaQuizRepository } from './quiz-prisma.repo';
import { SectionModule } from 'src/section/section.module';

@Module({
  controllers: [QuizController, LessonQuizController],
  providers: [
    QuizService,
    { provide: QuizRepository, useClass: PrismaQuizRepository },
  ],
  imports: [LessonModule, SectionModule],
  exports: [QuizService],
})
export class QuizModule {}
