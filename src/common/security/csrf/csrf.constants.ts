import { CookieOptions } from 'express';

export const CSRF_SESSION_COOKIE_NAME_DEV = 'lms.csrf-id';
export const CSRF_SESSION_COOKIE_NAME_PROD = '__Host-lms.csrf-id';
export const CSRF_TOKEN_COOKIE_NAME_DEV = 'lms.csrf-token';
export const CSRF_TOKEN_COOKIE_NAME_PROD = '__Host-lms.csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

export function getCsrfCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: CSRF_COOKIE_MAX_AGE,
    // Avoid setting a domain unless deployment explicitly requires it.
  };
}
