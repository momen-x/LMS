import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UserRole } from '@prisma/client';
import { LessonRepository } from './lesson.repo';
import { SectionService } from 'src/section/section.service';

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepo: LessonRepository,
    private readonly sectionService: SectionService,
  ) {}

  async create(
    userId: string,
    role: UserRole,
    createLessonDto: CreateLessonDto,
    sectionId: string,
  ) {
    const section = await this.sectionService.findOrThrow(sectionId);
    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      section.courseId,
    );
    const maxOrder = await this.lessonRepo.getMaxOrder(sectionId);
    return this.lessonRepo.create(createLessonDto, sectionId, maxOrder);
  }

  findAll() {
    return this.lessonRepo.find();
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const lesson = await this.findOrThrow(id);
    await this.sectionService.validateCourseAccess(
      userId,
      role,
      lesson.section.courseId,
    );
    return lesson;
  }
  async findBySectionId(userId: string, role: UserRole, sectionId: string) {
    const section = await this.sectionService.findOrThrow(sectionId);
    await this.sectionService.validateCourseAccess(
      userId,
      role,
      section.courseId,
    );
    return this.lessonRepo.findBySectionId(sectionId);
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateLessonDto: UpdateLessonDto,
  ) {
    const lesson = await this.findOrThrow(id);
    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      lesson.section.courseId,
    );

    return this.lessonRepo.update(id, updateLessonDto);
  }
  async remove(id: string, userId: string, role: UserRole) {
    const lesson = await this.findOrThrow(id);
    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      lesson.section.courseId,
    );
    return this.lessonRepo.remove(id);
  }

  async findOrThrow(id: string) {
    const lesson = await this.lessonRepo.findOne(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
}
