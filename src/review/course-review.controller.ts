import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { PaginationQueryDto } from 'src/utils/pagination-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller('courses/:courseId/reviews')
export class CourseReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Review a course in which I am enrolled' })
  @ApiResponse({ status: 201, description: 'Review created' })
  create(
    @Param('courseId') courseId: string,
    @Body() data: CreateReviewDto,
    @AuthenticatedUser() user: { sub: string },
  ) {
    return this.reviewService.create(user.sub, courseId, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated course reviews' })
  findByCourse(
    @Param('courseId') courseId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewService.findByCourseId(courseId, query.page, query.limit);
  }
  @Get('me')
  @ApiOperation({ summary: 'Get my reviews' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMine(
    @AuthenticatedUser() user: { sub: string },
    @Query('courseId') courseId: string,
  ) {
    return this.reviewService.findByStudentAndCourse(user.sub, courseId);
  }
}
