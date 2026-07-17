/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable } from '@nestjs/common';
import { SectionRepository } from './section.repo';
import { Section } from './entities/section.entity';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateSectionInputs, UpdateCourseInputs } from './types/section.type';
import { Course } from 'src/course/entities/course.entity';

export type SectionWithCourse = Section & {
  course: Course;
};

@Injectable()
export class PrismaSectionRepository implements SectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSectionInputs, courseId: string): Promise<Section> {
    return this.prisma.section.create({ data: { ...data, courseId } });
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
  findByCourseAndOrder(
    courseId: string,
    order: number,
  ): Promise<Section | null> {
    return this.prisma.section.findFirst({
      where: { courseId, order },
    });
  }
  update(id: string, data: UpdateCourseInputs): Promise<Section> {
    return this.prisma.section.update({ where: { id }, data });
  }
  delete(id: string): Promise<Section> {
    return this.prisma.section.delete({
      where: { id },
    });
  }
}
