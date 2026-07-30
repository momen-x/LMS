import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { CertificateService } from './certificate.service';

@ApiTags('Certificates')
@Controller('courses/:courseId/certificates')
@UseGuards(JwtAuthGuard, RolesGuard) // global guard for all routes (except overridden)
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Post(':studentId')
  @Roles(UserRole.instructor, UserRole.admin)
  @ApiOperation({ summary: 'Create a certificate for a student' })
  @ApiResponse({ status: 201, description: 'Certificate created' })
  async create(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.certificateService.create(
      user.sub,
      user.role,
      studentId,
      courseId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  @ApiOperation({ summary: 'Get all certificates for a course' })
  @ApiResponse({ status: 200, description: 'List of certificates' })
  async findAllByCourse(
    @Param('courseId') courseId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.certificateService.findByCourseId(
      courseId,
      user.sub,
      user.role,
    );
  }
  @Get('search/by-number')
  @ApiOperation({ summary: 'Find a certificate by its number' })
  @ApiQuery({ name: 'certificateNumber', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Certificate found' })
  async findByCertificateNumber(
    @Param('courseId') courseId: string,
    @Query('certificateNumber') certificateNumber: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.certificateService.findByCertificateNumber(
      certificateNumber,
      user.sub,
      user.role,
      courseId,
    );
  }
  @Get('student/:studentId')
  @Roles(UserRole.instructor, UserRole.admin)
  @ApiOperation({ summary: 'Find certificates for a specific student' })
  @ApiResponse({
    status: 200,
    description: 'List of certificates for the student',
  })
  async findByStudentId(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.certificateService.findByStudentId(
      studentId,
      user.sub,
      user.role,
      courseId,
    );
  }

  @Get(':id')
  @Roles(UserRole.instructor, UserRole.admin)
  @ApiOperation({ summary: 'Get a single certificate by ID' })
  @ApiResponse({ status: 200, description: 'Certificate details' })
  async findOne(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.certificateService.findOne(id, user.sub, user.role, courseId);
  }

  @Delete(':id')
  @Roles(UserRole.instructor, UserRole.admin)
  @ApiOperation({ summary: 'Delete a certificate' })
  @ApiResponse({ status: 200, description: 'Certificate deleted' })
  async remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.certificateService.remove(id, user.sub, user.role, courseId);
  }
}
