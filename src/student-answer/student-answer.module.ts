import { Module } from '@nestjs/common';
import { StudentAnswerController } from './student-answer.controller';

@Module({
  controllers: [StudentAnswerController],
  providers: [],
  exports: [],
  imports: [],
})
export class StudentAnswerModule {}
