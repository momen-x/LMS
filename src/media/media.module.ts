import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { LessonModule } from 'src/lesson/lesson.module';
import { MediaRepository } from './media.repo';
import { PrismaMediaRepository } from './media-prisma.repo';
import { LessonMediaController } from './lesson-media.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SectionModule } from 'src/section/section.module';

@Module({
  controllers: [MediaController, LessonMediaController],
  providers: [
    MediaService,
    CloudinaryService,
    { provide: MediaRepository, useClass: PrismaMediaRepository },
  ],
  imports: [LessonModule, SectionModule],
})
export class MediaModule {}
