import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all enrollments' })
  @ApiResponse({ status: 200, description: 'Get all enrollments' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll() {
    return this.enrollmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by id' })
  @ApiResponse({ status: 200, description: 'Get enrollment by id' })
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
  @ApiOperation({ summary: 'Delete enrollment by id' })
  @ApiResponse({ status: 200, description: 'Enrollment deleted successfully' })
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
