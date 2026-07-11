import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { AuthenticatedUser } from './decorator/authenticated-user.decorator';
import { Roles } from './decorator/user-role.decorator';
import {
  UpdateUserNameDto,
  UpdateUserPasswordDto,
} from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiResponse({ status: 200, description: 'Get current user' })
  @ApiOperation({ summary: 'Get current authenticated user' })
  @UseGuards(JwtAuthGuard)
  me(@AuthenticatedUser() user: { sub: string }) {
    return this.usersService.findOne(user.sub);
  }

  @Patch('me/name')
  @ApiResponse({ status: 200, description: 'Name updated successfully' })
  @ApiOperation({ summary: 'Update current user name' })
  @UseGuards(JwtAuthGuard)
  updateMyName(
    @AuthenticatedUser() user: { sub: string },
    @Body() dto: UpdateUserNameDto,
  ) {
    return this.usersService.updateName(user.sub, dto);
  }

  @Patch('me/password')
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiOperation({ summary: 'Update current user password' })
  @UseGuards(JwtAuthGuard)
  updateMyPassword(
    @AuthenticatedUser() user: { sub: string },
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.usersService.updatePassword(user.sub, dto);
  }

  @Delete('me')
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiOperation({ summary: 'Delete current user account' })
  @UseGuards(JwtAuthGuard)
  removeMyAccount(@AuthenticatedUser() user: { sub: string }) {
    return this.usersService.removeMyAccount(user.sub);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Get all users' })
  @ApiOperation({ summary: 'Get all users, admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get user by id' })
  @ApiOperation({ summary: 'Get single user, admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiOperation({ summary: 'Delete user by id, admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeByAdmin(@Param('id') id: string) {
    return this.usersService.removeByAdmin(id);
  }
}
