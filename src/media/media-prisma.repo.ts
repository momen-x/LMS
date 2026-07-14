import { Injectable } from '@nestjs/common';
import { MediaRepository } from './media.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Media } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Injectable()
export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaService) {}
  create(
    data: CreateMediaDto,
    lessonId: string,
    url: string,
    urlPublicId?: string,
  ): Promise<Media> {
    return this.prisma.media.create({
      data: {
        ...data,
        lessonId,
        url,
        urlPublicId,
      },
    });
  }
  findAll(): Promise<Media[]> {
    return this.prisma.media.findMany();
  }
  findOne(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({
      where: {
        id,
      },
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
    data: UpdateMediaDto,
    url?: string,
    urlPublicId?: string,
  ): Promise<Media> {
    return this.prisma.media.update({
      where: {
        id,
      },
      data: { ...data, urlPublicId, url },
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
