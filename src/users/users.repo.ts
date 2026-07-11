import { User } from './entities/user.entity';
import { UserRole } from '@prisma/client';

export abstract class UserRepository {
  abstract updateUserName(id: string, username: string): Promise<User>;
  abstract updatePassword(id: string, password: string): Promise<User>;
  abstract clearRefreshToken(id: string): Promise<User>;
  abstract getAllUsers(): Promise<User[]>;
  abstract findById(id: string): Promise<User | null>;
  abstract deleteUser(id: string): Promise<User>;
  abstract updateUserRole(id: string, role: UserRole): Promise<User>;
}
