/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable } from '@nestjs/common';
import { SectionRepository } from './section.repo';
import { Section } from './entities/section.entity';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateSectionInputs, UpdateCourseInputs } from './types/section.type';
import { Course } from 'src/course/entities/course.entity';
import { Prisma } from '@prisma/client';
import { syncCourseContentStats } from 'src/common/prisma/course-stats';

export type SectionWithCourse = Section & {
  course: Course;
};

@Injectable()
export class PrismaSectionRepository implements SectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSectionInputs, courseId: string): Promise<Section> {
    return this.prisma.$transaction(
      async (transaction) => {
        const lastSection = await transaction.section.findFirst({
          where: { courseId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        return transaction.section.create({
          data: { ...data, courseId, order: (lastSection?.order ?? 0) + 1 },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
  find(): Promise<Section[]> {
    return this.prisma.section.findMany();
  }
  async findById(id: string): Promise<SectionWithCourse | null> {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: { course: true },
    });
    if (!section) return null;
    return {
      ...section,
      course: {
        ...section.course,
        price: section.course.price.toNumber(),
        averageRating: section.course.averageRating.toNumber(),
      },
    } as SectionWithCourse;
  }
  findByCourseId(courseId: string): Promise<Section[]> {
    return this.prisma.section.findMany({
      where: { courseId },
      orderBy: {
        order: 'asc',
      },
    });
  }
  update(id: string, data: UpdateCourseInputs): Promise<Section> {
    return this.prisma.section.update({ where: { id }, data });
  }
  delete(id: string): Promise<Section> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.section.findUniqueOrThrow({
        where: { id },
        select: { courseId: true, order: true },
      });
      const section = await transaction.section.delete({ where: { id } });
      await transaction.section.updateMany({
        where: { courseId: existing.courseId, order: { gt: existing.order } },
        data: { order: { decrement: 1 } },
      });
      await syncCourseContentStats(transaction, existing.courseId);
      return section;
    });
  }
}
