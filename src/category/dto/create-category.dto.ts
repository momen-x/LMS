import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(4)
  @IsNotEmpty()
  @ApiProperty()
  name!: string;
  @IsString()
  @MinLength(4)
  @IsNotEmpty()
  @ApiProperty()
  slug!: string;
}
