import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaCourseRepository } from './course-prisma.repo';
import { CourseRepository } from './course.repo';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CategoryService } from 'src/category/category.service';
import { CategoryRepository } from 'src/category/category.repo';
import { PrismaCategoryRepository } from 'src/category/category-prisma.repo';

@Module({
  controllers: [CourseController],
  providers: [
    CourseService,
    CloudinaryService,
    CategoryService,
    { provide: CourseRepository, useClass: PrismaCourseRepository },
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
  ],
  exports: [CourseService],
})
export class CourseModule {}
