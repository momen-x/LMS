import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionRepository } from './question.repo';
import { QuizService } from 'src/quiz/quiz.service';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly quizService: QuizService,
  ) {}

  async create(
    userId: string,
    role: UserRole,
    createQuestionDto: CreateQuestionDto,
    quizId: string,
  ) {
    await this.validateQuestionManagementAccess(userId, role, quizId);

    return this.questionRepository.create(createQuestionDto, quizId);
  }

  findAll() {
    return this.questionRepository.find();
  }

  async findByQuizId(userId: string, role: UserRole, quizId: string) {
    await this.validateQuestionReadAccess(userId, role, quizId);

    return this.questionRepository.findByQuizId(quizId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const question = await this.findOrThrow(id);

    await this.validateQuestionReadAccess(userId, role, question.quizId);

    return question;
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateQuestionDto: UpdateQuestionDto,
  ) {
    const question = await this.findOrThrow(id);

    await this.validateQuestionManagementAccess(userId, role, question.quizId);

    return this.questionRepository.update(id, updateQuestionDto);
  }

  async remove(id: string, userId: string, role: UserRole) {
    const question = await this.findOrThrow(id);

    await this.validateQuestionManagementAccess(userId, role, question.quizId);

    return this.questionRepository.delete(id);
  }

  async findOrThrow(id: string) {
    const question = await this.questionRepository.findOne(id);

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async validateQuestionManagementAccess(
    userId: string,
    role: UserRole,
    quizId: string,
  ) {
    if (role !== UserRole.admin && role !== UserRole.instructor) {
      throw new ForbiddenException(
        'Only instructors and admins can manage questions',
      );
    }

    const quiz = await this.quizService.findOrThrow(quizId);

    await this.quizService.validateQuizManagementAccess(
      userId,
      role,
      quiz.lessonId,
    );
  }

  async validateQuestionReadAccess(
    userId: string,
    role: UserRole,
    quizId: string,
  ) {
    const quiz = await this.quizService.findOrThrow(quizId);

    await this.quizService.validateQuizReadAccessByLesson(
      userId,
      role,
      quiz.lessonId,
    );
  }
}
