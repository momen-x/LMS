import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

export abstract class CategoryRepository {
  abstract find(): Promise<Category[]>;
  abstract findById(id: string): Promise<Category | null>;
  abstract create(data: CreateCategoryDto): Promise<Category>;
  abstract update(id: string, data: UpdateCategoryDto): Promise<Category>;
  abstract delete(id: string): Promise<Category>;
}
