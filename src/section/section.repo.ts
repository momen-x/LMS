import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { Section } from './entities/section.entity';

export abstract class SectionRepository {
  abstract find(): Promise<Section[]>;
  abstract findById(id: string): Promise<Section | null>;
  abstract findByCourseId(courseId: string): Promise<Section[]>;
  abstract findByCourseAndOrder(
    courseId: string,
    order: number,
  ): Promise<Section | null>;
  abstract create(data: CreateSectionDto, courseId: string): Promise<Section>;
  abstract update(id: string, data: UpdateSectionDto): Promise<Section>;
  abstract delete(id: string): Promise<Section>;
}
