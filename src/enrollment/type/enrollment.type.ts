import { UserRole } from '@prisma/client';

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
