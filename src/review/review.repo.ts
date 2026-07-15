import { Review } from './entities/review.entity';
import {
  CourseRatingAggregate,
  CreateReviewInput,
  ReviewPage,
  ReviewWithStudent,
  UpdateReviewInput,
} from './types/review.type';

export abstract class ReviewRepository {
  abstract create(
    studentId: string,
    courseId: string,
    data: CreateReviewInput,
  ): Promise<Review>;
  abstract findById(id: string): Promise<Review | null>;
  abstract findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Review | null>;
  abstract findByCourseId(
    courseId: string,
    page: number,
    limit: number,
  ): Promise<ReviewPage<ReviewWithStudent>>;
  abstract findByStudentId(
    studentId: string,
    page: number,
    limit: number,
  ): Promise<ReviewPage>;
  abstract update(id: string, data: UpdateReviewInput): Promise<Review>;
  abstract delete(id: string): Promise<Review>;
  abstract getCourseRatingAggregate(
    courseId: string,
  ): Promise<CourseRatingAggregate>;
}
