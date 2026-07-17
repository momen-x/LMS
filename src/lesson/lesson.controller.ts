import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Lesson found successfully' })
  @ApiOperation({ summary: 'Get a lesson by id' })
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.lessonService.findOne(id, user.sub, user.role);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  @ApiOperation({ summary: 'Update a lesson' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
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
  @Roles(UserRole.instructor, UserRole.admin)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.lessonService.remove(id, user.sub, user.role);
  }
}
