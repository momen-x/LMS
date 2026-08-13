import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CourseService } from './course.service';

describe('CourseService learning content', () => {
  const learningContent = {
    id: 'course-1',
    instructorId: 'instructor-1',
  };

  function createService(content: Record<string, unknown>) {
    const courseRepository = {
      findLearningContent: jest.fn().mockResolvedValue(content),
    };
    const service = new CourseService(
      courseRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );
    return { service, courseRepository };
  }

  it('returns learning content to the enrolled user', async () => {
    const content = { ...learningContent, enrollment: { id: 'enrollment-1' } };
    const { service } = createService(content);

    await expect(
      service.getLearningContent('course-1', 'student-1', UserRole.student),
    ).resolves.toBe(content);
  });

  it('allows the course owner without an enrollment', async () => {
    const content = { ...learningContent, enrollment: null };
    const { service } = createService(content);

    await expect(
      service.getLearningContent(
        'course-1',
        'instructor-1',
        UserRole.instructor,
      ),
    ).resolves.toBe(content);
  });

  it('rejects a user who is neither enrolled nor authorized', async () => {
    const content = { ...learningContent, enrollment: null };
    const { service } = createService(content);

    await expect(
      service.getLearningContent('course-1', 'student-1', UserRole.student),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
