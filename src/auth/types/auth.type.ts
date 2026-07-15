export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};
export type CreateOAuthUserInput = {
  email: string;
  name: string;
  avatar: string | null;
  provider: 'google' | 'github';
  providerId: string;
  isVerified?: boolean;
};
