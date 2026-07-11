import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-auth.dto';
import { AuthRepository } from './auth.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { User } from 'src/users/entities/user.entity';
import { CreateOAuthUserData } from './dto/create-oAuth-user-date.dto';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  }

  async create(data: RegisterUserDto): Promise<User> {
    const newUser = await this.prisma.user.create({
      data,
    });
    return newUser;
  }
  async updateLastLogin(id: string): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
    return updatedUser;
  }
  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { hashedRefreshToken: refreshToken },
    });
    return updatedUser;
  }
  async updateVerificationToken(
    id: string,
    verificationToken: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { emailVerificationToken: verificationToken },
    });
  }
  async updateEmailVerificationToken(
    userId: string,
    token: string | null,
    expires: Date | null,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });
  }
  async saveEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: expiresAt,
      },
    });
  }

  async findByEmailVerificationToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { emailVerificationToken: tokenHash },
    });
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }
  async savePasswordResetToken(
    userId: string,
    passwordResetToken: string,
    passwordResetExpires: Date,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });
  }
  async resetPassword(userId: string, password: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password,
        passwordResetToken: null,
        passwordResetExpires: null,
        hashedRefreshToken: null,
      },
    });
  }
  async findByPasswordResetToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        passwordResetToken: tokenHash,
      },
    });
  }
  async findByProviderAccount(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }

  async createOAuthUser(data: CreateOAuthUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        provider: data.provider,
        providerId: data.providerId,
        avatar: data.avatar,
        isVerified: data.isVerified,
        password: null,
      },
    });
  }
}
