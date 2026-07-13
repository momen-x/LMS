import { CourseLevel, CourseStatus } from '@prisma/client';

export type CourseWhereFilter = {
  status?: CourseStatus;
  title?: { contains: string; mode: 'insensitive' };
  categoryId?: string;
  level?: CourseLevel;
  language?: string;
  price?: { gte?: number; lte?: number };
};
