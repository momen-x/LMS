import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './auth.repo';
import { PrismaAuthRepository } from './auth-prisma.repo';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: AuthRepository, useClass: PrismaAuthRepository },
  ],
  exports: [AuthService, AuthRepository],
  imports: [JwtModule.register({})],
})
export class AuthModule {}
