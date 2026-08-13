import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LearningItemType, UserRole } from '@prisma/client';
import { validate } from 'class-validator';
import { UpdateEnrollmentProgressDto } from './dto/update-enrollment.dto';
import { UpdateLearningPositionDto } from './dto/update-learning-position.dto';
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
    const enrollmentRepository = {
      findOne: jest.fn().mockResolvedValue(enrollment),
      hasCompletedPayment: jest.fn().mockResolvedValue(false),
      delete: jest.fn().mockResolvedValue(enrollment),
      findByStudentAndCourse: jest.fn().mockResolvedValue(null),
      findByStudentAndCourseOrNull: jest.fn().mockResolvedValue(null),
      setLessonCompletion: jest.fn(),
      findLearningItemCourseId: jest.fn().mockResolvedValue('course-1'),
      updateLearningPosition: jest.fn().mockResolvedValue(enrollment),
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
      { create: jest.fn() } as never,
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

  it('does not hide a real database failure while checking enrollment', async () => {
    const { service, enrollmentRepository } = setup();
    enrollmentRepository.findByStudentAndCourseOrNull.mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(service.isEnrolled('student-1', 'course-1')).rejects.toThrow(
      'database unavailable',
    );
  });

  it('allows a student to save an item from their enrolled course', async () => {
    const { service, enrollmentRepository } = setup();

    await service.updateLearningPosition(
      'student-1',
      UserRole.student,
      'enrollment-1',
      { type: 'lesson', itemId: 'lesson-1' },
    );

    expect(enrollmentRepository.updateLearningPosition).toHaveBeenCalledWith(
      'enrollment-1',
      'lesson',
      'lesson-1',
    );
  });

  it('allows a student to save a quiz from their enrolled course', async () => {
    const { service, enrollmentRepository } = setup();

    await service.updateLearningPosition(
      'student-1',
      UserRole.student,
      'enrollment-1',
      { type: LearningItemType.quiz, itemId: 'quiz-1' },
    );

    expect(enrollmentRepository.updateLearningPosition).toHaveBeenCalledWith(
      'enrollment-1',
      LearningItemType.quiz,
      'quiz-1',
    );
  });

  it('rejects a learning item from another course', async () => {
    const { service, enrollmentRepository } = setup();
    enrollmentRepository.findLearningItemCourseId.mockResolvedValue('course-2');

    await expect(
      service.updateLearningPosition(
        'student-1',
        UserRole.student,
        'enrollment-1',
        { type: 'quiz', itemId: 'quiz-2' },
      ),
    ).rejects.toThrow('Learning item does not belong to the enrolled course');
    expect(enrollmentRepository.updateLearningPosition).not.toHaveBeenCalled();
  });

  it('rejects another student updating the learning position', async () => {
    const { service, enrollmentRepository } = setup();

    await expect(
      service.updateLearningPosition(
        'student-2',
        UserRole.student,
        'enrollment-1',
        { type: 'lesson', itemId: 'lesson-1' },
      ),
    ).rejects.toThrow('You do not own this enrollment');
    expect(enrollmentRepository.updateLearningPosition).not.toHaveBeenCalled();
  });

  it('rejects a missing learning item', async () => {
    const { service, enrollmentRepository } = setup();
    enrollmentRepository.findLearningItemCourseId.mockResolvedValue(null);

    await expect(
      service.updateLearningPosition(
        'student-1',
        UserRole.student,
        'enrollment-1',
        { type: LearningItemType.quiz, itemId: 'missing-quiz' },
      ),
    ).rejects.toThrow(NotFoundException);
    expect(enrollmentRepository.updateLearningPosition).not.toHaveBeenCalled();
  });

  it('validates learning-position types and item IDs', async () => {
    const dto = new UpdateLearningPositionDto();
    dto.type = 'video' as LearningItemType;
    dto.itemId = '';

    await expect(validate(dto)).resolves.toHaveLength(2);
  });
});
