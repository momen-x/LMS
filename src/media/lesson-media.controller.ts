import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { MediaType, UserRole } from '@prisma/client';
import { CreateMediaDto } from './dto/create-media.dto';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';

@Controller('lessons/:lessonId/media')
export class LessonMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Media Created successfully',
  })
  @ApiOperation({
    summary: 'Create new media',
  })
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
  create(
    @Param('lessonId') lessonId: string,
    @Body() dto: CreateMediaDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.create(user.sub, user.role, dto, lessonId, file);
  }
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Lesson media retrieved successfully',
  })
  @ApiOperation({
    summary: 'Get media by lesson ID',
  })
  @UseGuards(JwtAuthGuard)
  findByLessonId(
    @Param('lessonId') lessonId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.mediaService.findByLessonId(user.sub, user.role, lessonId);
  }
}
