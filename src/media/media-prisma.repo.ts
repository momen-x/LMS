import { Injectable } from '@nestjs/common';
import { MediaRepository } from './media.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Media } from './entities/media.entity';
import { CreateMediaInputs, UpdateMediaInputs } from './types/media.type';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { CloudinaryResourceType } from 'src/cloudinary/cloudinary.service';
import { syncLessonDuration } from 'src/common/prisma/course-stats';

@Injectable()
export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(
    data: CreateMediaInputs,
    lessonId: string,
    url: string,
    urlPublicId?: string | null,
    cloudinaryResourceType?: CloudinaryResourceType | null,
  ): Promise<Media> {
    return this.prisma.$transaction(async (transaction) => {
      const media = await transaction.media.create({
        data: {
          ...data,
          lessonId,
          url,
          urlPublicId,
          cloudinaryResourceType,
        },
      });
      await syncLessonDuration(transaction, lessonId);
      return media;
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
    urlPublicId?: string | null,
    cloudinaryResourceType?: CloudinaryResourceType | null,
  ): Promise<Media> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.media.findUniqueOrThrow({
        where: { id },
        select: { lessonId: true },
      });
      const media = await transaction.media.update({
        where: { id },
        data: { ...data, urlPublicId, url, cloudinaryResourceType },
      });
      await syncLessonDuration(transaction, existing.lessonId);
      return media;
    });
  }
  remove(id: string): Promise<Media> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.media.findUniqueOrThrow({
        where: { id },
        select: { lessonId: true },
      });
      const media = await transaction.media.delete({ where: { id } });
      await syncLessonDuration(transaction, existing.lessonId);
      return media;
    });
  }
}
