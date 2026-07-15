import { Lesson } from './entities/lesson.entity';
import { CreateLessonInput, UpdateLessonInput } from './types/lesson.type';

export abstract class LessonRepository {
  abstract find(): Promise<Lesson[]>;
  abstract findOne(id: string): Promise<Lesson | null>;
  abstract findBySectionId(sectionId: string): Promise<Lesson[]>;
  abstract create(
    dto: CreateLessonInput,
    sectionId: string,
    order: number,
  ): Promise<Lesson>;
  abstract update(id: string, dto: UpdateLessonInput): Promise<Lesson>;
  abstract remove(id: string): Promise<Lesson>;
  abstract getMaxOrder(sectionId: string): Promise<number>;
}
