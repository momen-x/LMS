import { ApiProperty } from '@nestjs/swagger';
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
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  url!: string;
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
