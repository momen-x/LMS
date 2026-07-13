import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SectionService } from './section.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { CreateSectionDto } from './dto/create-section.dto';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('courses/:courseId/sections')
export class CourseSectionController {
  constructor(private readonly sectionService: SectionService) {}
  @Post()
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiOperation({ summary: 'Create a new service' })
  @Roles(UserRole.instructor, UserRole.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Body() createSectionDto: CreateSectionDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
    @Param('courseId') courseId: string,
  ) {
    return this.sectionService.create(
      user.sub,
      user.role,
      createSectionDto,
      courseId,
    );
  }
  @Get()
  @ApiResponse({ status: 200, description: 'get section by course id' })
  @ApiOperation({ summary: 'get single section' })
  findByCourseId(@Param('courseId') courseId: string) {
    return this.sectionService.findByCourseId(courseId);
  }
}
