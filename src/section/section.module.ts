import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { CourseSectionController } from './course-section.controller';

import { PrismaSectionRepository } from './section-prisma.repo';
import { SectionRepository } from './section.repo';
import { CourseModule } from 'src/course/course.module';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';

@Module({
  controllers: [SectionController, CourseSectionController],
  providers: [
    SectionService,
    { provide: SectionRepository, useClass: PrismaSectionRepository },
  ],
  imports: [CourseModule, EnrollmentModule],
  exports: [SectionService],
})
export class SectionModule {}
