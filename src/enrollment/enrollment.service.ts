import {
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
import { NotificationsService } from 'src/notification/notification.service';
import { UpdateLearningPositionDto } from './dto/update-learning-position.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly userService: UsersService,
    private readonly courseService: CourseService,
    private readonly notificationService: NotificationsService,
  ) {}
  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { course } = await this.validateEnrollmentCreation(
      createEnrollmentDto.studentId,
      createEnrollmentDto.courseId,
    );
    try {
      const enrollment =
        await this.enrollmentRepository.create(createEnrollmentDto);
      await this.notificationService.create({
        text: `You have been enrolled in the course with ID ${createEnrollmentDto.courseId}`,
        userId: createEnrollmentDto.studentId,
        title: 'Enrollment Successful',
        type: 'info',
      });
      await this.notificationService.create({
        text: `A new student has enrolled in your course!!`,
        userId: course.instructorId,
        title: 'New Enrollment',
        type: 'info',
      });
      return enrollment;
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
    const enrollment = await this.findByStudentAndCourseOrNull(
      studentId,
      courseId,
    );
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }
  findByStudentAndCourseOrNull(studentId: string, courseId: string) {
    return this.enrollmentRepository.findByStudentAndCourseOrNull(
      studentId,
      courseId,
    );
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }
  findUserEnrollments(userId: string, courseId?: string) {
    return this.enrollmentRepository.findUserEnrollments(userId, courseId);
  }
  async updateProgress(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentProgressDto,
  ) {
    await this.findOrThrow(id);
    return this.enrollmentRepository.updateProgress(id, updateEnrollmentDto);
  }

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
  async getUserEnrollmentStats(userId: string) {
    return this.enrollmentRepository.getUserEnrollmentStats(userId);
  }
  async setLessonCompletion(
    userId: string,
    role: UserRole,
    enrollmentId: string,
    lessonId: string,
    completed: boolean,
  ) {
    if (role !== UserRole.student) {
      throw new ForbiddenException('Only students can update lesson progress');
    }
    const enrollment = await this.findOrThrow(enrollmentId);
    if (enrollment.studentId !== userId) {
      throw new ForbiddenException('You do not own this enrollment');
    }
    if (enrollment.completed && !completed) {
      throw new ConflictException(
        'Completed course progress cannot be reversed',
      );
    }
    const lessonCourseId =
      await this.enrollmentRepository.findLessonCourseId(lessonId);
    if (!lessonCourseId) throw new NotFoundException('Lesson not found');
    if (lessonCourseId !== enrollment.courseId) {
      throw new ForbiddenException(
        'Lesson does not belong to the enrolled course',
      );
    }
    return this.enrollmentRepository.setLessonCompletion(
      enrollmentId,
      lessonId,
      completed,
    );
  }
  async updateLearningPosition(
    userId: string,
    role: UserRole,
    enrollmentId: string,
    position: UpdateLearningPositionDto,
  ) {
    if (role !== UserRole.student) {
      throw new ForbiddenException(
        'Only students can update learning position',
      );
    }
    const enrollment = await this.findOrThrow(enrollmentId);
    if (enrollment.studentId !== userId) {
      throw new ForbiddenException('You do not own this enrollment');
    }
    const itemCourseId =
      await this.enrollmentRepository.findLearningItemCourseId(
        position.type,
        position.itemId,
      );
    if (!itemCourseId) {
      throw new NotFoundException('Learning item not found');
    }
    if (itemCourseId !== enrollment.courseId) {
      throw new ForbiddenException(
        'Learning item does not belong to the enrolled course',
      );
    }
    return this.enrollmentRepository.updateLearningPosition(
      enrollmentId,
      position.type,
      position.itemId,
    );
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
      throw new ConflictException('Already enrolled in this course');
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
    const enrollment = await this.findByStudentAndCourseOrNull(
      studentId,
      courseId,
    );
    return Boolean(enrollment);
  }
}
