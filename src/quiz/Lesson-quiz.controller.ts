import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { QuizService } from './quiz.service';

@Controller('lessons/:lessonId/quizzes')
export class LessonQuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiOperation({ summary: 'Create a new quiz' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  create(
    @Param('lessonId') lessonId: string,
    @Body() createQuizDto: CreateQuizDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.quizService.create(
      user.sub,
      user.role,
      createQuizDto,
      lessonId,
    );
  }
  @Get()
  @ApiResponse({
    status: 200,
    description: 'get all quizzes by the lesson id',
  })
  @ApiOperation({ summary: 'get all quizzes by the lesson id' })
  @UseGuards(JwtAuthGuard)
  findByLessonId(
    @Param('lessonId') lessonId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.quizService.findByLessonId(user.sub, user.role, lessonId);
  }
}
