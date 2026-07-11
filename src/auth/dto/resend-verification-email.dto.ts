import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResendVerificationEmailDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;
}
