import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { QuestionRepository } from './question.repo';
import { PrismaQuestionRepository } from './question-prisma.repo';
import { QuestionBankModule } from 'src/question-bank/question-bank.module';
import { QuestionBankQuestionsController } from './quiz-question.controller';

@Module({
  controllers: [QuestionController, QuestionBankQuestionsController],
  providers: [
    QuestionService,
    {
      provide: QuestionRepository,
      useClass: PrismaQuestionRepository,
    },
  ],
  imports: [QuestionBankModule],
  exports: [QuestionService],
})
export class QuestionModule {}
