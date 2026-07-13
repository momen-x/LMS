import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-auth.dto';
import { LoginUserDto } from './dto/login-auth.dto';
import { AuthRepository } from './auth.repo';
import * as bcrypt from 'bcryptjs';
import { JWTPayloadType } from 'src/utils/type';
import { RefreshTokenPayloadType } from './types/refresh-token.type';
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
// import { GoogleUserProfile } from './types/google-profile.type';
import { User } from 'src/users/entities/user.entity';
import { ProviderUserProfile } from './types/provider-profile.type';
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
    if (user && (!user.isVerified || !user.emailVerificationExpires)) {
      throw new BadRequestException(
        'Verification token has expired, please resend verification email',
      );
    }
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

  async login(
    loginDto: LoginUserDto,
    res: express.Response,
    { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
  ) {
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
    const tokens = await this.createAuthenticatedSession(user, {
      userAgent,
      ipAddress,
    });

    await this.authRepo.updateLastLogin(user.id);

    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { success: true };
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
  async refresh(
    refreshToken: string | undefined,
    res: express.Response,
  ): Promise<{ success: boolean }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let decoded: RefreshTokenPayloadType;
    try {
      decoded = this.jwtService.verify<RefreshTokenPayloadType>(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token is expired or invalid');
    }

    const session = await this.authRepo.findRefreshTokenSessionById(
      decoded.sessionId,
    );
    if (!session || session.userId !== decoded.sub) {
      throw new UnauthorizedException('Session not found');
    }
    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }
    if (!session.tokenHash) {
      throw new UnauthorizedException('Session is invalid');
    }
    const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
    if (!isMatch) {
      await this.authRepo.revokeRefreshTokenSession(session.id);
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const user = await this.authRepo.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { access_token } = this.createToken(
      user.id,
      user.email,
      user.role,
      user.provider,
    );
    const newRefreshToken = this.createRefreshToken(user.id, session.id);
    const hashedRT = await bcrypt.hash(newRefreshToken, 12);
    await this.authRepo.updateRefreshTokenSessionHash(session.id, hashedRT);

    this.setAuthCookies(res, access_token, newRefreshToken);

    return { success: true };
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
  private createRefreshToken(userId: string, sessionId: string): string {
    const payload: RefreshTokenPayloadType = {
      sub: userId,
      sessionId,
    };
    return this.jwtService.sign(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: '7d',
    });
  }
  private async createAuthenticatedSession(
    user: User,
    metadata: { userAgent: string; ipAddress: string },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.authRepo.createRefreshTokenSession(user.id, {
      ...metadata,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
    });
    const { access_token: accessToken } = this.createToken(
      user.id,
      user.email,
      user.role,
      user.provider,
    );
    const refreshToken = this.createRefreshToken(user.id, session.id);
    const tokenHash = await bcrypt.hash(refreshToken, 12);
    await this.authRepo.updateRefreshTokenSessionHash(session.id, tokenHash);
    return { accessToken, refreshToken };
  }
  async logout(
    refreshToken: string | undefined,
    res: express.Response,
  ): Promise<void> {
    try {
      if (refreshToken) {
        const payload = this.jwtService.verify<RefreshTokenPayloadType>(
          refreshToken,
          { secret: this.getRefreshTokenSecret() },
        );
        await this.authRepo.revokeRefreshTokenSession(payload.sessionId);
      }
    } catch {
      // Logout is idempotent and does not expose internal token errors.
    } finally {
      this.clearAuthCookies(res);
    }
  }
  async resendVerificationEmail(dto: ResendVerificationEmailDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.authRepo.findByEmail(email);
    const message =
      'If this email exists and is not verified, a verification email has been sent';

    if (!user) {
      return {
        success: true,
        message,
      };
    }
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
    await this.authRepo.revokeAllUserSessions(user.id);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
  async validateGoogleUser(profile: ProviderUserProfile) {
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
  async validateGithubUser(profile: ProviderUserProfile) {
    const providerUser = await this.authRepo.findByProviderAccount(
      AuthProvider.github,
      profile.providerId,
    );

    if (providerUser) {
      return providerUser;
    }

    const existingUser = await this.authRepo.findByEmail(profile.email);

    if (existingUser) {
      throw new ConflictException(
        existingUser.provider === AuthProvider.local
          ? 'An account with this email already exists. Sign in with your password before linking Github.'
          : `This email is already associated with ${existingUser.provider}.`,
      );
    }

    return this.authRepo.createOAuthUser({
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
      provider: AuthProvider.github,
      providerId: profile.providerId,
      isVerified: true,
    });
  }
  async completeOAuthLogin(
    user: User,
    res: express.Response,
    { userAgent, ipAddress }: { userAgent: string; ipAddress: string },
  ): Promise<void> {
    const tokens = await this.createAuthenticatedSession(user, {
      userAgent,
      ipAddress,
    });

    await this.authRepo.updateLastLogin(user.id);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
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
