import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'get all questions' })
  @ApiOperation({ summary: 'get all questions' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll() {
    return this.quizService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'get one question' })
  @ApiOperation({ summary: 'get one question' })
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.quizService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiOperation({ summary: 'Update quiz' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.quizService.update(id, user.sub, user.role, updateQuizDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiOperation({ summary: 'Delete quiz' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.quizService.remove(id, user.sub, user.role);
  }
}
