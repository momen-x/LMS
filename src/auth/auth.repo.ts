import { User } from 'src/users/entities/user.entity';
import { RegisterUserDto } from './dto/register-auth.dto';
import { AuthProvider } from '@prisma/client';
import { CreateOAuthUserData } from './dto/create-oAuth-user-date.dto';

export abstract class AuthRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract create(data: RegisterUserDto): Promise<User>;
  abstract updateLastLogin(id: string): Promise<User>;
  abstract updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<User>;
  abstract updateVerificationToken(
    id: string,
    verificationToken: string,
  ): Promise<User>;
  abstract updateEmailVerificationToken(
    userId: string,
    token: string | null,
    expires: Date | null,
  ): Promise<User>;
  abstract saveEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;

  abstract findByEmailVerificationToken(
    tokenHash: string,
  ): Promise<User | null>;

  abstract markEmailAsVerified(userId: string): Promise<void>;
  abstract savePasswordResetToken(
    userId: string,
    passwordResetToken: string,
    passwordResetExpires: Date,
  );
  abstract resetPassword(userId: string, password: string): Promise<User>;
  abstract findByPasswordResetToken(tokenHash: string): Promise<User | null>;
  abstract findByProviderAccount(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null>;

  abstract createOAuthUser(data: CreateOAuthUserData): Promise<User>;
}
