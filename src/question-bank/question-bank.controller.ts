import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import {
  MoveQuestionBankDto,
  UpdateQuestionBankDto,
} from './dto/update-question-bank.dto';
import { QuestionBankService } from './question-bank.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.instructor, UserRole.admin)
export class QuestionBankController {
  constructor(private readonly service: QuestionBankService) {}
  @Post('courses/:courseId/question-banks') create(
    @Body() dto: CreateQuestionBankDto,
    @Param('courseId') courseId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.create(user.sub, user.role, courseId, dto);
  }
  @Get('courses/:courseId/question-banks') findByCourse(
    @Param('courseId') courseId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.findByCourse(user.sub, user.role, courseId);
  }
  @Get('question-banks/:id') findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.findOne(id, user.sub, user.role);
  }
  @Patch('question-banks/:id/move') updateCourseId(
    @Param('id') id: string,
    @Body() dto: MoveQuestionBankDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.updateCourseId(id, user.sub, user.role, dto);
  }
  @Patch('question-banks/:id') update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionBankDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.update(id, user.sub, user.role, dto);
  }
  @Delete('question-banks/:id') remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.service.remove(id, user.sub, user.role);
  }
}
