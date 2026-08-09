import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { QuizAttemptService } from './quiz-attempt.service';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { SaveAttemptAnswerDto } from './dto/create-quiz-attempt.dto';

@ApiTags('Quiz Attempts')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.student)
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) {}

  @Post('quizzes/:quizId/attempts')
  @ApiOperation({
    summary: 'Start a new quiz attempt',
  })
  @ApiResponse({
    status: 201,
    description: 'Quiz attempt started successfully',
  })
  startAttempt(
    @Param('quizId') quizId: string,
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.quizAttemptService.startAttempt(user.sub, user.role, quizId);
  }

  @Get('quiz-attempts/:attemptId')
  getAttempt(
    @Param('attemptId') attemptId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.quizAttemptService.getAttempt(attemptId, user.sub, user.role);
  }

  @Put('quiz-attempts/:attemptId/answers/:questionId')
  @ApiOperation({
    summary: 'Create or update an answer in an active attempt',
  })
  saveAnswer(
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SaveAttemptAnswerDto,
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.quizAttemptService.saveAnswer(
      attemptId,
      questionId,
      user.sub,
      user.role,
      dto,
    );
  }

  @Post('quiz-attempts/:attemptId/submit')
  @ApiOperation({
    summary: 'Submit a quiz attempt and calculate its score',
  })
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.quizAttemptService.submitAttempt(
      attemptId,
      user.sub,
      user.role,
    );
  }

  @Get('quizzes/:quizId/my-attempts')
  @ApiOperation({
    summary: 'Get authenticated student quiz attempts',
  })
  findMyAttempts(
    @Param('quizId') quizId: string,
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.quizAttemptService.findMyAttempts(user.sub, user.role, quizId);
  }
}
