export type GoogleUserProfile = {
  providerId: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: 'google';
};
