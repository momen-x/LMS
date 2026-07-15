import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/decorator/authenticated-user.decorator';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { PaginationQueryDto } from 'src/utils/pagination-query.dto';
import { NotificationsService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  findMine(
    @AuthenticatedUser() user: { sub: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationsService.findMine(
      user.sub,
      query.page,
      query.limit,
    );
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get my unread notifications' })
  findUnread(
    @AuthenticatedUser() user: { sub: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationsService.findUnread(
      user.sub,
      query.page,
      query.limit,
    );
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Count my unread notifications' })
  countUnread(@AuthenticatedUser() user: { sub: string }) {
    return this.notificationsService.countUnread(user.sub);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  markAllAsRead(@AuthenticatedUser() user: { sub: string }) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Delete('read')
  @ApiOperation({ summary: 'Delete all my read notifications' })
  deleteAllRead(@AuthenticatedUser() user: { sub: string }) {
    return this.notificationsService.deleteAllRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one of my notifications as read' })
  markAsRead(
    @Param('id') id: string,
    @AuthenticatedUser() user: { sub: string },
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of my notifications' })
  delete(@Param('id') id: string, @AuthenticatedUser() user: { sub: string }) {
    return this.notificationsService.delete(id, user.sub);
  }
}
