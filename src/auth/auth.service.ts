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

@Injectable()
export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    // private notificationRepo: NotificationsRepository,
  ) {}
  async register(createAuthDto: RegisterUserDto, res: express.Response) {
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
    const { access_token } = this.createToken(
      newUser.id,
      newUser.email,
      newUser.role,
      newUser.provider,
    );
    const { refreshToken } = this.createRefreshToken(newUser.id);
    const hashedRT = await bcrypt.hash(refreshToken, 12);
    await this.authRepo.updateRefreshToken(newUser.id, hashedRT);
    this.setAuthCookies(res, access_token, refreshToken);
  }

  async login(loginDto: LoginUserDto, res: express.Response) {
    const user = await this.authRepo.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
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
}
