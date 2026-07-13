import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { PrismaSectionRepository } from './section-prisma.repo';
import { SectionRepository } from './section.repo';
import { CourseModule } from 'src/course/course.module';

@Module({
  controllers: [SectionController],
  providers: [
    SectionService,
    { provide: SectionRepository, useClass: PrismaSectionRepository },
  ],
  imports: [CourseModule],
  exports: [SectionService],
})
export class SectionModule {}
