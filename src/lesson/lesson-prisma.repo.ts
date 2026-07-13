import { Injectable } from '@nestjs/common';
import { LessonRepository } from './lesson.repo';
import { Lesson } from './entities/lesson.entity';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

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
        resources: JSON.stringify(data.resources),
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
        resources: JSON.stringify(data.resources),
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
}
