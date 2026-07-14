import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionService } from './question.service';

@Controller('quizzes/:quizId/questions')
export class QuizQuestionsController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Add new  question' })
  @ApiOperation({ summary: 'add new question' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  create(
    @Param('quizId') quizId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionService.create(
      user.sub,
      user.role,
      createQuestionDto,
      quizId,
    );
  }
  @Get()
  @ApiResponse({ status: 200, description: 'Get all questions' })
  @ApiOperation({ summary: 'get all questions' })
  @UseGuards(JwtAuthGuard)
  findByQuizId(@Param('quizId') quizId: string) {
    return this.questionService.findByQuizId(quizId);
  }
}
