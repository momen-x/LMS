/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import {
  CSRF_COOKIE_MAX_AGE,
  CSRF_SESSION_COOKIE_NAME_DEV,
  CSRF_SESSION_COOKIE_NAME_PROD,
  getCsrfCookieOptions,
} from './csrf.constants';

@Injectable()
export class CsrfSessionMiddleware implements NestMiddleware {
  private readonly isProduction: boolean;
  private readonly cookieName: string;
  private readonly cookieOptions: ReturnType<typeof getCsrfCookieOptions>;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    this.cookieName = this.isProduction
      ? CSRF_SESSION_COOKIE_NAME_PROD
      : CSRF_SESSION_COOKIE_NAME_DEV;
    this.cookieOptions = getCsrfCookieOptions(this.isProduction);
    this.cookieOptions.maxAge = CSRF_COOKIE_MAX_AGE;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const existingIdentifier = req.cookies?.[this.cookieName];
    const identifier =
      typeof existingIdentifier === 'string' && existingIdentifier.length > 0
        ? existingIdentifier
        : randomBytes(32).toString('hex');

    if (
      typeof existingIdentifier !== 'string' ||
      existingIdentifier.length === 0
    ) {
      res.cookie(this.cookieName, identifier, this.cookieOptions);
    }

    req.csrfSessionIdentifier = identifier;
    next();
  }
}
