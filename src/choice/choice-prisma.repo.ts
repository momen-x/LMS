import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ChoiceRepository } from './choice.repo';
import { CreateChoiceDto } from './dto/create-choice.dto';
import { Choice } from './entities/choice.entity';
import { UpdateChoiceDto } from './dto/update-choice.dto';

@Injectable()
export class PrismaChoiceRepository implements ChoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    createChoiceDto: CreateChoiceDto,
    questionId: string,
  ): Promise<Choice> {
    return this.prisma.choice.create({
      data: {
        ...createChoiceDto,
        questionId,
      },
    });
  }

  findAll(): Promise<Choice[]> {
    return this.prisma.choice.findMany();
  }
  findByQuestionId(questionId: string): Promise<Choice[]> {
    return this.prisma.choice.findMany({
      where: {
        questionId,
      },
    });
  }
  findOne(id: string): Promise<Choice | null> {
    return this.prisma.choice.findUnique({
      where: {
        id,
      },
    });
  }
  update(id: string, updateChoiceDto: UpdateChoiceDto): Promise<Choice> {
    return this.prisma.choice.update({
      where: {
        id,
      },
      data: {
        ...updateChoiceDto,
      },
    });
  }
  delete(id: string): Promise<Choice> {
    return this.prisma.choice.delete({
      where: {
        id,
      },
    });
  }
  countByQuestionId(questionId: string): Promise<number> {
    return this.prisma.choice.count({
      where: {
        questionId,
      },
    });
  }
  findCorrectChoice(
    questionId: string,
    excludedChoiceId?: string,
  ): Promise<Choice | null> {
    return this.prisma.choice.findFirst({
      where: {
        questionId,
        isCorrect: true,
        ...(excludedChoiceId && {
          id: {
            not: excludedChoiceId,
          },
        }),
      },
    });
  }
}
