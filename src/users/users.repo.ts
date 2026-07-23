import { User } from './entities/user.entity';
import { UserRole } from '@prisma/client';
import { GetUsersOptions, PaginatedUsersResult } from './utils/type';

export abstract class UserRepository {
  abstract updateUserName(id: string, username: string): Promise<User>;
  abstract updatePassword(id: string, password: string): Promise<User>;
  abstract getAllUsers(options: GetUsersOptions): Promise<PaginatedUsersResult>;
  abstract countUsers(): Promise<number>;
  abstract findById(id: string): Promise<User | null>;
  abstract deleteUser(id: string): Promise<User>;
  abstract updateUserRole(id: string, role: UserRole): Promise<User>;
  abstract uploadUserAvatar(
    id: string,
    avatar: string,
    avatarPublicId: string,
  ): Promise<User>;
  abstract deleteUserAvatar(id: string): Promise<User>;
}
