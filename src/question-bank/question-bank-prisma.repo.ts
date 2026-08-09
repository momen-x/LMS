import { Injectable } from '@nestjs/common';
import { QuestionBank } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { QuestionBankRepository } from './question-bank.repo';

@Injectable()
export class PrismaQuestionBankRepository implements QuestionBankRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(courseId: string, title: string): Promise<QuestionBank> {
    return this.prisma.questionBank.create({ data: { courseId, title } });
  }
  findOne(id: string): Promise<QuestionBank | null> {
    return this.prisma.questionBank.findUnique({ where: { id } });
  }
  findByCourseId(courseId: string): Promise<QuestionBank[]> {
    return this.prisma.questionBank.findMany({ where: { courseId } });
  }
  update(id: string, title: string): Promise<QuestionBank> {
    return this.prisma.questionBank.update({ where: { id }, data: { title } });
  }
  updateCourseId(id: string, courseId: string): Promise<QuestionBank> {
    return this.prisma.questionBank.update({
      where: { id },
      data: { courseId },
    });
  }
  findByCourseIdAndTitle(
    courseId: string,
    title: string,
  ): Promise<QuestionBank | null> {
    return this.prisma.questionBank.findFirst({
      where: { courseId, title },
    });
  }
  remove(id: string): Promise<QuestionBank> {
    return this.prisma.questionBank.delete({ where: { id } });
  }
  countQuestions(id: string): Promise<number> {
    return this.prisma.question.count({ where: { questionBankId: id } });
  }
}
