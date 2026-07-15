import { Category } from './entities/category.entity';
import {
  CreateCategoryInputs,
  UpdateCategoryInputs,
} from './types/category.type';

export abstract class CategoryRepository {
  abstract find(): Promise<Category[]>;
  abstract findById(id: string): Promise<Category | null>;
  abstract create(data: CreateCategoryInputs): Promise<Category>;
  abstract update(id: string, data: UpdateCategoryInputs): Promise<Category>;
  abstract delete(id: string): Promise<Category>;
}
