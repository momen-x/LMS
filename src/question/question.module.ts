import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { QuestionRepository } from './question.repo';
import { PrismaQuestionRepository } from './question-prisma.repo';
import { QuizModule } from 'src/quiz/quiz.module';
import { QuizQuestionsController } from './quiz-question.controller';

@Module({
  controllers: [QuestionController, QuizQuestionsController],
  providers: [
    QuestionService,
    {
      provide: QuestionRepository,
      useClass: PrismaQuestionRepository,
    },
  ],
  imports: [QuizModule],
  exports: [QuestionService],
})
export class QuestionModule {}
