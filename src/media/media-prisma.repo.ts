import { Injectable } from '@nestjs/common';
import { MediaRepository } from './media.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Media } from './entities/media.entity';
import { CreateMediaInputs, UpdateMediaInputs } from './types/media.type';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { CloudinaryResourceType } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(
    data: CreateMediaInputs,
    lessonId: string,
    url: string,
    urlPublicId?: string,
    cloudinaryResourceType?: CloudinaryResourceType,
  ): Promise<Media> {
    return this.prisma.media.create({
      data: {
        ...data,
        lessonId,
        url,
        urlPublicId,
        cloudinaryResourceType,
      },
    });
  }
  findAll(): Promise<Media[]> {
    return this.prisma.media.findMany();
  }
  findOne(id: string): Promise<(Media & { lesson: Lesson }) | null> {
    return this.prisma.media.findUnique({
      where: {
        id,
      },
      include: { lesson: true },
    });
  }
  findByLessonId(lessonId: string): Promise<Media[]> {
    return this.prisma.media.findMany({
      where: {
        lessonId,
      },
    });
  }
  update(
    id: string,
    data: UpdateMediaInputs,
    url?: string,
    urlPublicId?: string,
    cloudinaryResourceType?: CloudinaryResourceType,
  ): Promise<Media> {
    return this.prisma.media.update({
      where: {
        id,
      },
      data: { ...data, urlPublicId, url, cloudinaryResourceType },
    });
  }
  remove(id: string): Promise<Media> {
    return this.prisma.media.delete({
      where: {
        id,
      },
    });
  }
}
