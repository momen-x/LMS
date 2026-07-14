import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { LessonService } from 'src/lesson/lesson.service';
import { MediaRepository } from './media.repo';
import { UserRole } from '@prisma/client';
import { CloudinaryService } from 'src/cloudinary/config/cloudinary.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly lessonService: LessonService,
    private readonly mediaRepo: MediaRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async create(
    instructorId: string,
    role: UserRole,
    createMediaDto: CreateMediaDto,
    lessonId: string,
    file: Express.Multer.File,
  ) {
    await this.validateInstructorOwnership(instructorId, role, lessonId);

    if (!file) {
      throw new BadRequestException('Media file is required');
    }
    const uploadedImage = await this.cloudinaryService.uploadFile(
      file,
      'media',
    );
    const mediaUrl = uploadedImage.url;
    const mediaPublicId = uploadedImage.publicId;

    return this.mediaRepo.create(
      createMediaDto,
      lessonId,
      mediaUrl,
      mediaPublicId,
    );
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
    file?: Express.Multer.File,
  ) {
    const media = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, media.lessonId);
    let mediaUrl: string | null = null;
    let mediaPublicId: string | null = null;
    if (file) {
      if (media.urlPublicId) {
        await this.cloudinaryService.deleteFile(media.urlPublicId);
      }
      const uploadedImage = await this.cloudinaryService.uploadFile(
        file,
        'media',
      );
      mediaUrl = uploadedImage.url;
      mediaPublicId = uploadedImage.publicId;
    }
    if (mediaPublicId && mediaUrl)
      return this.mediaRepo.update(id, updateMediaDto, mediaUrl, mediaPublicId);

    return this.mediaRepo.update(id, updateMediaDto);
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    const media = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, media.lessonId);
    if (media.urlPublicId)
      await this.cloudinaryService.deleteFile(media.urlPublicId);
    return this.mediaRepo.remove(id);
  }
  private async findOrThrow(id: string) {
    const media = await this.mediaRepo.findOne(id);
    if (!media) {
      throw new NotFoundException('Media not found');
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
