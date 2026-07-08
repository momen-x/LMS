import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import express from 'express';
import { RegisterUserDto } from './dto/register-auth.dto';
import { LoginUserDto } from './dto/login-auth.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthenticatedUser } from 'src/users/decorator/auth';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiOperation({ summary: 'Register a new user' })
  async create(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.register(dto);
    if (result.access_token) {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 15,
      });
    }
    return { success: true };
  }
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiResponse({ status: 200, description: 'login user' })
  @ApiOperation({ summary: 'login user' })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(dto);
    if (result.access_token) {
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 15,
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
    }
    return { success: true };
  }
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(
    @AuthenticatedUser() user: { id: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.logout(user.id); // clear hashedRefreshToken in DB
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true };
  }
  @Get('/google')
  @ApiOperation({ summary: 'Google login' })
  async googleLogin() {
    // This route will redirect to Google for authentication
  }
  @Get('/google/callback')
  @ApiOperation({ summary: 'Google login callback' })
  async googleLoginCallback() {
    // This route will handle the Google authentication callback
  }
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    return this.authService.refresh(dto, res);
  }
}
