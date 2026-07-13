import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SectionService } from './section.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post('course/:courseId')
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiOperation({ summary: 'Create a new service' })
  @Roles(UserRole.instructor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Body() createSectionDto: CreateSectionDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
    @Param('courseId') courseId: string,
  ) {
    return this.sectionService.create(
      user.sub,
      user.role,
      createSectionDto,
      courseId,
    );
  }

  @Get()
  @ApiResponse({ status: 200, description: 'get all sections' })
  @ApiOperation({ summary: 'Get all sections' })
  findAll() {
    return this.sectionService.findAll();
  }
  @Get('course/:courseId')
  @ApiResponse({ status: 200, description: 'get section by course id' })
  @ApiOperation({ summary: 'get single section' })
  findByCourseId(@Param('courseId') courseId: string) {
    return this.sectionService.findByCourseId(courseId);
  }
  @Get(':id')
  @ApiResponse({ status: 200, description: 'get section by id' })
  @ApiOperation({ summary: 'get single section' })
  findOne(@Param('id') id: string) {
    return this.sectionService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Update section' })
  @ApiOperation({ summary: 'Update section' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  update(
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionService.update(
      id,
      user.sub,
      user.role,
      updateSectionDto,
    );
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Delete section' })
  @ApiOperation({ summary: 'Delete section' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionService.remove(id, user.sub, user.role);
  }
}
