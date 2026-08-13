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

describe('CertificateService.findByStudentId', () => {
  it('returns only the certificate for the requested student and course', async () => {
    const certificate = {
      id: 'certificate-1',
      studentId: 'student-1',
      courseId: 'course-1',
    };
    const certificateRepository: any = {
      findByStudentAndCourse: jest.fn().mockResolvedValue(certificate),
      findByStudentId: jest.fn(),
    };
    const enrollmentService = {
      validateInstructorOwnerCourse: jest.fn().mockResolvedValue(undefined),
    };
    const service = new CertificateService(
      certificateRepository,
      enrollmentService as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await service.findByStudentId(
      'student-1',
      'instructor-1',
      UserRole.instructor,
      'course-1',
    );

    expect(
      enrollmentService.validateInstructorOwnerCourse,
    ).toHaveBeenCalledWith(
      'instructor-1',
      UserRole.instructor,
      'course-1',
    );
    expect(certificateRepository.findByStudentAndCourse).toHaveBeenCalledWith(
      'student-1',
      'course-1',
    );
    expect(certificateRepository.findByStudentId).not.toHaveBeenCalled();
    expect(result).toBe(certificate);
  });
});
