import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateQuestionBankDto } from './create-question-bank.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateQuestionBankDto extends PartialType(CreateQuestionBankDto) {}

export class MoveQuestionBankDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  courseId!: string;
}
