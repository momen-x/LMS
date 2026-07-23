import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserRepository } from './users.repo';
import { User } from './entities/user.entity';
import { UserRole } from '@prisma/client';
import { GetUsersOptions, PaginatedUsersResult } from './utils/type';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}
  async updateUserName(id: string, name: string): Promise<User> {
    const updateUserPass = await this.prisma.user.update({
      where: { id },
      data: { name },
    });
    return updateUserPass;
  }
  async updatePassword(id: string, password: string): Promise<User> {
    const updateUserPass = await this.prisma.user.update({
      where: { id },
      data: { password },
    });
    return updateUserPass;
  }
  async getAllUsers(options: GetUsersOptions): Promise<PaginatedUsersResult> {
    const { skip, take, role } = options;

    const where = role
      ? {
          role,
        }
      : undefined;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      users,
      total,
    };
  }

  countUsers(): Promise<number> {
    return this.prisma.user.count();
  }
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }
  async deleteUser(id: string): Promise<User> {
    const deleteAccount = await this.prisma.user.delete({
      where: { id },
    });
    return deleteAccount;
  }
  async updateUserRole(id: string, role: UserRole) {
    const updateUserRole = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return updateUserRole;
  }
  async uploadUserAvatar(id: string, avatar: string, avatarPublicId: string) {
    const updateUserImage = await this.prisma.user.update({
      where: { id },
      data: { avatar, avatarPublicId },
    });
    return updateUserImage;
  }
  async deleteUserAvatar(id: string) {
    const updateUserImage = await this.prisma.user.update({
      where: { id },
      data: { avatar: null, avatarPublicId: null },
    });
    return updateUserImage;
  }
}
