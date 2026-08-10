/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateMediaDto {
  @IsEnum(MediaType)
  @IsNotEmpty()
  @ApiProperty({ enum: MediaType })
  type!: MediaType;
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @ApiProperty({
    example: 1000,
    required: false,
    description: 'Duration in seconds',
  })
  @IsOptional()
  duration?: number;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  @ApiPropertyOptional({ example: 'https://example.com/resource' })
  url?: string;
}
