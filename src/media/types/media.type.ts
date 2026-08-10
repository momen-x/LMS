import { MediaType } from '@prisma/client';

export type CreateMediaInputs = {
  type: MediaType;
  duration?: number;
  url?: string;
};
export type UpdateMediaInputs = {
  type?: MediaType;
  duration?: number | null;
  url?: string;
};
