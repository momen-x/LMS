import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizRepository } from './quiz.repo';
import { LessonService } from 'src/lesson/lesson.service';
import { SectionService } from 'src/section/section.service';

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly lessonService: LessonService,
    private readonly sectionService: SectionService,
  ) {}

  async create(
    userId: string,
    role: UserRole,
    createQuizDto: CreateQuizDto,
    lessonId: string,
  ) {
    await this.validateQuizManagementAccess(userId, role, lessonId);

    return this.quizRepository.create(createQuizDto, lessonId);
  }

  findAll() {
    return this.quizRepository.find();
  }

  async findByLessonId(userId: string, role: UserRole, lessonId: string) {
    await this.validateQuizReadAccessByLesson(userId, role, lessonId);

    return this.quizRepository.findByLessonId(lessonId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const quiz = await this.findOrThrow(id);

    await this.validateQuizReadAccessByLesson(userId, role, quiz.lessonId);

    return quiz;
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateQuizDto: UpdateQuizDto,
  ) {
    const quiz = await this.findOrThrow(id);

    await this.validateQuizManagementAccess(userId, role, quiz.lessonId);

    return this.quizRepository.update(id, updateQuizDto);
  }

  async remove(id: string, userId: string, role: UserRole) {
    const quiz = await this.findOrThrow(id);

    await this.validateQuizManagementAccess(userId, role, quiz.lessonId);

    return this.quizRepository.remove(id);
  }

  async findOrThrow(id: string) {
    const quiz = await this.quizRepository.findOne(id);

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async validateQuizManagementAccess(
    userId: string,
    role: UserRole,
    lessonId: string,
  ) {
    const lesson = await this.lessonService.findOrThrow(lessonId);

    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      lesson.section.courseId,
    );
  }

  async validateQuizReadAccessByLesson(
    userId: string,
    role: UserRole,
    lessonId: string,
  ) {
    const lesson = await this.lessonService.findOrThrow(lessonId);

    await this.sectionService.validateCourseAccess(
      userId,
      role,
      lesson.section.courseId,
    );
  }
}
