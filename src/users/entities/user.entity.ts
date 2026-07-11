import { AuthProvider, UserRole } from '@prisma/client';

export class User {
  constructor(
    public name: string,
    public email: string,
    public id: string,
    public providerId: string | null,
    public role: UserRole,
    public provider: AuthProvider,
    public avatar: string | null,
    public isVerified: boolean,
    public lastLogin: Date | null,
    public createdAt: Date,
    public updatedAt: Date,
    public password: string | null,
    public hashedRefreshToken: string | null,
    public emailVerificationToken: string | null,
    public emailVerificationExpires: Date | null,
    public passwordResetToken: string | null,
    public passwordResetExpires: Date | null,
  ) {}
}
