import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Review } from './entities/review.entity';
import { ReviewRepository } from './review.repo';
import {
  CourseRatingAggregate,
  CreateReviewInput,
  ReviewPage,
  ReviewWithStudent,
  UpdateReviewInput,
} from './types/review.type';

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    studentId: string,
    courseId: string,
    data: CreateReviewInput,
  ): Promise<Review> {
    return this.prisma.$transaction(async (transaction) => {
      const review = await transaction.review.create({
        data: { studentId, courseId, ...data },
      });
      await this.refreshCourseRating(transaction, courseId);
      return review;
    });
  }

  findById(id: string): Promise<Review | null> {
    return this.prisma.review.findUnique({ where: { id } });
  }

  findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
  }

  async findByCourseId(
    courseId: string,
    page: number,
    limit: number,
  ): Promise<ReviewPage<ReviewWithStudent>> {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { courseId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      this.prisma.review.count({ where: { courseId } }),
    ]);
    return { data, total };
  }

  async findByStudentId(
    studentId: string,
    page: number,
    limit: number,
  ): Promise<ReviewPage> {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { studentId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { studentId } }),
    ]);
    return { data, total };
  }

  update(id: string, data: UpdateReviewInput): Promise<Review> {
    return this.prisma.$transaction(async (transaction) => {
      const review = await transaction.review.update({ where: { id }, data });
      await this.refreshCourseRating(transaction, review.courseId);
      return review;
    });
  }

  delete(id: string): Promise<Review> {
    return this.prisma.$transaction(async (transaction) => {
      const review = await transaction.review.delete({ where: { id } });
      await this.refreshCourseRating(transaction, review.courseId);
      return review;
    });
  }

  async getCourseRatingAggregate(
    courseId: string,
  ): Promise<CourseRatingAggregate> {
    const aggregate = await this.prisma.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return {
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count._all,
    };
  }
  async getReviewByCourseAndStudent(
    courseId: string,
    studentId: string,
  ): Promise<Review | null> {
    return this.prisma.review.findFirst({
      where: { courseId, studentId },
    });
  }

  private async refreshCourseRating(
    transaction: Prisma.TransactionClient,
    courseId: string,
  ): Promise<void> {
    const aggregate = await transaction.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
    });
    await transaction.course.update({
      where: { id: courseId },
      data: { averageRating: aggregate._avg.rating ?? 0 },
    });
  }
}
