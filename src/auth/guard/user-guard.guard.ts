import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { JWTPayloadType } from 'src/utils/type';
import { ROLES_KEY } from 'src/users/decorator/user-role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) return true;

    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as JWTPayloadType | undefined;

    if (!user) throw new UnauthorizedException('Missing authenticated user');

    if (!roles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
