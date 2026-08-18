import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import {
  doubleCsrf,
  type DoubleCsrfConfigOptions,
  type DoubleCsrfUtilities,
} from 'csrf-csrf';
import {
  CSRF_HEADER_NAME,
  CSRF_SESSION_COOKIE_NAME_DEV,
  CSRF_SESSION_COOKIE_NAME_PROD,
  CSRF_TOKEN_COOKIE_NAME_DEV,
  CSRF_TOKEN_COOKIE_NAME_PROD,
  getCsrfCookieOptions,
} from './csrf.constants';

export type CsrfConfiguration = {
  doubleCsrfUtilities: DoubleCsrfUtilities;
  csrfCookieOptions: CookieOptions;
  csrfSessionCookieName: string;
  csrfTokenCookieName: string;
  getSessionIdentifier: (req: Request) => string;
  getCsrfTokenFromRequest: (req: Request) => string | undefined;
  generateCsrfToken: (req: Request, res: Response) => string;
  shouldSkipCsrf: (req: Request) => boolean;
};

export function createCsrfConfig(
  configService: ConfigService,
): CsrfConfiguration {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const csrfSecret = configService.getOrThrow<string>('CSRF_SECRET');
  if (Buffer.byteLength(csrfSecret, 'utf8') < 32) {
    throw new Error('CSRF_SECRET must contain at least 32 bytes');
  }
  const csrfSessionCookieName = isProduction
    ? CSRF_SESSION_COOKIE_NAME_PROD
    : CSRF_SESSION_COOKIE_NAME_DEV;
  const csrfTokenCookieName = isProduction
    ? CSRF_TOKEN_COOKIE_NAME_PROD
    : CSRF_TOKEN_COOKIE_NAME_DEV;

  const csrfCookieOptions = getCsrfCookieOptions(isProduction);
  const csrfConfig: DoubleCsrfConfigOptions = {
    getSecret: () => csrfSecret,
    getSessionIdentifier: (request) => {
      const identifier = request.csrfSessionIdentifier;

      if (!identifier) {
        throw new Error('CSRF session identifier is missing');
      }

      return identifier;
    },
    cookieName: csrfTokenCookieName,
    cookieOptions: csrfCookieOptions,
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (request) => {
      const value = request.headers[CSRF_HEADER_NAME];
      return typeof value === 'string' ? value : undefined;
    },
  };

  const doubleCsrfUtilities = doubleCsrf(csrfConfig);

  const getSessionIdentifier = (req: Request): string => {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const existing = cookies?.[csrfSessionCookieName];
    if (typeof existing === 'string' && existing.length > 0) {
      return existing;
    }
    return '';
  };

  const generateCsrfToken = (req: Request, res: Response): string =>
    doubleCsrfUtilities.generateCsrfToken(req, res, {
      overwrite: false,
      validateOnReuse: false,
    });

  const getCsrfTokenFromRequest = (req: Request): string | undefined => {
    const value = req.headers[CSRF_HEADER_NAME];
    return typeof value === 'string' ? value : undefined;
  };

  const shouldSkipCsrf = (req: Request): boolean => {
    const method = req.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const path = req.path.replace(/^\/api/, '');
    if (path === '/payment/webhook' || path === '/payments/webhook') {
      return true;
    }

    const authorization = req.headers.authorization;
    const hasBearer =
      typeof authorization === 'string' && authorization.startsWith('Bearer ');
    const hasAccessCookie =
      typeof req.cookies?.access_token === 'string' &&
      req.cookies.access_token.length > 0;
    const hasRefreshCookie =
      typeof req.cookies?.refresh_token === 'string' &&
      req.cookies.refresh_token.length > 0;

    if (hasBearer && !hasAccessCookie && !hasRefreshCookie) {
      return true;
    }

    return false;
  };

  return {
    doubleCsrfUtilities,
    csrfCookieOptions,
    csrfSessionCookieName,
    csrfTokenCookieName,
    getSessionIdentifier,
    getCsrfTokenFromRequest,
    generateCsrfToken,
    shouldSkipCsrf,
  };
}
