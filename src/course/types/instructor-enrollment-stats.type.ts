import { CourseStatus } from '@prisma/client';
export type InstructorCourseEnrollmentStats = {
  id: string;
  title: string;
  status: CourseStatus;
  studentsCount: number;
};

export type InstructorEnrollmentStats = {
  totalCourses: number;
  totalEnrollments: number;
  courses: InstructorCourseEnrollmentStats[];
};
