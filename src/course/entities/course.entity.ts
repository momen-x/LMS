import { CourseLevel, CourseStatus } from '@prisma/client';

export class Course {
  constructor(
    public id: string,
    public categoryId: string,
    public instructorId: string,
    public title: string,
    public description: string,
    public thumbnail: string | null,
    public thumbnailPublicId: string | null,
    public price: number,
    public level: CourseLevel,
    public status: CourseStatus,
    public language: string,
    public averageRating: number,
    public totalStudents: number,
    public duration: number,
    public lessonsCount: number,
    public publishedAt: Date | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
//   category     Category
//   instructor   User          @relation("InstructorCourses", fields: [instructorId], references: [id])
//   sections     Section[]
//   enrollments  Enrollment[]
//   certificates Certificate[]
//   reviews      Review[]
//   payments     Payment[]
