import { UpdateEnrollmentProgressDto } from './dto/update-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';
import {
  CreateEnrollmentInput,
  EnrollmentWithCourse,
  LessonCompletionResult,
  SafeEnrollmentStudent,
} from './type/enrollment.type';

export abstract class EnrollmentRepository {
  abstract create(data: CreateEnrollmentInput): Promise<Enrollment>;
  abstract updateProgress(
    id: string,
    data: UpdateEnrollmentProgressDto,
  ): Promise<Enrollment>;
  abstract markCompleted(id: string): Promise<Enrollment>;
  abstract find(): Promise<Enrollment[]>;
  abstract findCourseStudent(
    courseId: string,
  ): Promise<(Enrollment & { student: SafeEnrollmentStudent })[]>;
  abstract findByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Promise<Enrollment | null>;
  abstract findByStudentAndCourseOrNull(
    studentId: string,
    courseId: string,
  ): Promise<Enrollment | null>;
  abstract findOne(id: string): Promise<Enrollment | null>;
  abstract hasCompletedPayment(
    studentId: string,
    courseId: string,
  ): Promise<boolean>;
  abstract delete(id: string): Promise<Enrollment>;
  abstract findUserEnrollments(
    userId: string,
    courseId?: string,
  ): Promise<EnrollmentWithCourse[]>;
  abstract getUserEnrollmentStats(userId: string): Promise<{
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageProgress: number;
  }>;
  abstract findLessonCourseId(lessonId: string): Promise<string | null>;
  abstract setLessonCompletion(
    enrollmentId: string,
    lessonId: string,
    completed: boolean,
  ): Promise<LessonCompletionResult>;
}
