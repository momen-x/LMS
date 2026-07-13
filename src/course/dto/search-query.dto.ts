import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QueryCourseDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Search by title' })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Filter by category id' })
  category?: string;

  @IsEnum(CourseLevel)
  @IsOptional()
  @ApiPropertyOptional({ enum: CourseLevel })
  level?: CourseLevel;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  language?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Minimum price' })
  minPrice?: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({ description: 'Maximum price' })
  maxPrice?: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiPropertyOptional({ default: 10 })
  limit?: number = 10;
}
