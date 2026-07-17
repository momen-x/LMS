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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { UpdateMediaDto } from './dto/update-media.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { MediaType, UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';

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
    return this.mediaService.findOne(id, user.sub, user.role);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Media Updated successfully' })
  @ApiOperation({ summary: 'Update Media' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: Object.values(MediaType),
        },
        duration: {
          type: 'number',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.update(
      id,
      user.sub,
      user.role,
      updateMediaDto,
      file,
    );
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
