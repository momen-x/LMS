import { Module } from '@nestjs/common';
import { ChoiceService } from './choice.service';
import { ChoiceController } from './choice.controller';
import { QuestionChoiceController } from './question-choices.controller';
import { QuestionModule } from 'src/question/question.module';
import { PrismaChoiceRepository } from './choice-prisma.repo';
import { ChoiceRepository } from './choice.repo';

@Module({
  controllers: [ChoiceController, QuestionChoiceController],
  providers: [
    ChoiceService,
    { provide: ChoiceRepository, useClass: PrismaChoiceRepository },
  ],
  exports: [ChoiceService],
  imports: [QuestionModule],
})
export class ChoiceModule {}
