import { Injectable } from '@nestjs/common';
import { CourseRepository } from './course.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Course } from './entities/course.entity';
import { Course as PrismaCourse, CourseStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { CourseWhereFilter } from './types/course-query.type';
import { CreateCourseInput, UpdateCourseInput } from './types/course.type';
import { InstructorEnrollmentStats } from './types/instructor-enrollment-stats.type';

@Injectable()
export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaService) {}
  async find(skip: number, take: number): Promise<Course[]> {
    const courses = await this.prisma.course.findMany({
      where: { status: 'published' },
      skip,
      take: Number(take),
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
        take: Number(take),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where: prismaWhere }),
    ]);
    // Convert PrismaCourse[] to Course[] entities
    return { courses: courses.map(this.returnCourse), total };
  }
  async findPendingCourses(): Promise<Course[]> {
    const courses = await this.prisma.course.findMany({
      where: { status: 'pending_review' },
      // orderBy: { createdAt: 'desc' },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
      },
    });
    return courses.map(this.returnCourse);
  }
  async findInstructorCourses(instructorId: string): Promise<Course[]> {
    const courses = await this.prisma.course.findMany({
      where: {
        instructorId,
        status: { notIn: ['archived'] },
      },
    });
    return courses.map(this.returnCourse);
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
  async updateCourseStatus(
    id: string,
    status: CourseStatus,
    publishedAt?: Date | null,
  ): Promise<Course> {
    const prismaCourse = await this.prisma.course.update({
      where: { id },
      data: {
        status,
        ...(publishedAt !== undefined && { publishedAt }),
      },
    });
    return this.returnCourse(prismaCourse);
  }
  async getSubmissionReadiness(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        _count: { select: { sections: true } },
        sections: {
          select: { _count: { select: { lessons: true } } },
        },
      },
    });
    if (!course) return null;
    return {
      sectionsCount: course._count.sections,
      lessonsCount: course.sections.reduce(
        (total, section) => total + section._count.lessons,
        0,
      ),
    };
  }
  async delete(id: string): Promise<Course> {
    const prismaCourse = await this.prisma.course.update({
      where: { id },
      data: { status: 'archived' },
    });
    return this.returnCourse(prismaCourse);
  }
  async getInstructorEnrollmentStats(
    instructorId: string,
  ): Promise<InstructorEnrollmentStats> {
    const courses = await this.prisma.course.findMany({
      where: {
        instructorId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mappedCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      status: course.status,
      studentsCount: course._count.enrollments,
    }));

    return {
      totalCourses: mappedCourses.length,
      totalEnrollments: mappedCourses.reduce(
        (total, course) => total + course.studentsCount,
        0,
      ),
      courses: mappedCourses,
    };
  }

  private returnCourse(this: void, course: PrismaCourse): Course {
    return {
      ...course,
      price: course.price.toNumber(),
      averageRating: course.averageRating.toNumber(),
    };
  }
}
