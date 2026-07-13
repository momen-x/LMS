import { Injectable } from '@nestjs/common';
import { CategoryRepository } from './category.repo';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany();
    return categories.map(
      (category) =>
        new Category(
          category.id,
          category.name,
          category.slug,
          category.createdAt,
          category.updatedAt,
        ),
    );
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    return category;
  }

  async create(data: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data,
    });
    return category;
  }
  async update(id: string, data: UpdateCategoryDto) {
    const category = await this.prisma.category.update({
      where: { id },
      data,
    });
    return category;
  }
  async delete(id: string) {
    const category = await this.prisma.category.delete({ where: { id } });
    return category;
  }
}
