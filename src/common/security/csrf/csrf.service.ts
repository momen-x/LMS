import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { createCsrfConfig, type CsrfConfiguration } from './csrf.config';

@Injectable()
export class CsrfService {
  private readonly config: CsrfConfiguration;

  constructor(private readonly configService: ConfigService) {
    this.config = createCsrfConfig(this.configService);
  }

  getCsrfToken(req: Request, res: Response): string {
    return this.config.generateCsrfToken(req, res);
  }

  protect(req: Request, res: Response, next: NextFunction): void {
    if (this.config.shouldSkipCsrf(req)) {
      next();
      return;
    }

    this.config.doubleCsrfUtilities.doubleCsrfProtection(req, res, (error) => {
      if (error) {
        if (error !== this.config.doubleCsrfUtilities.invalidCsrfTokenError) {
          next(error);
          return;
        }
        res.status(403).json({
          statusCode: 403,
          error: 'Forbidden',
          code: 'INVALID_CSRF_TOKEN',
          message: 'Invalid or missing CSRF token',
          path: req.originalUrl || req.url || '/',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next();
    });
  }
}
