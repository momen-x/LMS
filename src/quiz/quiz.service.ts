import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizRepository } from './quiz.repo';
import { LessonService } from 'src/lesson/lesson.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly lessonService: LessonService,
  ) {}
  async create(
    instructorId: string,
    role: UserRole,
    createQuizDto: CreateQuizDto,
    lessonId: string,
  ) {
    await this.validateInstructorOwnership(instructorId, role, lessonId);
    return this.quizRepository.create(createQuizDto, lessonId);
  }

  findAll() {
    return this.quizRepository.find();
  }
  findByLessonId(lessonId: string) {
    return this.quizRepository.findByLessonId(lessonId);
  }
  findOne(id: string) {
    return this.findOrThrow(id);
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateQuizDto: UpdateQuizDto,
  ) {
    const quiz = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, quiz.lessonId);
    return this.quizRepository.update(id, updateQuizDto);
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    const quiz = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, quiz.lessonId);
    return this.quizRepository.remove(id);
  }
  private async findOrThrow(id: string) {
    const quiz = await this.quizRepository.findOne(id);
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }
  async validateInstructorOwnership(
    instructorId: string,
    role: UserRole,
    lessonId: string,
  ) {
    if (role !== UserRole.instructor && role !== UserRole.admin)
      throw new ForbiddenException(
        'Only instructors and admins can perform this action',
      );
    if (role === UserRole.admin) return;
    const lesson = await this.lessonService.findOne(lessonId);
    await this.lessonService.validateInstructorOwnership(
      instructorId,
      role,
      lesson.sectionId,
    );
  }
}
