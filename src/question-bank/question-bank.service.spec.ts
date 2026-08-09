import { UserRole } from '@prisma/client';
import { QuestionBankService } from './question-bank.service';

describe('QuestionBankService', () => {
  it('creates a bank only after course ownership authorization', async () => {
    const repo = { create: jest.fn().mockResolvedValue({ id: 'bank-1' }) };
    const sectionService = {
      validateCourseManagementAccess: jest.fn().mockResolvedValue(undefined),
    };
    const service = new QuestionBankService(
      repo as never,
      sectionService as never,
    );
    await service.create('owner-1', UserRole.instructor, {
      courseId: 'course-1',
      title: 'Main bank',
    });
    expect(sectionService.validateCourseManagementAccess).toHaveBeenCalledWith(
      'owner-1',
      UserRole.instructor,
      'course-1',
    );
    expect(repo.create).toHaveBeenCalledWith('course-1', 'Main bank');
  });

  it('does not manage another instructor course when ownership authorization rejects', async () => {
    const repo = { create: jest.fn() };
    const sectionService = {
      validateCourseManagementAccess: jest
        .fn()
        .mockRejectedValue(new Error('forbidden')),
    };
    const service = new QuestionBankService(
      repo as never,
      sectionService as never,
    );
    await expect(
      service.create('other-1', UserRole.instructor, {
        courseId: 'course-1',
        title: 'Main bank',
      }),
    ).rejects.toThrow('forbidden');
    expect(repo.create).not.toHaveBeenCalled();
  });
});
