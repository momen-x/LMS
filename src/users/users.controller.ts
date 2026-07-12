import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { AuthenticatedUser } from './decorator/authenticated-user.decorator';
import { Roles } from './decorator/user-role.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  UpdateUserNameDto,
  UpdateUserPasswordDto,
} from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UploadUserAvatarDto } from './dto/upload-user-avatar.dto';

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

  @Delete('me/avatar')
  @ApiResponse({ status: 200, description: 'delete user avatar' })
  @ApiOperation({ summary: 'delete user avatar' })
  @UseGuards(JwtAuthGuard)
  deleteUserImage(
    @AuthenticatedUser()
    user: {
      sub: string;
      email: string;
      role: UserRole;
    },
  ) {
    return this.usersService.deleteUserAvatar(user.sub);
  }
  @Delete(':id')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiOperation({ summary: 'Delete user by id, admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  removeByAdmin(@Param('id') id: string) {
    return this.usersService.removeByAdmin(id);
  }
  @Put('me/avatar')
  @ApiResponse({ status: 201, description: 'upload user avatar' })
  @ApiOperation({ summary: 'upload user avatar' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadUserAvatarDto, description: 'profile image' })
  async uploadUserImage(
    @AuthenticatedUser()
    user: { sub: string; email: string; role: UserRole },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|jpg|png|webp)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.usersService.uploadUserAvatar(user.sub, file);
  }
}
