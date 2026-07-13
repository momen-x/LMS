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

@Injectable()
export class SectionService {
  constructor(
    private readonly sectionRepo: SectionRepository,
    private readonly courseService: CourseService,
  ) {}

  async create(
    instructorId: string,
    role: UserRole,
    createSectionDto: CreateSectionDto,
    courseId: string,
  ) {
    await this.isAuthorized(role, instructorId, courseId);
    const existingSection = await this.sectionRepo.findByCourseAndOrder(
      courseId,
      createSectionDto.order,
    );

    if (existingSection) {
      throw new ConflictException(
        `Section order ${createSectionDto.order} already exists in this course`,
      );
    }
    return this.sectionRepo.create(createSectionDto, courseId);
  }

  findAll() {
    return this.sectionRepo.find();
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }
  findByCourseId(courseId: string) {
    return this.sectionRepo.findByCourseId(courseId);
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateSectionDto: UpdateSectionDto,
  ) {
    const section = await this.findOrThrow(id);
    await this.isAuthorized(role, instructorId, section.courseId);

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
    await this.isAuthorized(role, instructorId, section.courseId);

    return this.sectionRepo.delete(id);
  }
  private async findOrThrow(id: string) {
    const section = await this.sectionRepo.findById(id);
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }

  async isAuthorized(role: UserRole, instructorId: string, courseId: string) {
    if (role !== UserRole.instructor)
      throw new ForbiddenException('Only instructors can perform this action');
    const course = await this.courseService.findOne(courseId);
    if (course.instructorId !== instructorId)
      throw new ForbiddenException('You are not the owner of this course');
    return true;
  }
}
