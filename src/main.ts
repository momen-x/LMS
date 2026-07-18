import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { CsrfService } from './common/security/csrf/csrf.service';
import { CsrfSessionMiddleware } from './common/security/csrf/csrf-session.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);
  configService.getOrThrow<string>('CSRF_SECRET');

  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.useStaticAssets(join(__dirname, '..', 'images'), {
    prefix: '/images',
  });
  app.use(helmet());
  app.use(cookieParser());

  const csrfSessionMiddleware = app.get(CsrfSessionMiddleware);
  app.use(csrfSessionMiddleware.use.bind(csrfSessionMiddleware));

  const corsOrigins = (
    configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:3000'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
  });

  const csrfService = app.get(CsrfService);
  app.use(
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
      csrfService.protect(req, res, next),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const swagger = new DocumentBuilder()
    .setTitle('Learning Management System LMS API')
    .setDescription(
      `Full-featured Learning Management System with NestJS, Prisma & PostgreSQL. Multi-role auth, course management, quizzes, payments, certificates, and progress tracking.`,
    )
    .addServer('http://localhost:5000', 'Local server')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-CSRF-Token',
        in: 'header',
        description:
          'Required for unsafe browser requests when auth cookies are present.',
      },
      'X-CSRF-Token',
    )
    .setVersion('1.0')
    .setTermsOfService('https://www.google.com/')
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  //http://localhost:5000/api
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();
