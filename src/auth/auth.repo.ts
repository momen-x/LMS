import { User } from 'src/users/entities/user.entity';
import { AuthProvider, RefreshTokenSession } from '@prisma/client';
import { CreateRefreshTokenSessionData } from './types/refresh-token.type';
import { CreateOAuthUserInput, RegisterUserInput } from './types/auth.type';

export abstract class AuthRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract create(data: RegisterUserInput): Promise<User>;
  abstract createRefreshTokenSession(
    userId: string,
    data: CreateRefreshTokenSessionData,
  ): Promise<RefreshTokenSession>;
  abstract updateRefreshTokenSessionHash(
    sessionId: string,
    tokenHash: string,
  ): Promise<void>;
  abstract findRefreshTokenSessionById(
    sessionId: string,
  ): Promise<RefreshTokenSession | null>;
  abstract revokeRefreshTokenSession(sessionId: string): Promise<void>;
  abstract revokeAllUserSessions(userId: string): Promise<void>;
  abstract updateLastLogin(id: string): Promise<User>;

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
  ): Promise<void>;
  abstract resetPassword(userId: string, password: string): Promise<User>;
  abstract findByPasswordResetToken(tokenHash: string): Promise<User | null>;
  abstract findByProviderAccount(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null>;

  abstract createOAuthUser(data: CreateOAuthUserInput): Promise<User>;
}
