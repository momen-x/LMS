import { Module } from '@nestjs/common';
import { StudentAnswerService } from './student-answer.service';
import { StudentAnswerController } from './student-answer.controller';
import { StudentAnswerRepository } from './student-answer.repo';
import { PrismaStudentAnswerRepository } from './student-answer-prisma.repo';
import { QuestionModule } from 'src/question/question.module';

@Module({
  controllers: [StudentAnswerController],
  providers: [
    StudentAnswerService,
    {
      provide: StudentAnswerRepository,
      useClass: PrismaStudentAnswerRepository,
    },
  ],
  exports: [StudentAnswerRepository],
  imports: [QuestionModule],
})
export class StudentAnswerModule {}
