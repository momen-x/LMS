import { NotificationType, UserRole } from '@prisma/client';
import { CertificateService } from './certificate.service';

describe('CertificateService notifications', () => {
  it('notifies the student after certificate issuance', async () => {
    const certificate = {
      id: 'certificate-1',
      studentId: 'student-1',
      courseId: 'course-1',
    };
    const certificateRepository: any = {
      findByStudentAndCourse: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(certificate),
    };
    const enrollmentService = {
      validateInstructorOwnerCourse: jest.fn().mockResolvedValue(undefined),
      findByStudentAndCourse: jest.fn().mockResolvedValue({
        completed: true,
        progress: 100,
      }),
    };
    const courseService = {
      findOne: jest.fn().mockResolvedValue({ title: 'NestJS' }),
    };
    const notificationsService = { create: jest.fn().mockResolvedValue({}) };
    const service = new CertificateService(
      certificateRepository,
      enrollmentService as never,
      {} as never,
      courseService as never,
      notificationsService as never,
    );

    await service.create(
      'instructor-1',
      UserRole.instructor,
      'student-1',
      'course-1',
    );

    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 'student-1',
      title: 'Certificate issued',
      text: 'Your certificate for NestJS is now available.',
      type: NotificationType.success,
    });
  });
});
