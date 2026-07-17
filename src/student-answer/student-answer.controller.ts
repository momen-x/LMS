import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { StudentAnswerService } from './student-answer.service';
import { CreateStudentAnswerDto } from './dto/create-student-answer.dto';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('student-answers')
export class StudentAnswerController {
  constructor(private readonly studentAnswerService: StudentAnswerService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Student answer saved successfully',
  })
  @ApiOperation({
    summary: 'Create or update the authenticated student answer',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.student)
  saveAnswer(
    @Body() dto: CreateStudentAnswerDto,
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.studentAnswerService.saveAnswer(user.sub, user.role, dto);
  }
}
