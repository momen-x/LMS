import { ApiProperty } from '@nestjs/swagger';
import { LearningItemType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateLearningPositionDto {
  @ApiProperty({ enum: LearningItemType })
  @IsEnum(LearningItemType)
  type!: LearningItemType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemId!: string;
}
