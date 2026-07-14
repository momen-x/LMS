import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { StudentAnswerService } from './student-answer.service';
import { CreateStudentAnswerDto } from './dto/create-student-answer.dto';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('student-answers')
export class StudentAnswerController {
  constructor(private readonly studentAnswerService: StudentAnswerService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Student answer saved successfully',
  })
  @ApiOperation({
    summary: 'Create or update student answer',
  })
  @UseGuards(JwtAuthGuard)
  saveAnswer(
    @Body() dto: CreateStudentAnswerDto,
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.studentAnswerService.saveAnswer(user.sub, dto);
  }
}
