import { Module } from '@nestjs/common';

import { QuizAttemptController } from './quiz-attempt.controller';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizAttemptRepository } from './quiz-attempt.repo';

import { QuizModule } from 'src/quiz/quiz.module';
import { QuestionModule } from 'src/question/question.module';
import { ChoiceModule } from 'src/choice/choice.module';
import { PrismaQuizAttemptRepository } from './quiz-attempt-prisma.repo';

@Module({
  imports: [QuizModule, QuestionModule, ChoiceModule],
  controllers: [QuizAttemptController],
  providers: [
    QuizAttemptService,
    {
      provide: QuizAttemptRepository,
      useClass: PrismaQuizAttemptRepository,
    },
  ],
  exports: [QuizAttemptService],
})
export class QuizAttemptModule {}
