import { MediaType } from '@prisma/client';

export type CreateMediaInputs = {
  type: MediaType;
  duration?: number;
};
export type UpdateMediaInputs = {
  type?: MediaType;
  duration?: number;
};
