import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { validate } from 'class-validator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  const review = {
    id: 'review-1',
    studentId: 'student-1',
    courseId: 'course-1',
    rating: 5,
    comment: 'Great',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function setup() {
    const repository: any = {
      create: jest.fn().mockResolvedValue(review),
      findById: jest.fn().mockResolvedValue(review),
      findByStudentAndCourse: jest.fn().mockResolvedValue(null),
      findByCourseId: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findByStudentId: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      update: jest.fn().mockResolvedValue(review),
      delete: jest.fn().mockResolvedValue(review),
    };
    const enrollmentService = {
      findByStudentAndCourse: jest.fn().mockResolvedValue({ id: 'enroll-1' }),
    };
    const courseService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'course-1',
        instructorId: 'instructor-1',
        title: 'NestJS',
      }),
    };
    const notificationsService = { create: jest.fn().mockResolvedValue({}) };
    const service = new ReviewService(
      repository,
      enrollmentService as never,
      courseService as never,
      notificationsService as never,
    );
    return {
      service,
      repository,
      enrollmentService,
      courseService,
      notificationsService,
    };
  }

  it('rejects an unenrolled reviewer', async () => {
    const { service, enrollmentService } = setup();
    enrollmentService.findByStudentAndCourse.mockRejectedValue(
      new NotFoundException('Enrollment not found'),
    );
    await expect(
      service.create('student-1', 'course-1', { rating: 5 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects the instructor reviewing their own course', async () => {
    const { service } = setup();
    await expect(
      service.create('instructor-1', 'course-1', { rating: 5 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects a duplicate review', async () => {
    const { service, repository } = setup();
    repository.findByStudentAndCourse.mockResolvedValue(review);
    await expect(
      service.create('student-1', 'course-1', { rating: 5 }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates a review and notifies the course instructor', async () => {
    const { service, notificationsService } = setup();
    await expect(
      service.create('student-1', 'course-1', { rating: 5 }),
    ).resolves.toBe(review);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'instructor-1',
        title: 'New course review',
      }),
    );
  });

  it('still returns the created review when notification delivery fails', async () => {
    const { service, notificationsService } = setup();
    notificationsService.create.mockRejectedValue(new Error('Unavailable'));

    await expect(
      service.create('student-1', 'course-1', { rating: 5 }),
    ).resolves.toBe(review);
  });

  it('maps a database duplicate race to a conflict', async () => {
    const { service, repository } = setup();
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.8.0',
      }),
    );

    await expect(
      service.create('student-1', 'course-1', { rating: 5 }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows only the owner to update a review', async () => {
    const { service, repository } = setup();
    await expect(
      service.update('review-1', 'student-1', { rating: 4 }),
    ).resolves.toBe(review);
    expect(repository.update).toHaveBeenCalled();
    await expect(
      service.update('review-1', 'student-2', { rating: 4 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows the owner or admin to delete and rejects other users', async () => {
    const { service, repository } = setup();
    await expect(
      service.delete('review-1', 'student-1', UserRole.student),
    ).resolves.toBe(review);
    await expect(
      service.delete('review-1', 'admin-1', UserRole.admin),
    ).resolves.toBe(review);
    await expect(
      service.delete('review-1', 'instructor-2', UserRole.instructor),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.delete).toHaveBeenCalledTimes(2);
  });

  it.each([0, 6, 1.5])('rejects invalid rating %s', async (rating) => {
    const dto = new CreateReviewDto();
    dto.rating = rating;
    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
