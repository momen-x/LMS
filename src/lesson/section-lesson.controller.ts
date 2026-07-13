/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { CreateLessonDto } from './dto/create-lesson.dto'; // Added missing import

@Controller('sections/:sectionId/lessons')
export class SectionLessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiOperation({ summary: 'Create a new lesson' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  create(
    @Param('sectionId') sectionId: string,
    @Body() createLessonDto: CreateLessonDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.lessonService.create(
      user.sub,
      user.role,
      createLessonDto,
      sectionId,
    );
  }
  @Get()
  @ApiResponse({ status: 200, description: 'Get lessons by section id' })
  @ApiOperation({ summary: 'Get lessons by section id' })
  @UseGuards(JwtAuthGuard)
  findBySectionId(@Param('sectionId') sectionId: string) {
    return this.lessonService.findBySectionId(sectionId);
  }
  // @Patch(':id/order')
}
