import { Injectable } from '@nestjs/common';
import { QuestionRepository } from './question.repo';
import { CreateQuestionDto } from './dto/create-question.dto';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Question } from './entities/question.entity';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class PrismaQuestionRepository implements QuestionRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(data: CreateQuestionDto, quizId: string): Promise<Question> {
    return this.prisma.question.create({
      data: { ...data, quizId },
    });
  }
  find(): Promise<Question[]> {
    return this.prisma.question.findMany();
  }
  findOne(id: string): Promise<Question | null> {
    return this.prisma.question.findUnique({ where: { id } });
  }
  findByQuizId(quizId: string): Promise<Question[]> {
    return this.prisma.question.findMany({ where: { quizId } });
  }
  update(id: string, question: UpdateQuestionDto): Promise<Question> {
    return this.prisma.question.update({ where: { id }, data: question });
  }
  delete(id: string): Promise<Question> {
    return this.prisma.question.delete({
      where: {
        id,
      },
    });
  }
}
