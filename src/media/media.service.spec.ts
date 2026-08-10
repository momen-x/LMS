import { BadRequestException } from '@nestjs/common';
import { MediaType, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMediaDto } from './dto/create-media.dto';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const setup = () => {
    const mediaRepo = {
      create: jest.fn().mockResolvedValue({ id: 'media-1' }),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn().mockResolvedValue({ id: 'media-1' }),
    };
    const cloudinary = {
      uploadMedia: jest.fn().mockResolvedValue({
        url: 'https://cloudinary.test/video',
        publicId: 'public-1',
        resourceType: 'video',
      }),
      deleteFile: jest.fn(),
    };
    const lessonService = {
      findOrThrow: jest.fn().mockResolvedValue({
        section: { courseId: 'course-1' },
      }),
    };
    const sectionService = {
      validateCourseManagementAccess: jest.fn(),
      validateCourseAccess: jest.fn(),
    };
    return {
      service: new MediaService(
        lessonService as never,
        sectionService as never,
        mediaRepo as never,
        cloudinary as never,
      ),
      mediaRepo,
      cloudinary,
    };
  };

  it('stores URL media directly without uploading to Cloudinary', async () => {
    const { service, mediaRepo, cloudinary } = setup();
    await service.create(
      'owner-1',
      UserRole.instructor,
      { type: MediaType.url, url: 'https://example.com/resource' },
      'lesson-1',
    );
    expect(cloudinary.uploadMedia).not.toHaveBeenCalled();
    expect(mediaRepo.create).toHaveBeenCalledWith(
      { type: MediaType.url, duration: undefined },
      'lesson-1',
      'https://example.com/resource',
      null,
      null,
    );
  });

  it('does not delete a Cloudinary asset when deleting URL media', async () => {
    const { service, mediaRepo, cloudinary } = setup();
    mediaRepo.findOne.mockResolvedValue({
      id: 'media-1',
      lessonId: 'lesson-1',
      type: MediaType.url,
      urlPublicId: null,
      cloudinaryResourceType: null,
    });
    await service.remove('media-1', 'owner-1', UserRole.instructor);
    expect(mediaRepo.remove).toHaveBeenCalledWith('media-1');
    expect(cloudinary.deleteFile).not.toHaveBeenCalled();
  });

  it('preserves Cloudinary upload for uploaded media', async () => {
    const { service, mediaRepo, cloudinary } = setup();
    const file = {
      mimetype: 'video/mp4',
      buffer: Buffer.from('x'),
    } as Express.Multer.File;
    await service.create(
      'owner-1',
      UserRole.instructor,
      { type: MediaType.video, duration: 10 },
      'lesson-1',
      file,
    );
    expect(cloudinary.uploadMedia).toHaveBeenCalledWith(file, 'media');
    expect(mediaRepo.create).toHaveBeenCalledWith(
      { type: MediaType.video, duration: 10 },
      'lesson-1',
      'https://cloudinary.test/video',
      'public-1',
      'video',
    );
  });

  it('rejects a missing URL and validates malformed URLs', async () => {
    const { service } = setup();
    await expect(
      service.create(
        'owner-1',
        UserRole.instructor,
        { type: MediaType.url },
        'lesson-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const dto = plainToInstance(CreateMediaDto, {
      type: MediaType.url,
      url: 'invalid',
    });
    expect(await validate(dto)).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'url' })]),
    );
  });
});
