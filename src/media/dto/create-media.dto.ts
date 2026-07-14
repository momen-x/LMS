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
  Min,
} from 'class-validator';

export class CreateMediaDto {
  // @IsString()
  // @IsOptional()
  // @Transform(({ value }) => {
  //   if (typeof value === 'string') {
  //     return value.trim();
  //   }
  //   return value;
  // })
  // @ApiPropertyOptional({ description: 'file URL of the media' })
  // url!: string;
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
}
