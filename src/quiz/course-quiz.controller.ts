import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizService } from './quiz.service';

@Controller('courses/:courseId/quizzes')
export class CourseQuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiOperation({ summary: 'Create a quiz for a course' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  create(
    @Param('courseId') courseId: string,
    @Body() createQuizDto: CreateQuizDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.quizService.create(
      user.sub,
      user.role,
      createQuizDto,
      courseId,
    );
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Get all quizzes for a course' })
  @ApiOperation({ summary: 'Get all quizzes for a course' })
  @UseGuards(JwtAuthGuard)
  findByCourseId(
    @Param('courseId') courseId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.quizService.findByCourseId(user.sub, user.role, courseId);
  }
}
