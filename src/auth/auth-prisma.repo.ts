import { Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-auth.dto';
import { AuthRepository } from './auth.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user as User | null;
  }

  async create(data: RegisterUserDto): Promise<User> {
    const newUser = await this.prisma.user.create({
      data,
    });
    return newUser as User;
  }
  async updateLastLogin(id: string): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
    return updatedUser as User;
  }
  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { hashedRefreshToken: refreshToken },
    });
    return updatedUser as User;
  }
}
