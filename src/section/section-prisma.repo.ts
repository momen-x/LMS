import { Injectable } from '@nestjs/common';
import { SectionRepository } from './section.repo';
import { CreateSectionDto } from './dto/create-section.dto';
import { Section } from './entities/section.entity';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class PrismaSectionRepository implements SectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSectionDto, courseId: string): Promise<Section> {
    return this.prisma.section.create({ data: { ...data, courseId } });
  }
  find(): Promise<Section[]> {
    return this.prisma.section.findMany();
  }
  findById(id: string): Promise<Section | null> {
    return this.prisma.section.findUnique({ where: { id } });
  }
  findByCourseId(courseId: string): Promise<Section[]> {
    return this.prisma.section.findMany({
      where: { courseId },
      orderBy: {
        order: 'asc',
      },
    });
  }
  findByCourseAndOrder(
    courseId: string,
    order: number,
  ): Promise<Section | null> {
    return this.prisma.section.findFirst({
      where: { courseId, order },
    });
  }
  update(id: string, data: UpdateSectionDto): Promise<Section> {
    return this.prisma.section.update({ where: { id }, data });
  }
  delete(id: string): Promise<Section> {
    return this.prisma.section.delete({
      where: { id },
    });
  }
}
