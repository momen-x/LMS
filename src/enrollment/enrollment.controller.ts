import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';

import { EnrollmentService } from './enrollment.service';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user enrollments',
  })
  @ApiQuery({
    name: 'courseId',
    required: false,
    type: String,
    description: 'Filter current user enrollments by course ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user enrollments returned successfully',
  })
  @UseGuards(JwtAuthGuard)
  findMine(
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
    @Query('courseId') courseId?: string,
  ) {
    return this.enrollmentService.findUserEnrollments(user.sub, courseId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  async findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    await this.enrollmentService.validateInstructorOwnerEnrollment(
      user.sub,
      user.role,
      id,
    );

    return this.enrollmentService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  async remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    await this.enrollmentService.validateInstructorOwnerEnrollment(
      user.sub,
      user.role,
      id,
    );

    return this.enrollmentService.remove(id, user.role);
  }
}
