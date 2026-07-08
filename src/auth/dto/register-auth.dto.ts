import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @Length(3, 150)
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name!: string;
  @IsEmail()
  @MinLength(7)
  @IsString()
  @IsNotEmpty({ message: 'email is required' })
  @ApiProperty()
  email!: string;
  @MinLength(8)
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  @ApiProperty()
  password!: string;
}
