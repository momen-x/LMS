import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { UsersEnrollmentCourse } from './enrollment-users-course.controller';
import { PrismaEnrollmentRepository } from './enrollment-prisma.repo';
import { EnrollmentRepository } from './enrollment.repo';
import { UsersModule } from 'src/users/users.module';
import { CourseModule } from 'src/course/course.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  controllers: [EnrollmentController, UsersEnrollmentCourse],
  providers: [
    EnrollmentService,
    { provide: EnrollmentRepository, useClass: PrismaEnrollmentRepository },
  ],
  exports: [EnrollmentService],
  imports: [UsersModule, CourseModule, NotificationModule],
})
export class EnrollmentModule {}
