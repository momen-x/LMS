import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { validateAndClearOAuthState } from '../oauth-state.middleware';
import type { Request, Response } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.originalUrl.split('?')[0].endsWith('/google/callback')) {
      validateAndClearOAuthState(
        request,
        context.switchToHttp().getResponse<Response>(),
        'google',
        this.configService.get<string>('NODE_ENV') === 'production',
      );
    }
    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    return request.oauthState ? { state: request.oauthState } : undefined;
  }
}
