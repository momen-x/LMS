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
  ApiBearerAuth,
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
import { CreateRejectedMessageDto } from './dto/create-rejected-message.dto';

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
  @Get('high-rating')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reviews' })
  findMine(@Query('count') count?: number) {
    return this.courseService.findHighRating(count ?? 1);
  }
  @Get('search')
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'filtering by category',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'maxPrice',
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
  @Get('instructor/my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  @ApiResponse({
    status: 200,
    description: 'Get the course that created by this user',
  })
  @ApiOperation({ summary: 'Get the course that created by this user' })
  getInstructorCourses(
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.courseService.finsInstructorCourses(user.sub, user.role);
  }
  @Get('instructor/enrollment-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  @ApiOperation({
    summary: 'Get enrollment statistics for instructor courses',
  })
  getInstructorEnrollmentStats(
    @AuthenticatedUser()
    user: {
      sub: string;
      role: UserRole;
    },
  ) {
    return this.courseService.getInstructorEnrollmentStats(user.sub, user.role);
  }
  @Get(':instructorId/courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @ApiResponse({
    status: 200,
    description: 'Get the course that created by this user',
  })
  @ApiOperation({ summary: 'Get the course that created by this user' })
  getInstructorCoursesByAdmin(
    @AuthenticatedUser() user: { role: UserRole },
    @Param('instructorId') instructorId: string,
  ) {
    return this.courseService.finsInstructorCourses(instructorId, user.role);
  }
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  getPendingCourses() {
    return this.courseService.findPendingCourses();
  }

  @Get(':courseId/learning')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get course learning content and enrollment info' })
  @ApiResponse({ status: 200, description: 'Course learning content' })
  @ApiResponse({ status: 403, description: 'User is not enrolled' })
  getLearningContent(
    @Param('courseId') courseId: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.courseService.getLearningContent(courseId, user.sub, user.role);
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
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  approve(
    @Param('id') id: string,
    @AuthenticatedUser() user: { role: UserRole; sub: string },
  ) {
    return this.courseService.approveCourse(id, user.role);
  }
  @Patch(':id/submit-for-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.instructor, UserRole.admin)
  submitForReview(
    @Param('id') id: string,
    @AuthenticatedUser() user: { role: UserRole; sub: string },
  ) {
    return this.courseService.submitCourseForReview(id, user.sub, user.role);
  }
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  reject(
    @Param('id') id: string,
    @Body() dto: CreateRejectedMessageDto,
    @AuthenticatedUser() user: { role: UserRole; sub: string },
  ) {
    return this.courseService.rejectCourse(id, dto, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.instructor)
  remove(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.courseService.remove(id, user.sub, user.role);
  }
}
