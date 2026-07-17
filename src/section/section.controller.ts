import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SectionService } from './section.service';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'get all sections' })
  @ApiOperation({ summary: 'Get all sections' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll() {
    return this.sectionService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'get section by id' })
  @ApiOperation({ summary: 'get single section' })
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionService.findOne(id, user.sub, user.role);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Update section' })
  @ApiOperation({ summary: 'Update section' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
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
  @Roles(UserRole.instructor, UserRole.admin)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.sectionService.remove(id, user.sub, user.role);
  }
}
