import { Injectable } from '@nestjs/common';
import { CourseRepository } from './course.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Course } from './entities/course.entity';
import { Course as PrismaCourse } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { CourseWhereFilter } from './types/course-query.type';
import { CreateCourseInput, UpdateCourseInput } from './types/course.type';

@Injectable()
export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaService) {}
  async find(skip: number, take: number): Promise<Course[]> {
    const courses = await this.prisma.course.findMany({
      where: { status: 'published' },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return courses.map(this.returnCourse);
  }
  async findById(id: string): Promise<Course | null> {
    const prismaCourse = await this.prisma.course.findUnique({
      where: { id },
    });
    return prismaCourse ? this.returnCourse(prismaCourse) : null;
  }
  async findByQuery(
    where: CourseWhereFilter,
    skip: number,
    take: number,
  ): Promise<{ courses: Course[]; total: number }> {
    const prismaWhere = where as Prisma.CourseWhereInput;
    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where: prismaWhere,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where: prismaWhere }),
    ]);
    // Convert PrismaCourse[] to Course[] entities
    return { courses: courses.map(this.returnCourse), total };
  }
  async create(
    instructorId: string,
    data: CreateCourseInput,
    thumbnailURL: string | null,
    thumbnailPublicId: string | null,
  ): Promise<Course> {
    const prismaCourse = await this.prisma.course.create({
      data: {
        ...data,
        instructorId,
        thumbnail: thumbnailURL,
        thumbnailPublicId,
      },
    });
    // Convert PrismaCourse to Course entity
    return this.returnCourse(prismaCourse);
  }
  async update(
    id: string,
    data: UpdateCourseInput,
    thumbnailURL: string | null,
    thumbnailPublicId?: string, // Added missing parameter from abstract class
  ): Promise<Course> {
    const prismaCourse = await this.prisma.course.update({
      where: { id },
      data: {
        ...data,
        thumbnail: thumbnailURL,
        ...(thumbnailPublicId !== undefined && { thumbnailPublicId }),
      },
    });
    return this.returnCourse(prismaCourse);
  }
  async delete(id: string): Promise<Course> {
    const prismaCourse = await this.prisma.course.update({
      where: { id },
      data: { status: 'archived' },
    });
    return this.returnCourse(prismaCourse);
  }
  private returnCourse(this: void, course: PrismaCourse): Course {
    return {
      ...course,
      price: course.price.toNumber(),
      averageRating: course.averageRating.toNumber(),
    };
  }
}
