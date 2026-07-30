import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ChoiceService } from './choice.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { CreateChoiceDto } from './dto/create-choice.dto';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';

@Controller('questions/:questionId/choices')
export class QuestionChoiceController {
  constructor(private readonly choiceService: ChoiceService) {}
  @Post()
  @ApiResponse({ status: 201, description: 'create new choice question' })
  @ApiOperation({ summary: 'add new choice question' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  create(
    @Body() createChoiceDto: CreateChoiceDto,
    @Param('questionId') questionId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.choiceService.create(
      user.sub,
      user.role,
      createChoiceDto,
      questionId,
    );
  }
  @Get()
  @ApiResponse({
    status: 200,
    description: 'get all choices questions by question id',
  })
  @ApiOperation({ summary: 'get all choices questions by question id' })
  @UseGuards(JwtAuthGuard)
  findByQuestionId(
    @Param('questionId') questionId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.choiceService.findByQuestionId(user.sub, user.role, questionId);
  }
}
