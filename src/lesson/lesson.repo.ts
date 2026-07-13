import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson } from './entities/lesson.entity';

export abstract class LessonRepository {
  abstract find(): Promise<Lesson[]>;
  abstract findOne(id: string): Promise<Lesson | null>;
  abstract findBySectionId(sectionId: string): Promise<Lesson[]>;
  abstract create(
    dto: CreateLessonDto,
    sectionId: string,
    order: number,
  ): Promise<Lesson>;
  abstract update(id: string, dto: UpdateLessonDto): Promise<Lesson>;
  abstract remove(id: string): Promise<Lesson>;
}
