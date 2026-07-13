/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CourseLevel } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  description!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 99.99 })
  price!: number;

  @IsEnum(CourseLevel)
  @ApiProperty({ enum: CourseLevel })
  level!: CourseLevel;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: 'en' })
  language!: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  @ApiPropertyOptional({ description: 'Thumbnail URL of the course' })
  thumbnail?: string;
}
