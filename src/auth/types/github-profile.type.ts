import { AuthProvider } from '@prisma/client';

export type GithubUserProfile = {
  providerId: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: AuthProvider;
};
