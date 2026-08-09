/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Max,
  Min,
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
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionBankId!: string;
  @ApiProperty()
  @IsInt()
  @Min(1)
  questionCount!: number;
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  passingScore?: number;
  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;
  @ApiProperty({ example: 30, description: 'Quiz duration in minutes' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  duration!: number;
}
