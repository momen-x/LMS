import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { CourseQuizController } from './course-quiz.controller';
import { QuizRepository } from './quiz.repo';
import { PrismaQuizRepository } from './quiz-prisma.repo';
import { SectionModule } from 'src/section/section.module';
import { QuestionBankModule } from 'src/question-bank/question-bank.module';

@Module({
  controllers: [QuizController, CourseQuizController],
  providers: [
    QuizService,
    { provide: QuizRepository, useClass: PrismaQuizRepository },
  ],
  imports: [SectionModule, QuestionBankModule],
  exports: [QuizService],
})
export class QuizModule {}
