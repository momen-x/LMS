import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CertificateRepository } from './certificate.repo';
import { NotificationType, UserRole } from '@prisma/client';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { randomUUID } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { NotificationsService } from 'src/notification/notification.service';
import { CourseService } from 'src/course/course.service';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly enrollmentService: EnrollmentService,
    private readonly userService: UsersService,
    private readonly courseService: CourseService,
    private readonly notificationsService: NotificationsService,
  ) {}
  async create(
    instructorId: string,
    role: UserRole,
    studentId: string,
    courseId: string,
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      instructorId,
      role,
      courseId,
    );
    const enrollment = await this.enrollmentService.findByStudentAndCourse(
      studentId,
      courseId,
    );
    if (!enrollment) {
      throw new Error('Student not enrolled in the course');
    }
    if (!enrollment.completed && enrollment.progress < 100)
      throw new BadRequestException('Student not completed the course');

    const certificateNumber = `CERT-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const existing = await this.certificateRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );

    if (existing) {
      throw new ConflictException(
        'Certificate already exists for this student and course',
      );
    }
    const certificate = await this.certificateRepository.create({
      studentId,
      courseId,
      certificateNumber,
    });
    try {
      const course = await this.courseService.findOne(courseId);
      await this.notificationsService.create({
        userId: studentId,
        title: 'Certificate issued',
        text: `Your certificate for ${course.title} is now available.`,
        type: NotificationType.success,
      });
    } catch (error) {
      this.logger.warn(
        `Certificate ${certificate.id} was issued but its notification failed: ${this.errorMessage(error)}`,
      );
    }
    return certificate;
  }

  findAll() {
    return this.certificateRepository.findAll();
  }

  async findOne(
    id: string,
    instructorId: string,
    role: UserRole,
    courseId: string,
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      instructorId,
      role,
      courseId,
    );
    await this.isCourseCertificate(courseId, id);
    return this.findOrThrow(id);
  }

  async remove(
    id: string,
    instructorId: string,
    role: UserRole,
    courseId: string,
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      instructorId,
      role,
      courseId,
    );
    await this.isCourseCertificate(courseId, id);

    return this.certificateRepository.delete(id);
  }

  async findByCertificateNumber(
    certificateNumber: string,
    instructorId: string,
    role: UserRole,
    courseId: string,
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      instructorId,
      role,
      courseId,
    );
    return this.certificateRepository.findByCertificateNumber(
      certificateNumber,
    );
  }
  async findByStudentId(
    studentId: string,
    instructorId: string,
    role: UserRole,
    courseId: string,
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      instructorId,
      role,
      courseId,
    );
    return this.certificateRepository.findByStudentId(studentId);
  }
  async findStudentCertificate(studentId: string) {
    await this.userService.findOne(studentId);
    return this.certificateRepository.findByStudentId(studentId);
  }
  async findByStudentAndCourse(
    studentId: string,
    courseId: string,
    userId: string,
    role: UserRole,
  ) {
    const enrollment = await this.enrollmentService.findByStudentAndCourse(
      studentId,
      courseId,
    );
    if (
      (role === UserRole.student && enrollment.studentId !== studentId) ||
      enrollment.courseId !== courseId
    )
      throw new BadRequestException('Student not enrolled in the course');
    else if (role === UserRole.instructor || role === UserRole.admin) {
      await this.enrollmentService.validateInstructorOwnerCourse(
        userId,
        role,
        courseId,
      );
    }
    return this.certificateRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );
  }
  async findByCourseId(courseId: string, instructorId: string, role: UserRole) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      instructorId,
      role,
      courseId,
    );
    return this.certificateRepository.findByCourseId(courseId);
  }
  async countByCourseId(
    courseId: string,
    instructorId: string,
    role: UserRole,
  ) {
    await this.enrollmentService.validateInstructorOwnerCourse(
      instructorId,
      role,
      courseId,
    );
    return {
      count: await this.certificateRepository.countByCourseId(courseId),
    };
  }
  async countMine(studentId: string) {
    return {
      count: await this.certificateRepository.countByStudentId(studentId),
    };
  }
  async countAll(role: UserRole) {
    if (role !== UserRole.admin) {
      throw new BadRequestException('Only admins can view the total count');
    }
    return { count: await this.certificateRepository.countAll() };
  }
  private async findOrThrow(id: string) {
    const certificate = await this.certificateRepository.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }
    return certificate;
  }
  private async isCourseCertificate(courseId: string, certificateId: string) {
    const certificate = await this.findOrThrow(certificateId);
    if (certificate.courseId !== courseId)
      throw new BadRequestException(
        'Certificate does not belong to this course',
      );
  }
  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
