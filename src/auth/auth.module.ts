import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './auth.repo';
import { PrismaAuthRepository } from './auth-prisma.repo';
import { MailModule } from 'src/mail/mail.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { CsrfService } from 'src/common/security/csrf/csrf.service';
import { CsrfSessionMiddleware } from 'src/common/security/csrf/csrf-session.middleware';
import { OAuthStateMiddleware } from './oauth-state.middleware';
import { GoogleAuthGuard } from './guard/google-auth.guard';
import { GithubAuthGuard } from './guard/github-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    CsrfService,
    CsrfSessionMiddleware,
    OAuthStateMiddleware,
    GoogleAuthGuard,
    GithubAuthGuard,
    { provide: AuthRepository, useClass: PrismaAuthRepository },
  ],
  exports: [AuthService, AuthRepository],
  imports: [JwtModule.register({}), MailModule],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OAuthStateMiddleware)
      .forRoutes('auth/google', 'auth/github');
  }
}
