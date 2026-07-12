import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOAuthUserData {
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail()
  @IsString()
  @MinLength(7)
  @ApiProperty()
  email!: string;
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8)
  @ApiProperty()
  name!: string;
  provider!: 'google' | 'github';
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  providerId!: string;
  @IsBoolean()
  @IsNotEmpty()
  isVerified?: true;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  avatar?: string | null;
}
