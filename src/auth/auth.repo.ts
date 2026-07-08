import { User } from 'src/users/entities/user.entity';
import { RegisterUserDto } from './dto/register-auth.dto';

export abstract class AuthRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: RegisterUserDto): Promise<User>;
  abstract updateLastLogin(id: string): Promise<User>;
  abstract updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<User>;
}
