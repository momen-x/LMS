import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';
import { ChoiceRepository } from './choice.repo';
import { CreateChoiceDto } from './dto/create-choice.dto';
import { QuestionService } from 'src/question/question.service';
import { UpdateChoiceDto } from './dto/update-choice.dto';
import { Choice } from './entities/choice.entity';

@Injectable()
export class ChoiceService {
  constructor(
    private readonly choiceRepo: ChoiceRepository,
    private readonly questionService: QuestionService,
  ) {}
  async create(
    userId: string,
    role: UserRole,
    createChoiceDto: CreateChoiceDto,
    questionId: string,
  ) {
    await this.validateChoiceQuestionManagementAccess(userId, role, questionId);
    await this.checkIfTheAllowedCount(questionId);
    await this.findCorrectChoice(
      questionId,
      createChoiceDto.isCorrect ?? false,
    );

    return this.choiceRepo.create(createChoiceDto, questionId);
  }

  findAll() {
    return this.choiceRepo.findAll();
  }
  async findByQuestionId(userId: string, role: UserRole, questionId: string) {
    await this.validateChoiceQuestionReadAccess(userId, role, questionId);
    return this.choiceRepo
      .findByQuestionId(questionId)
      .then((choices) =>
        choices.map((choice) => this.choiceMapper(choice, role)),
      );
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const choice = await this.findOrThrow(id);
    await this.validateChoiceQuestionReadAccess(
      userId,
      role,
      choice.questionId,
    );
    return this.choiceMapper(choice, role);
  }

  async update(
    id: string,
    userId: string,
    role: UserRole,
    updateChoiceDto: UpdateChoiceDto,
  ) {
    const choice = await this.findOrThrow(id);

    await this.validateChoiceQuestionManagementAccess(
      userId,
      role,
      choice.questionId,
    );

    await this.findCorrectChoice(
      choice.questionId,
      updateChoiceDto.isCorrect ?? false,
      choice.id,
    );

    return this.choiceRepo.update(id, updateChoiceDto);
  }

  async remove(id: string, userId: string, role: UserRole) {
    const choice = await this.findOrThrow(id);
    await this.validateChoiceQuestionManagementAccess(
      userId,
      role,
      choice.questionId,
    );

    return this.choiceRepo.delete(choice.id);
  }
  private async findOrThrow(id: string) {
    const choice = await this.choiceRepo.findOne(id);
    if (!choice) throw new NotFoundException('Choice not found');
    return choice;
  }
  async validateChoiceQuestionManagementAccess(
    userId: string,
    role: UserRole,
    questionId: string,
  ) {
    const question = await this.questionService.findOrThrow(questionId);
    await this.questionService.validateQuestionManagementAccess(
      userId,
      role,
      question.quizId,
    );
  }
  async validateChoiceQuestionReadAccess(
    userId: string,
    role: UserRole,
    questionId: string,
  ) {
    const question = await this.questionService.findOrThrow(questionId);
    await this.questionService.validateQuestionReadAccess(
      userId,
      role,
      question.quizId,
    );
  }
  private async checkIfTheAllowedCount(questionId: string) {
    const choicesCount = await this.choiceRepo.countByQuestionId(questionId);

    if (choicesCount >= 5) {
      throw new BadRequestException(
        'A question cannot have more than 5 choices',
      );
    }
    return true;
  }
  async findCorrectChoice(
    questionId: string,
    isCorrect: boolean,
    currentChoiceId?: string,
  ) {
    if (!isCorrect) return;

    const existingCorrectChoice =
      await this.choiceRepo.findCorrectChoice(questionId);

    if (existingCorrectChoice && existingCorrectChoice.id !== currentChoiceId) {
      throw new BadRequestException(
        'A question can only have one correct answer',
      );
    }
  }
  private choiceMapper(choice: Choice, role: UserRole) {
    const baseChoice = {
      id: choice.id,
      text: choice.text,
      questionId: choice.questionId,
      createdAt: choice.createdAt,
      updatedAt: choice.updatedAt,
    };

    if (role === UserRole.admin || role === UserRole.instructor) {
      return {
        ...baseChoice,
        isCorrect: choice.isCorrect,
      };
    }

    return baseChoice;
  }
}
