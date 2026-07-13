import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from './category.repo';
import { UserRole } from '@prisma/client';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}
  create(role: UserRole, createCategoryDto: CreateCategoryDto) {
    if (role !== UserRole.admin) {
      throw new UnauthorizedException('Failed Add category');
    }

    return this.categoryRepository.create(createCategoryDto);
  }

  findAll() {
    return this.categoryRepository.find();
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }

  async update(
    id: string,
    role: UserRole,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.findOrThrow(id);
    if (role != UserRole.admin) {
      throw new UnauthorizedException('Failed Update category');
    }
    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async remove(id: string) {
    await this.findOrThrow(id);
    return this.categoryRepository.delete(id);
  }
  private async findOrThrow(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
