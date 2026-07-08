import { AuthProvider, UserRole } from '@prisma/client';

export type JWTPayloadType = {
  sub: string;
  email: string;
  role: UserRole;
  provider: AuthProvider;
};
