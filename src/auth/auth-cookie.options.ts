import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 15;
export const REFRESH_TOKEN_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

export function getAuthCookieOptions(
  configService: ConfigService,
  maxAge: number,
): CookieOptions {
  return {
    ...getBaseAuthCookieOptions(configService),
    maxAge,
  };
}

export function getClearAuthCookieOptions(
  configService: ConfigService,
): CookieOptions {
  return getBaseAuthCookieOptions(configService);
}

function getBaseAuthCookieOptions(configService: ConfigService): CookieOptions {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
}
