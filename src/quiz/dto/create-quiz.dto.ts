/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty()
  //   @MaxLength(450)
  @MinLength(5)
  @IsString()
  @IsNotEmpty()
  title!: string;
}
