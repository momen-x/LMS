import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { StudentAnswerRepository } from './student-answer.repo';
import { CreateStudentAnswerDto } from './dto/create-student-answer.dto';
import { StudentAnswer } from './entities/student-answer.entity';

@Injectable()
export class PrismaStudentAnswerRepository implements StudentAnswerRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    studentId: string,
    dto: CreateStudentAnswerDto,
  ): Promise<StudentAnswer> {
    return this.prisma.studentAnswer.create({
      data: {
        studentId,
        questionId: dto.questionId,
        choiceId: dto.choiceId,
      },
    });
  }

  findByStudentAndQuestion(
    studentId: string,
    questionId: string,
  ): Promise<StudentAnswer | null> {
    return this.prisma.studentAnswer.findUnique({
      where: {
        studentId_questionId: {
          studentId,
          questionId,
        },
      },
    });
  }

  updateChoice(id: string, choiceId: string): Promise<StudentAnswer> {
    return this.prisma.studentAnswer.update({
      where: {
        id,
      },
      data: {
        choiceId,
      },
    });
  }

  remove(id: string): Promise<StudentAnswer> {
    return this.prisma.studentAnswer.delete({
      where: {
        id,
      },
    });
  }

  findByStudentId(studentId: string): Promise<StudentAnswer[]> {
    return this.prisma.studentAnswer.findMany({
      where: {
        studentId,
      },
    });
  }

  findByQuestionId(questionId: string): Promise<StudentAnswer[]> {
    return this.prisma.studentAnswer.findMany({
      where: {
        questionId,
      },
    });
  }
}
