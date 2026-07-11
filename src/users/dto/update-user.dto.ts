import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsString()
  @MinLength(8)
  @IsNotEmpty({ message: 'password must be provided, not empty!!' })
  password!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty({
    message: 'newPassword must be provided when updating password',
  })
  newPassword!: string;
}
export class UpdateUserNameDto {
  @IsString()
  @Length(3, 50)
  @IsNotEmpty({ message: 'name must be provided, not empty!!' })
  name!: string;
}
