import { Injectable } from '@nestjs/common';
import { LessonRepository } from './lesson.repo';
import { Lesson } from './entities/lesson.entity';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Prisma } from '@prisma/client';
import { Section } from 'src/section/entities/section.entity';
import { syncCourseContentStats } from 'src/common/prisma/course-stats';

export type PreviewLesson = Prisma.LessonGetPayload<{
  include: {
    media: true;
  };
}>;
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
  async create(data: CreateLessonDto, sectionId: string): Promise<Lesson> {
    return this.prismaService.$transaction(
      async (transaction) => {
        const section = await transaction.section.findUniqueOrThrow({
          where: { id: sectionId },
          select: { courseId: true },
        });
        const lastLesson = await transaction.lesson.findFirst({
          where: { sectionId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        const lesson = await transaction.lesson.create({
          data: {
            ...data,
            sectionId,
            order: (lastLesson?.order ?? 0) + 1,
          },
        });
        await syncCourseContentStats(transaction, section.courseId);
        return lesson;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  async update(id: string, data: UpdateLessonDto): Promise<Lesson> {
    return this.prismaService.$transaction(async (transaction) => {
      const existing = await transaction.lesson.findUniqueOrThrow({
        where: { id },
        select: { section: { select: { courseId: true } } },
      });
      const lesson = await transaction.lesson.update({
        where: { id },
        data,
      });
      await syncCourseContentStats(transaction, existing.section.courseId);
      return lesson;
    });
  }
  async remove(id: string): Promise<Lesson> {
    return this.prismaService.$transaction(async (transaction) => {
      const existing = await transaction.lesson.findUniqueOrThrow({
        where: { id },
        select: {
          order: true,
          sectionId: true,
          section: { select: { courseId: true } },
        },
      });
      const lesson = await transaction.lesson.delete({ where: { id } });
      await transaction.lesson.updateMany({
        where: {
          sectionId: existing.sectionId,
          order: { gt: existing.order },
        },
        data: { order: { decrement: 1 } },
      });
      await syncCourseContentStats(transaction, existing.section.courseId);
      return lesson;
    });
  }
  async findPreviewLessonsByCourseId(courseId: string): Promise<{
    lessons: PreviewLesson[];
    count: number;
  }> {
    const where: Prisma.LessonWhereInput = {
      isPreview: true,
      section: {
        courseId,
      },
    };

    const [lessons, count] = await this.prismaService.$transaction([
      this.prismaService.lesson.findMany({
        where,
        include: {
          media: true,
        },
        orderBy: [
          {
            section: {
              order: 'asc',
            },
          },
          {
            order: 'asc',
          },
        ],
      }),
      this.prismaService.lesson.count({
        where,
      }),
    ]);

    return { lessons, count };
  }
}
