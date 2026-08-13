import {
  BadRequestException,
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
import { NotificationsService } from 'src/notification/notification.service';
import { CreateRejectedMessageDto } from './dto/create-rejected-message.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoryService: CategoryService,
    private readonly notificationService: NotificationsService,
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
  findPendingCourses() {
    return this.courseRepository.findPendingCourses();
  }
  findOne(id: string) {
    return this.findOrThrow(id);
  }
  async getLearningContent(courseId: string, userId: string, role: UserRole) {
    const learningContent = await this.courseRepository.findLearningContent(
      courseId,
      userId,
    );
    if (!learningContent) throw new NotFoundException('Course not found');

    const isAdmin = role === UserRole.admin;
    const isOwner = learningContent.instructorId === userId;
    if (!learningContent.enrollment && !isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You must be enrolled in this course to access its learning content',
      );
    }

    return learningContent;
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
  async findHighRating(count?: number) {
    return this.courseRepository.findHighRating(count ?? 1);
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
    let thumbnailPublicId: string | undefined;
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
      thumbnailPublicId = uploadedImage.publicId;
    }
    const updated = await this.courseRepository.update(
      id,
      updateCourseDto,
      file ? thumbnailURL : course.thumbnail,
      thumbnailPublicId,
    );
    // Published content edits require a fresh admin review; draft edits remain draft.
    if (course.status === CourseStatus.published) {
      return this.courseRepository.updateCourseStatus(
        id,
        'pending_review',
        null,
      );
    }
    return updated;
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    this.isAuthorized(role);
    const course = await this.findOrThrow(id);
    if (course.instructorId !== instructorId)
      if (role !== UserRole.admin) {
        throw new ForbiddenException('Failed to delete course');
      }
    if (course.thumbnailPublicId) {
      await this.cloudinaryService.deleteFile(course.thumbnailPublicId);
    }
    return this.courseRepository.delete(id);
  }
  getInstructorEnrollmentStats(instructorId: string, role: UserRole) {
    if (role !== UserRole.instructor && role !== UserRole.admin) {
      throw new ForbiddenException(
        'Only instructors and admins can access enrollment statistics',
      );
    }

    return this.courseRepository.getInstructorEnrollmentStats(instructorId);
  }
  async approveCourse(id: string, role: UserRole) {
    if (role !== UserRole.admin) {
      throw new ForbiddenException('Only admins can approve courses');
    }

    const course = await this.findOrThrow(id);
    if (course.status !== CourseStatus.pending_review) {
      throw new BadRequestException('Only pending courses can be approved');
    }

    const updatedCourse = await this.courseRepository.updateCourseStatus(
      id,
      CourseStatus.published,
      new Date(),
    );

    await this.notificationService.create({
      text: `Your course "${updatedCourse.title}" has been approved and is now published.`,
      userId: updatedCourse.instructorId,
      title: 'Course Approved',
      type: 'info',
    });

    return updatedCourse;
  }
  async rejectCourse(
    id: string,
    dto: CreateRejectedMessageDto,
    role: UserRole,
  ) {
    if (role !== UserRole.admin) {
      throw new ForbiddenException('Only admins can reject courses');
    }

    const course = await this.findOrThrow(id);
    if (course.status !== CourseStatus.pending_review) {
      throw new ForbiddenException('Course is already approved or rejected');
    }

    const updatedCourse = await this.courseRepository.updateCourseStatus(
      id,
      CourseStatus.draft,
      null,
    );

    await this.notificationService.create({
      text: dto.text,
      userId: updatedCourse.instructorId,
      title: 'Course Rejected',
      type: 'info',
    });

    return updatedCourse;
  }

  async submitCourseForReview(
    id: string,
    instructorId: string,
    role: UserRole,
  ) {
    const course = await this.findOrThrow(id);
    if (role !== UserRole.admin && course.instructorId !== instructorId) {
      throw new ForbiddenException('Only the course owner can submit it');
    }
    if (course.status !== CourseStatus.draft) {
      throw new BadRequestException('Only draft courses can be submitted');
    }
    const readiness = await this.courseRepository.getSubmissionReadiness(id);
    if (!readiness) throw new NotFoundException('Course not found');

    const missing: string[] = [];
    if (!course.categoryId) missing.push('category');
    if (!course.title.trim()) missing.push('title');
    if (!course.description.trim()) missing.push('description');
    if (!course.thumbnail) missing.push('thumbnail');
    if (readiness.sectionsCount === 0) missing.push('section');
    if (readiness.lessonsCount === 0) missing.push('lesson');
    if (missing.length > 0) {
      throw new BadRequestException(
        `Course is incomplete: ${missing.join(', ')}`,
      );
    }

    const submitted = await this.courseRepository.updateCourseStatus(
      id,
      'pending_review',
      null,
    );
    await Promise.all([
      this.notificationService.create({
        userId: course.instructorId,
        title: 'Course submitted for review',
        text: `${course.title} was submitted for admin review.`,
        type: 'info',
      }),
      this.notificationService.createForAdmins({
        title: 'Course submitted for review',
        text: `${course.title} is ready for review.`,
        type: 'info', // The type property is part of Omit<CreateNotificationInput, 'userId'>
      }),
    ]);
    return submitted;
  }

  private async findOrThrow(id: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }
  private isAuthorized(role: UserRole) {
    if (role !== UserRole.instructor && role !== UserRole.admin)
      throw new ForbiddenException('Failed');
    return true;
  }
  private skipAndTake(page: number = 1, limit: number = 10): { skip: number } {
    const skip = (page - 1) * limit;
    return { skip };
  }
}
