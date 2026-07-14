import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStudentAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  choiceId!: string;
}
