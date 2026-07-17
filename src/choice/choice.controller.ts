import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ChoiceService } from './choice.service';
import { UpdateChoiceDto } from './dto/update-choice.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';

@Controller('choices')
export class ChoiceController {
  constructor(private readonly choiceService: ChoiceService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'get all choice questions' })
  @ApiOperation({ summary: 'get all choice questions' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll() {
    return this.choiceService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'get choice question by id' })
  @ApiOperation({ summary: 'get choice question by id' })
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.choiceService.findOne(id, user.sub, user.role);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'update choice question' })
  @ApiOperation({ summary: 'update choice question' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  update(
    @Param('id') id: string,
    @Body() updateChoiceDto: UpdateChoiceDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.choiceService.update(id, user.sub, user.role, updateChoiceDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'delete choice question' })
  @ApiOperation({ summary: 'delete choice question' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.choiceService.remove(id, user.sub, user.role);
  }
}
