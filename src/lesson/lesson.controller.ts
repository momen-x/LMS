import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('lesson')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post(':sectionId/lessons')
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiOperation({ summary: 'Create a new lesson' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
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
  @ApiResponse({ status: 200, description: 'Get all lessons' })
  @ApiOperation({ summary: 'Get all lessons' })
  findAll() {
    return this.lessonService.findAll();
  }
  @Get('section/:sectionId')
  @ApiResponse({ status: 200, description: 'Get lessons by section id' })
  @ApiOperation({ summary: 'Get lessons by section id' })
  findBySectionId(@Param('sectionId') sectionId: string) {
    return this.lessonService.findBySectionId(sectionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  @ApiOperation({ summary: 'Update a lesson' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.lessonService.update(id, user.sub, user.role, updateLessonDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  @ApiOperation({ summary: 'Delete a lesson' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.lessonService.remove(id, user.sub, user.role);
  }
}
