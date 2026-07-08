import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
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
  password!: string;
}
