import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { CourseLevel, UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { QueryCourseDto } from './dto/search-query.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiOperation({ summary: 'Create a new course' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        thumbnail: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
        },
        duration: {
          type: 'number',
        },
      },
    },
  })
  @Roles(UserRole.instructor, UserRole.admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: multer.memoryStorage(),
    }),
  )
  create(
    @Body() createCourseDto: CreateCourseDto,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.courseService.create(
      user.role,
      user.sub,
      createCourseDto,
      file,
    );
  }

  @Get()
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    type: Number,
  })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.courseService.findAll(page, limit);
  }
  @Get('search')
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'filtering by category',
  })
  @ApiQuery({
    name: 'price',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: CourseLevel,
    example: 'beginner',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  search(@Query() query: QueryCourseDto) {
    return this.courseService.findByQuery(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiOperation({ summary: 'Update course' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        thumbnail: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
        },
        duration: {
          type: 'number',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  @UseInterceptors(FileInterceptor('thumbnail'))
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @AuthenticatedUser() user: { role: UserRole; sub: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.courseService.update(
      id,
      user.sub,
      user.role,
      updateCourseDto,
      file,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.courseService.remove(id, user.sub, user.role);
  }
}
