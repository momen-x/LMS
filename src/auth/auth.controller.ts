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
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-auth.dto';
import { LoginUserDto } from './dto/login-auth.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as express from 'express';
// import { generateCsrfToken } from 'csrf-csrf';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { GithubAuthGuard } from './guard/github-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiResponse({ status: 200, description: 'login user' })
  @ApiOperation({ summary: 'login user' })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    await this.authService.login(dto, res, {
      userAgent: req.headers['user-agent'] ?? 'unknown',
      ipAddress: req.ip ?? 'unknown',
    });
    return { success: true };
  }
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    return this.authService.resendVerificationEmail(dto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({ summary: 'forgot password' })
  async forgotPassword(@Body() dto: ResendVerificationEmailDto) {
    await this.authService.forgotPassword(dto.email);
    return { success: true };
  }
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({ summary: 'reset password' })
  async resetPasswordWithToken(
    @Query('token') token: string,
    @Query('email') email: string,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.authService.resetPasswordWithToken(token, dto.password);
    return { success: 'true' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'logout user' })
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    await this.authService.logout(refreshToken, res);
    return { success: true };
  }
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get('/google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login with Google' })
  googleLogin() {
    return 'hello world';
  }
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleLoginCallback(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = req.user as User;
    await this.authService.completeOAuthLogin(user, res, {
      userAgent: req.headers['user-agent'] ?? 'unknown',
      ipAddress: req.ip ?? 'unknown',
    });

    const frontendUrl = this.configService.getOrThrow<string>(
      'FRONTEND_OAUTH_SUCCESS_URL',
    );
    return res.redirect(frontendUrl);
  }
  @Get('github')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'Login with Github' })
  githubLogin() {
    return 'hello world';
    // This route will redirect to Github for authentication
  }
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubLoginCallback(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = req.user as User;
    await this.authService.completeOAuthLogin(user, res, {
      userAgent: req.headers['user-agent'] ?? 'unknown',
      ipAddress: req.ip ?? 'unknown',
    });

    const frontendUrl = this.configService.getOrThrow<string>(
      'FRONTEND_OAUTH_SUCCESS_URL',
    );
    return res.redirect(frontendUrl);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    return this.authService.refresh(refreshToken, res);
  }
  // @Get('csrf-token')
  // getCsrfToken(
  //   @Req() req: express.Request,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   const token = generateCsrfToken(req, res);
  //   return { csrfToken: token };
  // }
}
