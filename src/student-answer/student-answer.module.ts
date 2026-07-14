import { Module } from '@nestjs/common';
import { StudentAnswerService } from './student-answer.service';
import { StudentAnswerController } from './student-answer.controller';
import { StudentAnswerRepository } from './student-answer.repo';
import { PrismaStudentAnswerRepository } from './student-answer-prisma.repo';
import { ChoiceModule } from 'src/choice/choice.module';

@Module({
  controllers: [StudentAnswerController],
  providers: [
    StudentAnswerService,
    {
      provide: StudentAnswerRepository,
      useClass: PrismaStudentAnswerRepository,
    },
  ],
  exports: [StudentAnswerService],
  imports: [ChoiceModule],
})
export class StudentAnswerModule {}
