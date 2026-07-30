import { CourseLevel, CourseStatus, UserRole } from '@prisma/client';
import { Enrollment } from '../entities/enrollment.entity';

export type CreateEnrollmentInput = {
  studentId: string;
  courseId: string;
};

export type SafeEnrollmentStudent = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  createdAt: Date;
};

export type EnrollmentWithCourse = Enrollment & {
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
    level: CourseLevel;
    status: CourseStatus;
    instructor: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
};
