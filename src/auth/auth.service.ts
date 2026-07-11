import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-auth.dto';
import { LoginUserDto } from './dto/login-auth.dto';
import { AuthRepository } from './auth.repo';
import * as bcrypt from 'bcryptjs';
import { JWTPayloadType, RefreshTokenPayloadType } from 'src/utils/type';
import { AuthProvider, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  getAuthCookieOptions,
  getClearAuthCookieOptions,
} from './auth-cookie.options';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { ConflictException } from '@nestjs/common';
import { GoogleUserProfile } from './types/google-profile.type';
import { User } from 'src/users/entities/user.entity';
@Injectable()
export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    // private notificationRepo: NotificationsRepository,
  ) {}
  async register(createAuthDto: RegisterUserDto) {
    const email = createAuthDto.email.toLowerCase();
    const user = await this.authRepo.findByEmail(email);
    if (user) {
      throw new BadRequestException('User with this email already exists');
    }
    if (!createAuthDto.password) {
      throw new BadRequestException('Password is required');
    }
    const hashedPassword = await bcrypt.hash(createAuthDto.password, 12);
    const newUser = await this.authRepo.create({
      ...createAuthDto,
      password: hashedPassword,
      email,
    });
    const { token, tokenHash } = this.generateEmailVerificationToken();

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await this.authRepo.saveEmailVerificationToken(
      newUser.id,
      tokenHash,
      expiresAt,
    );

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    await this.mailService.sendVerificationEmail(
      newUser.email,
      newUser.name,
      verificationUrl,
    );

    return { success: true, message: 'Verification email sent' };
  }

  async login(loginDto: LoginUserDto, res: express.Response) {
    const user = await this.authRepo.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before login');
    }
    if (!user.password) {
      throw new UnauthorizedException(
        `This account uses ${user.provider} login`,
      );
    }
    if (!loginDto.password) {
      throw new UnauthorizedException('Password is required');
    }
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const { access_token } = this.createToken(
      user.id,
      user.email,
      user.role,
      user.provider,
    );
    const { refreshToken } = this.createRefreshToken(user.id);
    const hashedRT = await bcrypt.hash(refreshToken, 12);
    await this.authRepo.updateRefreshToken(user.id, hashedRT);
    await this.authRepo.updateLastLogin(user.id);
    this.setAuthCookies(res, access_token, refreshToken);
  }
  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.authRepo.findByEmailVerificationToken(tokenHash);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    if (user.isVerified) {
      return {
        success: true,
        message: 'Email already verified',
      };
    }

    await this.authRepo.markEmailAsVerified(user.id);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }
  async refresh(refreshToken: string | undefined, res: express.Response) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token is missing');
      }
      const decoded = this.jwtService.verify<RefreshTokenPayloadType>(
        refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );
      const user = await this.authRepo.findById(decoded.sub);
      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const isMatch = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );

      if (!isMatch) {
        await this.authRepo.updateRefreshToken(user.id, null);
        throw new UnauthorizedException('Invalid refresh token');
      }
      const { access_token } = this.createToken(
        user.id,
        user.email,
        user.role,
        user.provider,
      );
      const { refreshToken: newRefreshToken } = this.createRefreshToken(
        user.id,
      );
      const hashedRT = await bcrypt.hash(newRefreshToken, 12);
      await this.authRepo.updateRefreshToken(user.id, hashedRT);
      this.setAuthCookies(res, access_token, newRefreshToken);
      return { success: true };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  private createToken(
    id: string,
    email: string,
    role: UserRole,
    provider: AuthProvider,
  ) {
    const payload: JWTPayloadType = {
      sub: id,
      email: email,
      role: role,
      provider: provider, // Assuming local for standard login; adjust as needed for social logins
    };
    const access_token = this.jwtService.sign(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: '15m',
    });
    return { access_token };
  }
  private createRefreshToken(id: string) {
    const payload: RefreshTokenPayloadType = {
      sub: id,
    };
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: '7d',
    });
    return { refreshToken };
  }
  async logout(userId: string, res: express.Response) {
    await this.authRepo.updateRefreshToken(userId, null);
    this.clearAuthCookies(res);
  }
  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.authRepo.findByEmail(email);

    if (!user) {
      return {
        success: true,
        message:
          'If this email exists and is not verified, a verification email has been sent',
      };
    }
    const message =
      'If this email exists and is not verified, a verification email has been sent';
    if (user.isVerified) {
      return {
        success: true,
        message,
      };
    }

    const { token, tokenHash } = this.generateEmailVerificationToken();

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await this.authRepo.saveEmailVerificationToken(
      user.id,
      tokenHash,
      expiresAt,
    );
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationUrl,
    );

    return {
      success: true,
      message,
    };
  }
  async forgotPassword(emailInput: string) {
    const response = {
      success: true,
      message: 'If this email exists, a password reset link has been sent',
    };

    const email = emailInput.trim().toLowerCase();
    const user = await this.authRepo.findByEmail(email);

    if (
      !user ||
      !user.isVerified ||
      user.provider !== AuthProvider.local ||
      !user.password
    ) {
      return response;
    }

    const token = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await this.authRepo.savePasswordResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.mailService.forgotPasswordEmail(user.email, user.name, resetUrl);

    return response;
  }
  async resetPasswordWithToken(token: string, newPassword: string) {
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.authRepo.findByPasswordResetToken(tokenHash);

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.authRepo.resetPassword(user.id, hashedPassword);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
  async validateGoogleUser(profile: GoogleUserProfile) {
    const providerUser = await this.authRepo.findByProviderAccount(
      AuthProvider.google,
      profile.providerId,
    );

    if (providerUser) {
      return providerUser;
    }

    const existingUser = await this.authRepo.findByEmail(profile.email);

    if (existingUser) {
      throw new ConflictException(
        existingUser.provider === AuthProvider.local
          ? 'An account with this email already exists. Sign in with your password before linking Google.'
          : `This email is already associated with ${existingUser.provider}.`,
      );
    }

    return this.authRepo.createOAuthUser({
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
      provider: AuthProvider.google,
      providerId: profile.providerId,
      isVerified: true,
    });
  }
  async completeOAuthLogin(user: User, res: express.Response) {
    const { access_token } = this.createToken(
      user.id,
      user.email,
      user.role,
      user.provider,
    );

    const { refreshToken } = this.createRefreshToken(user.id);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

    await this.authRepo.updateRefreshToken(user.id, hashedRefreshToken);

    await this.authRepo.updateLastLogin(user.id);

    this.setAuthCookies(res, access_token, refreshToken);

    return {
      success: true,
    };
  }
  private setAuthCookies(
    res: express.Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      getAuthCookieOptions(this.configService, ACCESS_TOKEN_MAX_AGE),
    );

    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      getAuthCookieOptions(this.configService, REFRESH_TOKEN_MAX_AGE),
    );
  }

  private clearAuthCookies(res: express.Response) {
    const options = getClearAuthCookieOptions(this.configService);

    res.clearCookie(ACCESS_TOKEN_COOKIE, options);
    res.clearCookie(REFRESH_TOKEN_COOKIE, options);
  }

  private getAccessTokenSecret() {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('JWT_ACCESS_SECRET is not defined');
    return secret;
  }

  private getRefreshTokenSecret() {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not defined');
    return secret;
  }
  private generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return { token, tokenHash };
  }
}
