import { CourseLevel, CourseStatus } from '@prisma/client';

export class Course {
  constructor(
    public categoryId: string,
    public id: string,
    public instructorId: string,
    public title: string,
    public description: string,
    public thumbnail: string | null,
    public price: number,
    public level: CourseLevel,
    public status: CourseStatus,
    public language: string,
    public averageRating: number,
    public createdAt: Date,
    public totalStudents: number,
    public updatedAt: Date,
    public duration: number,
    public lessonsCount: number,
    public publishedAt: Date | null,

    //   category     Category
    //   instructor   User          @relation("InstructorCourses", fields: [instructorId], references: [id])
    //   sections     Section[]
    //   enrollments  Enrollment[]
    //   certificates Certificate[]
    //   reviews      Review[]
    //   payments     Payment[]
  ) {}
}
