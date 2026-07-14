import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text!: string;
}
