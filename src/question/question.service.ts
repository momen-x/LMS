import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionRepository } from './question.repo';
import { QuestionBankService } from 'src/question-bank/question-bank.service';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly questionBankService: QuestionBankService,
  ) {}

  async create(
    userId: string,
    role: UserRole,
    createQuestionDto: CreateQuestionDto,
    questionBankId: string,
  ) {
    await this.validateQuestionManagementAccess(userId, role, questionBankId);

    return this.questionRepository.create(createQuestionDto, questionBankId);
  }

  findAll() {
    return this.questionRepository.find();
  }

  async findByQuestionBankId(
    userId: string,
    role: UserRole,
    questionBankId: string,
  ) {
    await this.validateQuestionManagementAccess(userId, role, questionBankId);
    return this.questionRepository.findByQuestionBankId(questionBankId);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const question = await this.findOrThrow(id);

    await this.validateQuestionManagementAccess(
      userId,
      role,
      question.questionBankId,
    );

    return question;
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateQuestionDto: UpdateQuestionDto,
  ) {
    const question = await this.findOrThrow(id);

    await this.validateQuestionManagementAccess(
      userId,
      role,
      question.questionBankId,
    );

    return this.questionRepository.update(id, updateQuestionDto);
  }

  async remove(id: string, userId: string, role: UserRole) {
    const question = await this.findOrThrow(id);

    await this.validateQuestionManagementAccess(
      userId,
      role,
      question.questionBankId,
    );

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
    questionBankId: string,
  ) {
    if (role !== UserRole.admin && role !== UserRole.instructor) {
      throw new ForbiddenException(
        'Only instructors and admins can manage questions',
      );
    }

    const bank = await this.questionBankService.findOrThrow(questionBankId);
    await this.questionBankService.validateManagementAccess(
      userId,
      role,
      bank.courseId,
    );
  }
}
