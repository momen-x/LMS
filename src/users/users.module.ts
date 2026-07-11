import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';
import { UserRepository } from './users.repo';
import { PrismaUserRepository } from './users-prisma.repo';
import { RolesGuard } from '../auth/guard/user-guard.guard';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    RolesGuard,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  imports: [AuthModule],
})
export class UsersModule {}
