import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentProgressDto } from './dto/update-enrollment.dto';
import { EnrollmentRepository } from './enrollment.repo';
import { UsersService } from 'src/users/users.service';
import { CourseService } from 'src/course/course.service';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly userService: UsersService,
    private readonly courseService: CourseService,
  ) {}
  async create(createEnrollmentDto: CreateEnrollmentDto) {
    await this.validateEnrollmentCreation(
      createEnrollmentDto.studentId,
      createEnrollmentDto.courseId,
    );
    try {
      return await this.enrollmentRepository.create(createEnrollmentDto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Already enrolled in this course');
      }
      throw error;
    }
  }

  findAll() {
    return this.enrollmentRepository.find();
  }
  async findCourseStudent(courseId: string) {
    return this.enrollmentRepository.findCourseStudent(courseId);
  }
  async findByStudentAndCourse(studentId: string, courseId: string) {
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }

  async updateProgress(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentProgressDto,
  ) {
    await this.findOrThrow(id);
    return this.enrollmentRepository.updateProgress(id, updateEnrollmentDto);
  }
  // async findByUserAndCourse(studentId: string, courseId: string) {
  //   const enrollment =
  //     await this.enrollmentRepository.findByStudentIdAndCourseId(
  //       studentId,
  //       courseId,
  //     );
  //   if (!enrollment) throw new NotFoundException('Enrollment not found');
  //   return enrollment;
  // }

  async markCompleted(id: string) {
    await this.findOrThrow(id);
    return this.enrollmentRepository.markCompleted(id);
  }

  async remove(id: string, actorRole: UserRole) {
    const enrollment = await this.findOrThrow(id);
    if (
      actorRole === UserRole.instructor &&
      (await this.enrollmentRepository.hasCompletedPayment(
        enrollment.studentId,
        enrollment.courseId,
      ))
    ) {
      throw new ForbiddenException(
        'Instructors cannot delete paid enrollments; admin action is required',
      );
    }
    return this.enrollmentRepository.delete(id);
  }
  private async findOrThrow(id: string) {
    const enrollment = await this.enrollmentRepository.findOne(id);
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    return enrollment;
  }
  async validateEnrollmentCreation(studentId: string, courseId: string) {
    const user = await this.userService.findOne(studentId);

    const course = await this.courseService.findOne(courseId);
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );

    if (enrollment) {
      throw new BadRequestException('Already enrolled in this course');
    }
    return { user, course };
  }
  async validateInstructorOwnerCourse(
    instructorId: string,
    role: UserRole,
    courseId: string,
  ) {
    if (role !== UserRole.instructor && role !== UserRole.admin) {
      throw new ForbiddenException(
        'Only instructors and admins can perform this action',
      );
    }
    const course = await this.courseService.findOne(courseId);
    if (role === UserRole.admin) return;
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException(
        'Only the instructor can perform this action',
      );
    }
  }

  async validateInstructorOwnerEnrollment(
    userId: string,
    role: UserRole,
    enrollmentId: string,
  ) {
    const enrollment = await this.findOrThrow(enrollmentId);
    await this.validateInstructorOwnerCourse(userId, role, enrollment.courseId);
    return enrollment;
  }
  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      courseId,
    );

    return Boolean(enrollment);
  }
}
