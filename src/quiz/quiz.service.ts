import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizRepository } from './quiz.repo';
import { SectionService } from 'src/section/section.service';
import { QuestionBankService } from 'src/question-bank/question-bank.service';

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly sectionService: SectionService,
    private readonly questionBankService: QuestionBankService,
  ) {}

  async create(
    userId: string,
    role: UserRole,
    createQuizDto: CreateQuizDto,
    courseId: string,
  ) {
    await this.validateQuizManagementAccess(userId, role, courseId);
    await this.validateQuestionBankSelection(
      courseId,
      createQuizDto.questionBankId,
      createQuizDto.questionCount,
    );
    return this.quizRepository.create(createQuizDto, courseId);
  }

  findAll() {
    return this.quizRepository.find();
  }

  async findByCourseId(userId: string, role: UserRole, courseId: string) {
    await this.validateQuizReadAccess(userId, role, courseId);

    return this.quizRepository.findByCourseId(courseId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const quiz = await this.findOrThrow(id);

    await this.validateQuizReadAccess(userId, role, quiz.courseId);

    return quiz;
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateQuizDto: UpdateQuizDto,
  ) {
    const quiz = await this.findOrThrow(id);

    await this.validateQuizManagementAccess(userId, role, quiz.courseId);

    const questionBankId = updateQuizDto.questionBankId ?? quiz.questionBankId;
    const questionCount = updateQuizDto.questionCount ?? quiz.questionCount;
    await this.validateQuestionBankSelection(
      quiz.courseId,
      questionBankId,
      questionCount,
    );

    return this.quizRepository.update(id, updateQuizDto);
  }

  async remove(id: string, userId: string, role: UserRole) {
    const quiz = await this.findOrThrow(id);

    await this.validateQuizManagementAccess(userId, role, quiz.courseId);

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
    courseId: string,
  ) {
    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      courseId,
    );
  }

  async validateQuizReadAccess(
    userId: string,
    role: UserRole,
    courseId: string,
  ) {
    await this.sectionService.validateCourseAccess(userId, role, courseId);
  }

  private async validateQuestionBankSelection(
    courseId: string,
    questionBankId: string,
    questionCount: number,
  ) {
    const bank = await this.questionBankService.findOrThrow(questionBankId);
    if (bank.courseId !== courseId) {
      throw new BadRequestException(
        'Question bank must belong to the same course as the quiz',
      );
    }
    const available =
      await this.questionBankService.countQuestions(questionBankId);
    if (questionCount > available) {
      throw new BadRequestException(
        'questionCount cannot exceed the number of questions in the question bank',
      );
    }
  }
}
