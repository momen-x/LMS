import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { LessonService } from 'src/lesson/lesson.service';
import { MediaRepository } from './media.repo';
import { UserRole } from '@prisma/client';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SectionService } from 'src/section/section.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly lessonService: LessonService,
    private readonly sectionService: SectionService,
    private readonly mediaRepo: MediaRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async create(
    userId: string,
    role: UserRole,
    createMediaDto: CreateMediaDto,
    lessonId: string,
    file: Express.Multer.File,
  ) {
    await this.validateMediaManagementAccess(userId, role, lessonId);

    if (!file) {
      throw new BadRequestException('Media file is required');
    }

    const uploadedMedia = await this.cloudinaryService.uploadFile(
      file,
      'media',
    );

    try {
      return await this.mediaRepo.create(
        createMediaDto,
        lessonId,
        uploadedMedia.url,
        uploadedMedia.publicId,
      );
    } catch (error) {
      await this.cloudinaryService.deleteFile(uploadedMedia.publicId);

      throw error;
    }
  }

  findAll() {
    return this.mediaRepo.findAll();
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const media = await this.findOrThrow(id);
    await this.validateMediaReadAccess(userId, role, media.lessonId);
    return media;
  }
  async findByLessonId(userId: string, role: UserRole, lessonId: string) {
    await this.validateMediaReadAccess(userId, role, lessonId);
    return this.mediaRepo.findByLessonId(lessonId);
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateMediaDto: UpdateMediaDto,
    file?: Express.Multer.File,
  ) {
    const media = await this.findOrThrow(id);

    await this.validateMediaManagementAccess(userId, role, media.lessonId);

    if (!file) {
      return this.mediaRepo.update(id, updateMediaDto);
    }

    const uploadedMedia = await this.cloudinaryService.uploadFile(
      file,
      'media',
    );

    try {
      const updatedMedia = await this.mediaRepo.update(
        id,
        updateMediaDto,
        uploadedMedia.url,
        uploadedMedia.publicId,
      );

      if (media.urlPublicId) {
        await this.cloudinaryService.deleteFile(media.urlPublicId);
      }

      return updatedMedia;
    } catch (error) {
      await this.cloudinaryService.deleteFile(uploadedMedia.publicId);

      throw error;
    }
  }

  async remove(id: string, userId: string, role: UserRole) {
    const media = await this.findOrThrow(id);

    await this.validateMediaManagementAccess(userId, role, media.lessonId);

    const deletedMedia = await this.mediaRepo.remove(id);

    if (media.urlPublicId) {
      await this.cloudinaryService.deleteFile(media.urlPublicId);
    }

    return deletedMedia;
  }
  private async findOrThrow(id: string) {
    const media = await this.mediaRepo.findOne(id);
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }
  async validateMediaManagementAccess(
    userId: string,
    role: UserRole,
    lessonId: string,
  ) {
    const lesson = await this.lessonService.findOrThrow(lessonId);

    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      lesson.section.courseId,
    );
  }
  async validateMediaReadAccess(
    userId: string,
    role: UserRole,
    lessonId: string,
  ) {
    const lesson = await this.lessonService.findOrThrow(lessonId);
    await this.sectionService.validateCourseAccess(
      userId,
      role,
      lesson.section.courseId,
    );
  }
}
