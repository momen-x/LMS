import { Module } from '@nestjs/common';

import { QuizAttemptController } from './quiz-attempt.controller';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizAttemptRepository } from './quiz-attempt.repo';

import { QuizModule } from 'src/quiz/quiz.module';
import { PrismaQuizAttemptRepository } from './quiz-attempt-prisma.repo';

@Module({
  imports: [QuizModule],
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
