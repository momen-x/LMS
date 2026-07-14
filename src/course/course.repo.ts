import { Course } from './entities/course.entity';
import { CourseWhereFilter } from './types/course-query.type';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

export abstract class CourseRepository {
  abstract find(skip: number, take: number): Promise<Course[]>;
  abstract findById(id: string): Promise<Course | null>;
  abstract findByQuery(
    where: CourseWhereFilter,
    skip: number,
    take: number,
  ): Promise<{ courses: Course[]; total: number }>;
  abstract create(
    instructorId: string,
    data: CreateCourseDto,
    thumbnailURL: string | null,
    thumbnailPublicId: string | null,
  ): Promise<Course>;
  abstract update(
    id: string,
    data: UpdateCourseDto,
    thumbnailURL: string | null,
    thumbnailPublicId?: string,
  ): Promise<Course>;
  abstract delete(id: string): Promise<Course>;
}
