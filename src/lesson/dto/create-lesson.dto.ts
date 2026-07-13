import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { LessonResourceDto } from './lesson-resourse.dto';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  description?: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({ example: 12, description: 'Duration in seconds' })
  duration?: number;

  // @Transform(({ value }) => Number(value))
  // @IsNumber()
  // @Min(1)
  // @ApiProperty({ example: 1 })
  // order!: number;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({ default: false })
  isPreview?: boolean;

  @ValidateNested({ each: true })
  @Type(() => LessonResourceDto)
  @IsOptional()
  @ApiPropertyOptional({ type: [LessonResourceDto] })
  resources?: LessonResourceDto[];
}
