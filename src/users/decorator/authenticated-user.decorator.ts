import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JWTPayloadType } from 'src/utils/type';

export const CURRENT_USER_KEY = 'user';
export const AuthenticatedUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Record<string, any>>();
    const user =
      (request.user as JWTPayloadType | undefined) ??
      (request[CURRENT_USER_KEY] as JWTPayloadType | undefined);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  },
);
