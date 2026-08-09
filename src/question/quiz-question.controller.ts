import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionService } from './question.service';

@Controller('question-banks/:questionBankId/questions')
export class QuestionBankQuestionsController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Add new  question' })
  @ApiOperation({ summary: 'add new question' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  create(
    @Param('questionBankId') questionBankId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    return this.questionService.create(
      user.sub,
      user.role,
      createQuestionDto,
      questionBankId,
    );
  }
  @Get()
  @ApiResponse({ status: 200, description: 'Get all questions in a question bank' })
  @ApiOperation({ summary: 'Get all questions in a question bank' })
  @UseGuards(JwtAuthGuard)
  findByQuestionBankId(
    @Param('questionBankId') questionBankId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.questionService.findByQuestionBankId(
      user.sub,
      user.role,
      questionBankId,
    );
  }
}
