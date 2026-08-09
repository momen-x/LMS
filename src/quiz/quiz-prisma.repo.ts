import { Injectable } from '@nestjs/common';
import { QuizRepository } from './quiz.repo';
import { Quiz } from './entities/quiz.entity';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateQUizInputs, UpdateQuizInputs } from './types/quiz.type';

@Injectable()
export class PrismaQuizRepository implements QuizRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(dto: CreateQUizInputs, courseId: string): Promise<Quiz> {
    return this.prisma.quiz.create({
      data: {
        ...dto,
        courseId,
      },
    });
  }
  find(): Promise<Quiz[]> {
    return this.prisma.quiz.findMany();
  }
  findOne(id: string): Promise<Quiz | null> {
    return this.prisma.quiz.findUnique({
      where: {
        id,
      },
    });
  }
  findByCourseId(courseId: string): Promise<Quiz[]> {
    return this.prisma.quiz.findMany({
      where: {
        courseId,
      },
    });
  }
  update(id: string, dto: UpdateQuizInputs): Promise<Quiz> {
    return this.prisma.quiz.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
    });
  }
  remove(id: string): Promise<Quiz> {
    return this.prisma.quiz.delete({
      where: {
        id,
      },
    });
  }
}
