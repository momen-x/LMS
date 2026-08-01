import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRejectedMessageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  text!: string;
}
