import { AuthProvider } from '@prisma/client';

export type ProviderUserProfile = {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar: string | null;
  provider: AuthProvider;
};
