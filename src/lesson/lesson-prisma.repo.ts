import { Injectable } from '@nestjs/common';
import { LessonRepository } from './lesson.repo';
import { Lesson } from './entities/lesson.entity';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly prismaService: PrismaService) {}
  find(): Promise<Lesson[]> {
    return this.prismaService.lesson.findMany({
      orderBy: {
        order: 'asc',
      },
    });
  }
  findOne(id: string): Promise<Lesson | null> {
    return this.prismaService.lesson.findUnique({
      where: {
        id,
      },
    });
  }
  findBySectionId(sectionId: string): Promise<Lesson[]> {
    return this.prismaService.lesson.findMany({
      where: {
        sectionId,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }
  create(
    data: CreateLessonDto,
    sectionId: string,
    order: number,
  ): Promise<Lesson> {
    return this.prismaService.lesson.create({
      data: {
        ...data,
        sectionId,
        order,
        resources: data.resources as unknown as
          Prisma.InputJsonValue | undefined,
      },
    });
  }
  update(id: string, data: UpdateLessonDto): Promise<Lesson> {
    return this.prismaService.lesson.update({
      where: {
        id,
      },
      data: {
        ...data,
        resources:
          data.resources === undefined
            ? undefined
            : (data.resources as unknown as Prisma.InputJsonValue),
      },
    });
  }
  remove(id: string): Promise<Lesson> {
    return this.prismaService.lesson.delete({
      where: {
        id,
      },
    });
  }
  async getMaxOrder(sectionId: string): Promise<number> {
    const result = await this.prismaService.lesson.aggregate({
      where: { sectionId },
      _max: { order: true },
    });

    return result._max.order ?? 0;
  }
}
