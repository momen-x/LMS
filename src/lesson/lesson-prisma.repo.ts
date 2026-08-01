import { Injectable } from '@nestjs/common';
import { LessonRepository } from './lesson.repo';
import { Lesson } from './entities/lesson.entity';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Prisma } from '@prisma/client';
import { Section } from 'src/section/entities/section.entity';
import { syncCourseContentStats } from 'src/common/prisma/course-stats';

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
  findOne(id: string): Promise<(Lesson & { section: Section }) | null> {
    return this.prismaService.lesson.findUnique({
      where: {
        id,
      },
      include: {
        section: true,
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
  async create(
    data: CreateLessonDto,
    sectionId: string,
    order: number,
  ): Promise<Lesson> {
    return this.prismaService.$transaction(async (transaction) => {
      const section = await transaction.section.findUniqueOrThrow({
        where: { id: sectionId },
        select: { courseId: true },
      });
      const lesson = await transaction.lesson.create({
        data: {
          ...data,
          sectionId,
          order,
          resources: data.resources as unknown as
            Prisma.InputJsonValue | undefined,
        },
      });
      await syncCourseContentStats(transaction, section.courseId);
      return lesson;
    });
  }
  async update(id: string, data: UpdateLessonDto): Promise<Lesson> {
    return this.prismaService.$transaction(async (transaction) => {
      const existing = await transaction.lesson.findUniqueOrThrow({
        where: { id },
        select: { section: { select: { courseId: true } } },
      });
      const lesson = await transaction.lesson.update({
        where: { id },
        data: {
          ...data,
          resources:
            data.resources === undefined
              ? undefined
              : (data.resources as unknown as Prisma.InputJsonValue),
        },
      });
      await syncCourseContentStats(transaction, existing.section.courseId);
      return lesson;
    });
  }
  async remove(id: string): Promise<Lesson> {
    return this.prismaService.$transaction(async (transaction) => {
      const existing = await transaction.lesson.findUniqueOrThrow({
        where: { id },
        select: { section: { select: { courseId: true } } },
      });
      const lesson = await transaction.lesson.delete({ where: { id } });
      await syncCourseContentStats(transaction, existing.section.courseId);
      return lesson;
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
