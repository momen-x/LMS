/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-auth.dto';
import { LoginUserDto } from './dto/login-auth.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/users/decorator/authenticated-user.decorator';
import { REFRESH_TOKEN_COOKIE } from './auth-cookie.options';
import { JwtAuthGuard } from './guard/UseGuards.guard';
import * as express from 'express';
import { generateCsrfToken } from 'csrf-csrf';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.register(dto, res);
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
    await this.authService.login(dto, res);
    return { success: true };
  }
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'logout user' })
  async logout(
    @AuthenticatedUser() user: { sub: string },
    @Res({ passthrough: true }) res: express.Response,
  ) {
    await this.authService.logout(user.sub, res);
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
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE] as
      string | undefined;
    return this.authService.refresh(refreshToken, res);
  }
  @Get('csrf-token')
  getCsrfToken(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = generateCsrfToken(req, res);
    return { csrfToken: token };
  }
}
