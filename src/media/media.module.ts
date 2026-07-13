import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { LessonModule } from 'src/lesson/lesson.module';
import { MediaRepository } from './media.repo';
import { PrismaMediaRepository } from './media-prisma.repo';
import { LessonMediaController } from './lesson-media.controller';

@Module({
  controllers: [MediaController, LessonMediaController],
  providers: [
    MediaService,
    { provide: MediaRepository, useClass: PrismaMediaRepository },
  ],
  imports: [LessonModule],
})
export class MediaModule {}
