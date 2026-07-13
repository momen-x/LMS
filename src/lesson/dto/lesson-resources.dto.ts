import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class LessonResourceDto {
  @IsString()
  @ApiProperty()
  title!: string;
  @IsString()
  @ApiProperty()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  url!: string;
}
