import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionRepository } from './question.repo';
import { QuizService } from 'src/quiz/quiz.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly quizService: QuizService,
  ) {}
  async create(
    instructorId: string,
    role: UserRole,
    createQuestionDto: CreateQuestionDto,
    quizId: string,
  ) {
    await this.validateInstructorOwnership(instructorId, role, quizId);

    return this.questionRepository.create(createQuestionDto, quizId);
  }

  findAll() {
    return this.questionRepository.find();
  }
  findByQuizId(quizId: string) {
    return this.questionRepository.findByQuizId(quizId);
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateQuestionDto: UpdateQuestionDto,
  ) {
    const question = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, question.quizId);

    return this.questionRepository.update(id, updateQuestionDto);
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    const question = await this.findOrThrow(id);
    await this.validateInstructorOwnership(instructorId, role, question.quizId);

    return this.questionRepository.delete(id);
  }
  private async findOrThrow(id: string) {
    const question = await this.questionRepository.findOne(id);
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }
  async validateInstructorOwnership(
    instructorId: string,
    role: UserRole,
    quizId: string,
  ) {
    if (role !== UserRole.instructor && role !== UserRole.admin)
      throw new ForbiddenException(
        'Only instructors and admins can perform this action',
      );
    if (role === UserRole.admin) return;
    const quiz = await this.quizService.findOne(quizId);
    await this.quizService.validateInstructorOwnership(
      instructorId,
      role,
      quiz.lessonId,
    );
  }
}
