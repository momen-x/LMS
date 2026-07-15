import { Section } from './entities/section.entity';
import { CreateSectionInputs, UpdateCourseInputs } from './types/section.type';

export abstract class SectionRepository {
  abstract find(): Promise<Section[]>;
  abstract findById(id: string): Promise<Section | null>;
  abstract findByCourseId(courseId: string): Promise<Section[]>;
  abstract findByCourseAndOrder(
    courseId: string,
    order: number,
  ): Promise<Section | null>;
  abstract create(
    data: CreateSectionInputs,
    courseId: string,
  ): Promise<Section>;
  abstract update(id: string, data: UpdateCourseInputs): Promise<Section>;
  abstract delete(id: string): Promise<Section>;
}
