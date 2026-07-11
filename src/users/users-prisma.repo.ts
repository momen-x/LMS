import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserRepository } from './users.repo';
import { User } from './entities/user.entity';
import { UserRole } from '@prisma/client';

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
  async clearRefreshToken(id: string): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { hashedRefreshToken: null },
    });
    return updatedUser;
  }

  getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
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
}
