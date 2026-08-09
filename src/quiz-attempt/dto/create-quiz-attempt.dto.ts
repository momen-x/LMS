import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SaveAttemptAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  choiceId!: string;
}
