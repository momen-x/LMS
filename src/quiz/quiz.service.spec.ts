import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { QuizService } from './quiz.service';

describe('QuizService course ownership and question bank validation', () => {
  const dto = {
    title: 'Docker Final Quiz',
    questionBankId: 'bank-1',
    questionCount: 2,
    totalMark: 10,
    passingScore: 70,
    maxAttempts: 3,
    duration: 30,
  };

  const setup = (options?: { bankCourseId?: string; available?: number }) => {
    const repo = {
      create: jest.fn().mockResolvedValue({ id: 'quiz-1' }),
      find: jest.fn(),
      findOne: jest.fn(),
      findByCourseId: jest.fn().mockResolvedValue([{ id: 'quiz-1' }]),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const sectionService = {
      validateCourseManagementAccess: jest.fn().mockResolvedValue(undefined),
      validateCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    const bankService = {
      findOrThrow: jest.fn().mockResolvedValue({
        id: 'bank-1',
        courseId: options?.bankCourseId ?? 'course-1',
      }),
      countQuestions: jest.fn().mockResolvedValue(options?.available ?? 5),
    };
    return {
      service: new QuizService(
        repo as never,
        sectionService as never,
        bankService as never,
      ),
      repo,
      sectionService,
    };
  };

  it('allows the course owner to create a quiz under the course', async () => {
    const { service, repo, sectionService } = setup();

    await service.create('owner-1', UserRole.instructor, dto, 'course-1');

    expect(sectionService.validateCourseManagementAccess).toHaveBeenCalledWith(
      'owner-1',
      UserRole.instructor,
      'course-1',
    );
    expect(repo.create).toHaveBeenCalledWith(dto, 'course-1');
  });

  it("rejects creation in another instructor's course", async () => {
    const { service, sectionService } = setup();
    sectionService.validateCourseManagementAccess.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      service.create('instructor-2', UserRole.instructor, dto, 'course-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a question bank from another course', async () => {
    const { service } = setup({ bankCourseId: 'course-2' });
    await expect(
      service.create('owner-1', UserRole.instructor, dto, 'course-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects questionCount greater than available questions', async () => {
    const { service } = setup({ available: 1 });
    await expect(
      service.create('owner-1', UserRole.instructor, dto, 'course-1'),
    ).rejects.toThrow('questionCount');
  });

  it('gets quizzes directly by course after validating read access', async () => {
    const { service, repo, sectionService } = setup();

    await expect(
      service.findByCourseId('student-1', UserRole.student, 'course-1'),
    ).resolves.toEqual([{ id: 'quiz-1' }]);
    expect(sectionService.validateCourseAccess).toHaveBeenCalledWith(
      'student-1',
      UserRole.student,
      'course-1',
    );
    expect(repo.findByCourseId).toHaveBeenCalledWith('course-1');
  });
});
