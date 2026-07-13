import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class LessonResourceDto {
  @IsString()
  @ApiProperty()
  title!: string;
  @IsString()
  @ApiProperty()
  @IsUrl()
  url!: string;
}
