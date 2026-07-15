import { PrismaEnrollmentRepository } from './enrollment-prisma.repo';

describe('PrismaEnrollmentRepository', () => {
  it('uses the composite unique key to find an enrollment', async () => {
    const prisma = {
      enrollment: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const repository = new PrismaEnrollmentRepository(prisma as never);

    await repository.findByStudentAndCourse('user-1', 'course-1');

    expect(prisma.enrollment.findUnique).toHaveBeenCalledWith({
      where: {
        studentId_courseId: {
          studentId: 'user-1',
          courseId: 'course-1',
        },
      },
    });
  });

  it('selects only safe student fields for course enrollments', async () => {
    const prisma = {
      enrollment: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const repository = new PrismaEnrollmentRepository(prisma as never);

    await repository.findCourseStudent('course-1');

    const query = prisma.enrollment.findMany.mock.calls[0][0];
    expect(query.include.student.select).toEqual({
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
    });
    expect(query.include.student.select).not.toHaveProperty('password');
    expect(query.include.student.select).not.toHaveProperty(
      'passwordResetToken',
    );
    expect(query.include.student.select).not.toHaveProperty('providerId');
  });
});
