import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateChoiceDto {
  @ApiProperty({ required: true })
  @MinLength(5)
  @IsString()
  @IsNotEmpty()
  text!: string;
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean = false;
}
