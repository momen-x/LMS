/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { AuthProvider, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as express from 'express';

@Injectable()
export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private jwtService: JwtService,
    // private notificationRepo: NotificationsRepository,
  ) {}
  async register(createAuthDto: RegisterUserDto) {
    const user = await this.authRepo.findByEmail(createAuthDto.email);
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
      email: createAuthDto.email.toLowerCase(),
    });
    const { access_token } = this.createToken(
      newUser.id,
      newUser.email,
      newUser.role,
      newUser.provider,
    );
    return {
      access_token,
      user: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        provider: newUser.provider,
        avatar: newUser.avatar,
        isVerified: newUser.isVerified,
        lastLogin: newUser.lastLogin,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        id: newUser.id,
      },
    };
  }

  async login(loginDto: LoginUserDto) {
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
    const { refreshToken } = this.createRefreshToken(
      user.id,
      user.email,
      user.role,
      user.provider,
    );
    const hashedRT = await bcrypt.hash(refreshToken, 12);
    await this.authRepo.updateRefreshToken(user.id, hashedRT);
    await this.authRepo.updateLastLogin(user.id);
    return { access_token, refreshToken };
  }
  async refresh(dto: RefreshTokenDto, res: express.Response) {
    try {
      if (!dto.hashedRefreshToken) {
        throw new UnauthorizedException('Refresh token is missing');
      }
      const decoded = this.jwtService.verify(dto.hashedRefreshToken);
      const user = await this.authRepo.findByEmail(decoded.email);
      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const isMatch = await bcrypt.compare(
        dto.hashedRefreshToken,
        user.hashedRefreshToken,
      );

      if (!isMatch) {
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
        user.email,
        user.role,
        user.provider,
      );
      const hashedRT = await bcrypt.hash(newRefreshToken, 12);
      await this.authRepo.updateRefreshToken(user.id, hashedRT);
      res.cookie('access_token', access_token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 15,
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
      return { access_token, refreshToken: newRefreshToken };
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
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
    return { access_token };
  }
  private createRefreshToken(
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
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { refreshToken };
  }
  async logout(userId: string) {
    await this.authRepo.updateRefreshToken(userId, null);
  }
}
