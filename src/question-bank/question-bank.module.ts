import { Module } from '@nestjs/common';
import { SectionModule } from 'src/section/section.module';
import { QuestionBankController } from './question-bank.controller';
import { PrismaQuestionBankRepository } from './question-bank-prisma.repo';
import { QuestionBankRepository } from './question-bank.repo';
import { QuestionBankService } from './question-bank.service';

@Module({
  imports: [SectionModule],
  controllers: [QuestionBankController],
  providers: [
    QuestionBankService,
    { provide: QuestionBankRepository, useClass: PrismaQuestionBankRepository },
  ],
  exports: [QuestionBankService],
})
export class QuestionBankModule {}
