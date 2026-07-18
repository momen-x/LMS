/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuizDto {
  @ApiProperty()
  //   @MaxLength(450)
  @MinLength(5)
  @IsString()
  @IsNotEmpty()
  title!: string;
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  passingScore?: number;
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxAttempts?: number;
}
