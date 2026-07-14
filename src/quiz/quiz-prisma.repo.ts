import { Injectable } from '@nestjs/common';
import { QuizRepository } from './quiz.repo';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { Quiz } from './entities/quiz.entity';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class PrismaQuizRepository implements QuizRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(dto: CreateQuizDto, lessonId: string): Promise<Quiz> {
    return this.prisma.quiz.create({
      data: {
        ...dto,
        lessonId,
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
  findByLessonId(lessonId: string): Promise<Quiz[]> {
    return this.prisma.quiz.findMany({
      where: {
        lessonId,
      },
    });
  }
  update(id: string, dto: UpdateQuizDto): Promise<Quiz> {
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
