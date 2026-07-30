import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseWhereFilter } from './types/course-query.type';
import { CourseRepository } from './course.repo';
import { CourseStatus, UserRole } from '@prisma/client';
import { QueryCourseDto } from './dto/search-query.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CategoryService } from 'src/category/category.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoryService: CategoryService,
  ) {}

  async create(
    role: UserRole,
    id: string,
    createCourseDto: CreateCourseDto,
    file?: Express.Multer.File,
  ) {
    if (role !== UserRole.instructor && role !== UserRole.admin) {
      throw new ForbiddenException('Failed to create course');
    }

    await this.categoryService.findOne(createCourseDto.categoryId);
    let thumbnailURL: string | null = null;
    let thumbnailPublicId: string | null = null;
    if (file) {
      const uploadedImage = await this.cloudinaryService.uploadFile(
        file,
        'thumbnail',
      );
      thumbnailURL = uploadedImage.url;
      thumbnailPublicId = uploadedImage.publicId;
    }

    return this.courseRepository.create(
      id,
      createCourseDto,
      thumbnailURL,
      thumbnailPublicId,
    );
  }

  findAll(page: number, limit: number) {
    const { skip } = this.skipAndTake(page, limit);
    return this.courseRepository.find(skip, limit);
  }
  finsInstructorCourses(instructorId: string, role: UserRole) {
    if (role !== UserRole.admin && role !== UserRole.instructor)
      throw new ForbiddenException("you can't find instructor courses");

    return this.courseRepository.findInstructorCourses(instructorId);
  }
  findOne(id: string) {
    return this.findOrThrow(id);
  }
  async findByQuery(dto: QueryCourseDto) {
    const {
      title,
      category,
      level,
      language,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = dto;

    const where: CourseWhereFilter = {
      status: CourseStatus.published,
      ...(title && {
        title: { contains: title, mode: 'insensitive' },
      }),
      ...(category && { categoryId: category }),
      ...(level && { level }),
      ...(language && { language }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
    };

    const { skip } = this.skipAndTake(page, limit);

    const { courses, total } = await this.courseRepository.findByQuery(
      where,
      skip,
      limit,
    );

    return {
      courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateCourseDto: UpdateCourseDto,
    file?: Express.Multer.File,
  ) {
    this.isAuthorized(role);
    const course = await this.findOrThrow(id);
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Failed to update course');
    }
    if (updateCourseDto.categoryId) {
      await this.categoryService.findOne(updateCourseDto.categoryId);
    }

    let thumbnailURL: string | null = null;
    if (file) {
      if (course.thumbnail) {
        if (course.thumbnailPublicId)
          await this.cloudinaryService.deleteFile(course.thumbnailPublicId);
      }
      const uploadedImage = await this.cloudinaryService.uploadFile(
        file,
        'thumbnail',
      );
      thumbnailURL = uploadedImage.url;
    }
    return this.courseRepository.update(id, updateCourseDto, thumbnailURL);
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    this.isAuthorized(role);
    const course = await this.findOrThrow(id);
    if (course.instructorId !== instructorId)
      throw new ForbiddenException('Failed to delete course');
    if (course.thumbnailPublicId) {
      await this.cloudinaryService.deleteFile(course.thumbnailPublicId);
    }
    return this.courseRepository.delete(id);
  }

  private async findOrThrow(id: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }
  private isAuthorized(role: UserRole) {
    if (role !== UserRole.instructor) throw new ForbiddenException('Failed');
    return true;
  }
  private skipAndTake(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return { skip };
  }
}
