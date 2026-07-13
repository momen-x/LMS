import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @ApiProperty()
  order!: number;
}
