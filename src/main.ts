import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
// import { doubleCsrf } from 'csrf-csrf';
// import './config/cloudinary.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useStaticAssets(join(__dirname, '..', 'images'), {
    prefix: '/images',
  });
  app.use(helmet());
  app.enableCors({
    origin: ['http://localhost:3000' /** FRONTEND_URL*/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // const { doubleCsrfProtection } = doubleCsrf({
  //   getSecret: () => process.env.CSRF_SECRET!,
  //   cookieName: 'x-csrf-token',
  //   cookieOptions: {
  //     sameSite: 'strict',
  //     secure: process.env.NODE_ENV === 'production',
  //     path: '/',
  //   },
  //   size: 64,
  //   ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  // });

  // app.use(
  //   (
  //     req: express.Request,
  //     res: express.Response,
  //     next: express.NextFunction,
  //   ) => {
  //     const exemptPaths = [
  //       '/auth/register',
  //       '/auth/login',
  //       '/auth/refresh',
  //       '/auth/csrf-token',
  //     ];
  //     const normalizedPath = req.path.replace(/^\/api/, '');

  //     if (exemptPaths.includes(normalizedPath)) {
  //       return next();
  //     }

  //     return doubleCsrfProtection(req, res, next);
  //   },
  // );
  const swagger = new DocumentBuilder()
    .setTitle('Learning Management System LMS API')
    .setDescription(
      `Full-featured Learning Management System with NestJS, Prisma & PostgreSQL. Multi-role auth, course management, quizzes, payments, certificates, and progress tracking.`,
    )
    .addServer('http://localhost:5000', 'Local server')
    .addBearerAuth()
    .setVersion('1.0')
    .setTermsOfService('https://www.google.com/') //here add your terms and privacy policy
    // .setLicense('MIT License', 'https://www.google.com/')
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  //http://localhost:5000/api
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 5000);
}
void bootstrap();
