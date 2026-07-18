import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';

export type OAuthProvider = 'google' | 'github';

export function validateAndClearOAuthState(
  req: Request,
  res: Response,
  provider: OAuthProvider,
  isProduction: boolean,
): void {
  const cookieName = `oauth_state_${provider}`;
  const cookiePath = `/api/auth/${provider}`;
  const returned = typeof req.query.state === 'string' ? req.query.state : '';
  const expected =
    typeof req.cookies?.[cookieName] === 'string'
      ? req.cookies[cookieName]
      : '';

  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: cookiePath,
  });

  const returnedBuffer = Buffer.from(returned);
  const expectedBuffer = Buffer.from(expected);
  if (
    returnedBuffer.length === 0 ||
    returnedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(returnedBuffer, expectedBuffer)
  ) {
    throw new UnauthorizedException('Invalid OAuth state');
  }
}

@Injectable()
export class OAuthStateMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const provider = req.originalUrl.split('?')[0].endsWith('/auth/google')
      ? 'google'
      : req.originalUrl.split('?')[0].endsWith('/auth/github')
        ? 'github'
        : undefined;
    if (!provider) {
      next();
      return;
    }

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const state = randomBytes(24).toString('hex');
    res.cookie(`oauth_state_${provider}`, state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: `/api/auth/${provider}`,
      maxAge: 1000 * 60 * 5,
    });

    req.oauthState = state;
    next();
  }
}
