import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { SectionRepository } from './section.repo';
import { UserRole } from '@prisma/client';
import { CourseService } from 'src/course/course.service';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { NotificationRepository } from 'src/notification/notification.repo';

@Injectable()
export class SectionService {
  constructor(
    private readonly sectionRepo: SectionRepository,
    private readonly enrollmentService: EnrollmentService,
    private readonly courseService: CourseService,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  async create(
    instructorId: string,
    role: UserRole,
    createSectionDto: CreateSectionDto,
    courseId: string,
  ) {
    await this.validateCourseManagementAccess(instructorId, role, courseId);

    const existingSection = await this.sectionRepo.findByCourseAndOrder(
      courseId,
      createSectionDto.order,
    );

    if (existingSection) {
      throw new ConflictException(
        `Section order ${createSectionDto.order} already exists in this course`,
      );
    }
    const section = await this.sectionRepo.create(createSectionDto, courseId);
    await this.notificationRepo.createCourseInformationNotification(
      courseId,
      'New Section Added',
      `A new section titled "${section.title}" has been added to the course.`,
    );
    return section;
  }

  async findAll() {
    return this.sectionRepo.find();
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const section = await this.findOrThrow(id);
    await this.validateCourseAccess(userId, role, section.courseId);
    return section;
  }
  async findByCourseId(userId: string, role: UserRole, courseId: string) {
    await this.validateCourseAccess(userId, role, courseId);
    return this.sectionRepo.findByCourseId(courseId);
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateSectionDto: UpdateSectionDto,
  ) {
    const section = await this.findOrThrow(id);
    await this.validateCourseManagementAccess(
      instructorId,
      role,
      section.courseId,
    );

    if (
      updateSectionDto.order !== undefined &&
      updateSectionDto.order !== section.order
    ) {
      const existingSection = await this.sectionRepo.findByCourseAndOrder(
        section.courseId,
        updateSectionDto.order,
      );

      if (existingSection) {
        throw new ConflictException(
          `Section order ${updateSectionDto.order} already exists in this course`,
        );
      }
    }

    return this.sectionRepo.update(id, updateSectionDto);
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    const section = await this.findOrThrow(id);
    await this.validateCourseManagementAccess(
      instructorId,
      role,
      section.courseId,
    );

    return this.sectionRepo.delete(id);
  }
  async findOrThrow(id: string) {
    const section = await this.sectionRepo.findById(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }
  async validateCourseManagementAccess(
    userId: string,
    role: UserRole,
    courseId: string,
  ) {
    const course = await this.courseService.findOne(courseId);

    if (role === UserRole.admin) {
      return;
    }

    if (role === UserRole.instructor && course.instructorId === userId) {
      return;
    }

    throw new ForbiddenException(
      'Only the course owner or an admin can perform this action',
    );
  }
  async validateCourseAccess(userId: string, role: UserRole, courseId: string) {
    const course = await this.courseService.findOne(courseId);

    if (role === UserRole.admin) {
      return;
    }

    if (role === UserRole.instructor) {
      if (course.instructorId === userId) {
        return;
      }

      throw new ForbiddenException(
        'Only the course owner can access this course content',
      );
    }

    if (role === UserRole.student) {
      const isEnrolled = await this.enrollmentService.isEnrolled(
        userId,
        courseId,
      );

      if (isEnrolled) {
        return;
      }

      throw new ForbiddenException('You are not enrolled in this course');
    }

    throw new ForbiddenException('You do not have access to this course');
  }
}
