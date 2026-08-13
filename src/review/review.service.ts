import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, UserRole } from '@prisma/client';
import { CourseService } from 'src/course/course.service';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { NotificationsService } from 'src/notification/notification.service';
import { PaginatedResult } from 'src/utils/pagination-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewRepository } from './review.repo';
import { ReviewWithStudent } from './types/review.type';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly enrollmentService: EnrollmentService,
    private readonly courseService: CourseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    courseId: string,
    data: CreateReviewDto,
  ): Promise<Review> {
    const course = await this.courseService.findOne(courseId);
    if (course.instructorId === userId) {
      throw new ForbiddenException('You cannot review your own course');
    }
    try {
      const enrollment = await this.enrollmentService.findByStudentAndCourse(
        userId,
        courseId,
      );
      if (enrollment && enrollment.progress < 50) {
        throw new ForbiddenException(
          'You must complete at least 50% of the course to review it',
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ForbiddenException(
          'You must be enrolled in the course to review it',
        );
      }
      throw error;
    }
    if (await this.reviewRepository.findByStudentAndCourse(userId, courseId)) {
      throw new ConflictException('You have already reviewed this course');
    }

    let review: Review;
    try {
      review = await this.reviewRepository.create(userId, courseId, data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You have already reviewed this course');
      }
      throw error;
    }

    try {
      await this.notificationsService.create({
        userId: course.instructorId,
        title: 'New course review',
        text: `A new review was added to ${course.title}.`,
        type: NotificationType.info,
      });
    } catch (error) {
      this.logger.warn(
        `Review ${review.id} was created but its notification failed: ${this.errorMessage(error)}`,
      );
    }
    return review;
  }

  async findByCourseId(
    courseId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ReviewWithStudent>> {
    await this.courseService.findOne(courseId);
    const result = await this.reviewRepository.findByCourseId(
      courseId,
      page,
      limit,
    );
    return this.toPaginated(result.data, result.total, page, limit);
  }

  async findMine(
    studentId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Review>> {
    const result = await this.reviewRepository.findByStudentId(
      studentId,
      page,
      limit,
    );
    return this.toPaginated(result.data, result.total, page, limit);
  }
  async findByStudentAndCourse(studentId: string, courseId: string) {
    const review = await this.reviewRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }
  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async update(
    id: string,
    studentId: string,
    data: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.findOne(id);
    if (review.studentId !== studentId) {
      throw new ForbiddenException('You can update only your own reviews');
    }
    return this.reviewRepository.update(id, data);
  }

  async delete(id: string, userId: string, role: UserRole): Promise<Review> {
    const review = await this.findOne(id);
    if (review.studentId !== userId && role !== UserRole.admin) {
      throw new ForbiddenException('You cannot delete this review');
    }
    return this.reviewRepository.delete(id);
  }

  private toPaginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
