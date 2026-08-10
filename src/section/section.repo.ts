import { Section } from './entities/section.entity';
import { CreateSectionInputs, UpdateCourseInputs } from './types/section.type';
import { SectionWithCourse } from './section-prisma.repo';

export abstract class SectionRepository {
  abstract find(): Promise<Section[]>;
  abstract findById(id: string): Promise<SectionWithCourse | null>;
  abstract findByCourseId(courseId: string): Promise<Section[]>;
  abstract create(
    data: CreateSectionInputs,
    courseId: string,
  ): Promise<Section>;
  abstract update(id: string, data: UpdateCourseInputs): Promise<Section>;
  abstract delete(id: string): Promise<Section>;
}
