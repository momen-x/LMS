import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { EnrollmentService } from './enrollment.service';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('courses/:courseId/enrollments')
export class UsersEnrollmentCourse {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new enrollment' })
  @ApiResponse({ status: 201, description: 'Enrollment created successfully' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  async create(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      user.sub,
      user.role,
      courseId,
    );
    return this.enrollmentService.create({
      studentId: userId,
      courseId,
    });
  }
  @Get()
  @ApiOperation({ summary: 'Get all enrollments for a course' })
  @ApiResponse({ status: 200, description: 'Get all enrollments for a course' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  async findCourseStudent(
    @Param('courseId') courseId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      user.sub,
      user.role,
      courseId,
    );
    return this.enrollmentService.findCourseStudent(courseId);
  }
  @Get('me')
  @ApiOperation({ summary: 'Get all enrollments for a course' })
  @ApiResponse({ status: 200, description: 'Get all enrollments for a course' })
  @UseGuards(JwtAuthGuard)
  getMyEnrollmentByCourse(
    @AuthenticatedUser() user: { sub: string },
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentService.findByStudentAndCourse(user.sub, courseId);
  }
}
