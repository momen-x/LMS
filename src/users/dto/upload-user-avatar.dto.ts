import { ApiProperty } from '@nestjs/swagger';
import type { Express } from 'express';

export class UploadUserAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
    name: 'avatar',
  })
  file!: Express.Multer.File;
}
