import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Media } from './entities/media.entity';

export abstract class MediaRepository {
  abstract create(
    data: CreateMediaDto,
    lessonId: string,
    url: string,
    urlPublicId?: string,
  ): Promise<Media>;
  abstract findAll(): Promise<Media[]>;
  abstract findOne(id: string): Promise<Media | null>;
  abstract findByLessonId(lessonId: string): Promise<Media[]>;
  abstract update(
    id: string,
    data: UpdateMediaDto,
    url?: string,
    urlPublicId?: string,
  ): Promise<Media>;
  abstract remove(id: string): Promise<Media>;
}
