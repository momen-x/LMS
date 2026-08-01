import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaCourseRepository } from './course-prisma.repo';
import { CourseRepository } from './course.repo';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CategoryService } from 'src/category/category.service';
import { CategoryRepository } from 'src/category/category.repo';
import { PrismaCategoryRepository } from 'src/category/category-prisma.repo';
import { NotificationModule } from 'src/notification/notification.module';

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
  imports: [NotificationModule],
})
export class CourseModule {}
