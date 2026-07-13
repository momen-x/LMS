import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { LessonService } from 'src/lesson/lesson.service';
import { MediaRepository } from './media.repo';
import { UserRole } from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(
    private readonly lessonService: LessonService,
    private readonly mediaRepo: MediaRepository,
  ) {}
  async create(
    instructorId: string,
    role: UserRole,
    createMediaDto: CreateMediaDto,
    lessonId: string,
  ) {
    await this.validateInstructorOwnership(instructorId, role, lessonId);
    return this.mediaRepo.create(createMediaDto, lessonId);
  }

  findAll() {
    return this.mediaRepo.findAll();
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }
  findByLessonId(lessonId: string) {
    return this.mediaRepo.findByLessonId(lessonId);
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateMediaDto: UpdateMediaDto,
  ) {
    const media = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, media.lessonId);
    return this.mediaRepo.update(id, updateMediaDto);
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    const media = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, media.lessonId);
    return this.mediaRepo.remove(id);
  }
  private async findOrThrow(id: string) {
    const media = await this.mediaRepo.findOne(id);
    if (!media) {
      throw new NotFoundException('this media not found');
    }
    return media;
  }
  async validateInstructorOwnership(
    instructorId: string,
    role: UserRole,
    lessonId: string,
  ) {
    if (role !== UserRole.instructor && role !== UserRole.admin)
      throw new ForbiddenException(
        'Only instructors and admins can perform this action',
      );
    if (role === UserRole.admin) return;
    const lesson = await this.lessonService.findOne(lessonId);
    await this.lessonService.validateInstructorOwnership(
      instructorId,
      role,
      lesson.sectionId,
    );
  }
}
