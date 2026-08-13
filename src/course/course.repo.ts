import { Course } from './entities/course.entity';
import { CourseWhereFilter } from './types/course-query.type';
import { CreateCourseInput, UpdateCourseInput } from './types/course.type';
import { InstructorEnrollmentStats } from './types/instructor-enrollment-stats.type';
import { CourseStatus } from '@prisma/client';
import { CourseLearning } from './types/course-learning.type';

export abstract class CourseRepository {
  abstract find(skip: number, take: number): Promise<Course[]>;
  abstract findById(id: string): Promise<Course | null>;
  abstract findLearningContent(
    courseId: string,
    userId: string,
  ): Promise<CourseLearning | null>;
  abstract findByQuery(
    where: CourseWhereFilter,
    skip: number,
    take: number,
  ): Promise<{ courses: Course[]; total: number }>;
  abstract findPendingCourses(): Promise<Course[]>;
  abstract findInstructorCourses(instructorId: string): Promise<Course[]>;
  abstract create(
    instructorId: string,
    data: CreateCourseInput,
    thumbnailURL: string | null,
    thumbnailPublicId: string | null,
  ): Promise<Course>;
  abstract update(
    id: string,
    data: UpdateCourseInput,
    thumbnailURL: string | null,
    thumbnailPublicId?: string,
  ): Promise<Course>;
  abstract updateCourseStatus(
    id: string,
    status: CourseStatus,
    publishedAt?: Date | null,
  ): Promise<Course>;
  abstract getSubmissionReadiness(id: string): Promise<{
    sectionsCount: number;
    lessonsCount: number;
  } | null>;
  abstract delete(id: string): Promise<Course>;
  abstract getInstructorEnrollmentStats(
    instructorId: string,
  ): Promise<InstructorEnrollmentStats>;
  abstract findHighRating(count?: number): Promise<Course[]>;
}
