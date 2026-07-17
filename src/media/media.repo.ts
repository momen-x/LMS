import { Lesson } from 'src/lesson/entities/lesson.entity';
import { Media } from './entities/media.entity';
import { CreateMediaInputs, UpdateMediaInputs } from './types/media.type';

export abstract class MediaRepository {
  abstract create(
    data: CreateMediaInputs,
    lessonId: string,
    url: string,
    urlPublicId?: string,
  ): Promise<Media>;
  abstract findAll(): Promise<Media[]>;
  abstract findOne(id: string): Promise<(Media & { lesson: Lesson }) | null>;
  abstract findByLessonId(lessonId: string): Promise<Media[]>;
  abstract update(
    id: string,
    data: UpdateMediaInputs,
    url?: string,
    urlPublicId?: string,
  ): Promise<Media>;
  abstract remove(id: string): Promise<Media>;
}
