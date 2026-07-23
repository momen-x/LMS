import { UserRole } from '@prisma/client';
import { User } from '../entities/user.entity';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResponse<T> = {
  users: T[];
  meta: PaginationMeta;
};
export type GetUsersOptions = {
  skip: number;
  take: number;
  role?: UserRole;
};

export type PaginatedUsersResult = {
  users: User[];
  total: number;
};
