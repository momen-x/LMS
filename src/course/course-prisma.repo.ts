import { Injectable } from '@nestjs/common';
import { CourseRepository } from './course.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Course } from './entities/course.entity';
import { Prisma } from '@prisma/client';
import { CourseWhereFilter } from './types/course-query.type';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaService) {}
  async find(skip: number, take: number): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { status: 'published' },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<Course[]>;
  }
  async findById(id: string): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { id },
    }) as unknown as Promise<Course | null>;
  }
  async findByQuery(
    where: CourseWhereFilter,
    skip: number,
    take: number,
  ): Promise<{ courses: Course[]; total: number }> {
    const prismaWhere = where as Prisma.CourseWhereInput; // ← cast happens only here in repo
    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where: prismaWhere,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where: prismaWhere }),
    ]);
    return { courses: courses as unknown as Course[], total };
  }
  async create(
    instructorId: string,
    data: CreateCourseDto,
    thumbnailURL: string | null,
    thumbnailPublicId: string | null,
  ): Promise<Course> {
    return this.prisma.course.create({
      data: {
        ...data,
        instructorId,
        thumbnail: thumbnailURL,
        thumbnailPublicId,
      },
    }) as unknown as Promise<Course>;
  }
  async update(
    id: string,
    data: UpdateCourseDto,
    thumbnailURL: string | null,
  ): Promise<Course> {
    return this.prisma.course.update({
      where: { id },
      data: { ...data, thumbnail: thumbnailURL },
    }) as unknown as Promise<Course>;
  }
  async delete(id: string): Promise<Course> {
    return this.prisma.course.update({
      where: { id },
      data: { status: 'archived' },
    }) as unknown as Promise<Course>;
  }
}
