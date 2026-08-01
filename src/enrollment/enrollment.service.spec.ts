import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { validate } from 'class-validator';
import { UpdateEnrollmentProgressDto } from './dto/update-enrollment.dto';
import { EnrollmentService } from './enrollment.service';

describe('EnrollmentService', () => {
  const enrollment = {
    id: 'enrollment-1',
    studentId: 'student-1',
    courseId: 'course-1',
    progress: 0,
    completed: false,
    enrolledAt: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function setup() {
    const enrollmentRepository: any = {
      findOne: jest.fn().mockResolvedValue(enrollment),
      hasCompletedPayment: jest.fn().mockResolvedValue(false),
      delete: jest.fn().mockResolvedValue(enrollment),
      findByStudentAndCourse: jest.fn().mockResolvedValue(null),
      setLessonCompletion: jest.fn(),
    };
    const userService = {
      findOne: jest.fn().mockResolvedValue({ role: UserRole.student }),
    };
    const courseService = {
      findOne: jest.fn().mockResolvedValue({
        id: 'course-1',
        instructorId: 'instructor-1',
      }),
    };
    const service = new EnrollmentService(
      enrollmentRepository as never,
      userService as never,
      courseService as never,
    );
    return { service, enrollmentRepository };
  }

  it('prevents an instructor from managing another instructor course', async () => {
    const { service } = setup();
    await expect(
      service.validateInstructorOwnerCourse(
        'instructor-2',
        UserRole.instructor,
        'course-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows an admin to manage any existing course', async () => {
    const { service } = setup();
    await expect(
      service.validateInstructorOwnerCourse(
        'admin-1',
        UserRole.admin,
        'course-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('prevents an instructor from deleting a paid enrollment', async () => {
    const { service, enrollmentRepository } = setup();
    enrollmentRepository.hasCompletedPayment.mockResolvedValue(true);

    await expect(
      service.remove('enrollment-1', UserRole.instructor),
    ).rejects.toThrow(ForbiddenException);
    expect(enrollmentRepository.delete).not.toHaveBeenCalled();
  });

  it('prevents reversing lesson progress after course completion', async () => {
    const { service, enrollmentRepository } = setup();
    enrollmentRepository.findOne.mockResolvedValue({
      ...enrollment,
      progress: 100,
      completed: true,
      completedAt: new Date(),
    });

    await expect(
      service.setLessonCompletion(
        'student-1',
        UserRole.student,
        'enrollment-1',
        'lesson-1',
        false,
      ),
    ).rejects.toThrow('Completed course progress cannot be reversed');
    expect(enrollmentRepository.setLessonCompletion).not.toHaveBeenCalled();
  });

  it.each([-1, 101])('rejects progress outside 0-100: %s', async (progress) => {
    const dto = new UpdateEnrollmentProgressDto();
    dto.progress = progress;
    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
