/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { MediaService } from './media.service';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Media found successfully' })
  @ApiOperation({ summary: 'Get a medias' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Media found successfully' })
  @ApiOperation({ summary: 'Get a media by id' })
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    //in the future just the user payment can show and go to the media
    return this.mediaService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Media Updated successfully' })
  @ApiOperation({ summary: 'Update Media' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.mediaService.update(id, user.sub, user.role, updateMediaDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Media Deleted successfully' })
  @ApiOperation({ summary: 'Delete media by id' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.mediaService.remove(id, user.sub, user.role);
  }
}
