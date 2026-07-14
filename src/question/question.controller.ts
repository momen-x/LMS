import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({ status: 200, description: 'Get all questions' })
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.questionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({ status: 200, description: 'Get all questions' })
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.questionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update question' })
  @ApiResponse({ status: 200, description: 'Update question' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.questionService.update(
      id,
      user.sub,
      user.role,
      updateQuestionDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete question' })
  @ApiResponse({ status: 200, description: 'Delete question' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  remove(
    @Param('id') id: string,

    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.questionService.remove(id, user.sub, user.role);
  }
}
