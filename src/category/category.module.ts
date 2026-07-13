import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaCategoryRepository } from './category-prisma.repo';
import { CategoryRepository } from './category.repo';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
  ],
})
export class CategoryModule {}
