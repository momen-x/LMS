import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { PrismaEnrollmentRepository } from './enrollment-prisma.repo';
import { EnrollmentRepository } from './enrollment.repo';
import { UsersModule } from 'src/users/users.module';
import { CourseModule } from 'src/course/course.module';
import { UsersEnrollmentCourse } from './users-enrollment-course.controller';

@Module({
  controllers: [EnrollmentController, UsersEnrollmentCourse],
  providers: [
    EnrollmentService,
    { provide: EnrollmentRepository, useClass: PrismaEnrollmentRepository },
  ],
  exports: [EnrollmentService],
  imports: [UsersModule, CourseModule],
})
export class EnrollmentModule {}
