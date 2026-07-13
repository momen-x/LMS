import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/UseGuards.guard';
import { RolesGuard } from 'src/auth/guard/user-guard.guard';
import { Roles } from 'src/auth/decorator/user-role.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorator/authenticated-user.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Create new category' })
  @ApiOperation({ summary: 'Create New Category' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @AuthenticatedUser() user: { role: UserRole },
  ) {
    return this.categoryService.create(user.role, createCategoryDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'get all categories' })
  @ApiOperation({ summary: 'Get all Categories' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'get category by id' })
  @ApiOperation({ summary: 'get single category' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Update category' })
  @ApiOperation({ summary: 'Update Category' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @AuthenticatedUser() user: { role: UserRole },
  ) {
    return this.categoryService.update(id, user.role, updateCategoryDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Delete category' })
  @ApiOperation({ summary: 'Delete category' })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.admin)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
