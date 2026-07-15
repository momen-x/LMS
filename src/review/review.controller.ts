import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { PaginationQueryDto } from 'src/utils/pagination-query.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my reviews' })
  findMine(
    @AuthenticatedUser() user: { sub: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewService.findMine(user.sub, query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update my review' })
  update(
    @Param('id') id: string,
    @Body() data: UpdateReviewDto,
    @AuthenticatedUser() user: { sub: string },
  ) {
    return this.reviewService.update(id, user.sub, data);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete my review or moderate as admin' })
  delete(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string; role: UserRole },
  ) {
    return this.reviewService.delete(id, user.sub, user.role);
  }
}
