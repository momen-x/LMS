import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    instructorId: string,
    role: UserRole,
    createLessonDto: CreateLessonDto,
    sectionId: string,
  ) {
    await this.validateInstructorOwnership(instructorId, role, sectionId);
    const maxOrder = await this.lessonRepo.getMaxOrder(sectionId);
    return this.lessonRepo.create(createLessonDto, sectionId, maxOrder);
  }

  findAll() {
    return this.lessonRepo.find();
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }
  findBySectionId(sectionId: string) {
    return this.lessonRepo.findBySectionId(sectionId);
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateLessonDto: UpdateLessonDto,
  ) {
    const lesson = await this.findOrThrow(id);
    await this.validateInstructorOwnership(
      instructorId,
      role,
      lesson.sectionId,
    );

    return this.lessonRepo.update(id, updateLessonDto);
  }
  async remove(id: string, instructorId: string, role: UserRole) {
    const lesson = await this.findOrThrow(id);
    await this.validateInstructorOwnership(
      instructorId,
      role,
      lesson.sectionId,
    );
    return this.lessonRepo.remove(id);
  }

  private async findOrThrow(id: string) {
    const lesson = await this.lessonRepo.findOne(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
  async validateInstructorOwnership(
    instructorId: string,
    role: UserRole,
    sectionId: string,
  ) {
    if (role !== UserRole.instructor && role !== UserRole.admin)
      throw new ForbiddenException(
        'Only instructors and admins can perform this action',
      );
    if (role === UserRole.admin) return;
    const section = await this.sectionService.findOne(sectionId, instructorId, role);
    await this.sectionService.isAuthorized(
      instructorId,
      role,
      section.courseId,
    );
  }
  // async whoCanAccessIt(userId: string,role: UserRole, courseId: string) {
  //   if(role === UserRole.admin) return;
  //   if(role === UserRole.instructor){
  //     const course = await this.sectionService.findOne(courseId);
  //     if(course.instructorId === userId) return;
  //   }
  // }
}
