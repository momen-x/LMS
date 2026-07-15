import { CourseLevel } from '@prisma/client';

export type CreateCourseInput = {
  categoryId: string;
  title: string;
  description: string;
  price: number;
  level: CourseLevel;
  thumbnail?: string;
};
export type UpdateCourseInput = Partial<CreateCourseInput>;
