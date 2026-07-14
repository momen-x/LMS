import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '@prisma/client';
import { ChoiceRepository } from './choice.repo';
import { CreateChoiceDto } from './dto/create-choice.dto';
import { QuestionService } from 'src/question/question.service';
import { UpdateChoiceDto } from './dto/update-choice.dto';

@Injectable()
export class ChoiceService {
  constructor(
    private readonly choiceRepo: ChoiceRepository,
    private readonly questionService: QuestionService,
  ) {}
  async create(
    instructorId: string,
    role: UserRole,
    createChoiceDto: CreateChoiceDto,
    questionId: string,
  ) {
    await this.validateInstructorOwnership(instructorId, role, questionId);
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
  findByQuestionId(questionId: string) {
    return this.choiceRepo.findByQuestionId(questionId);
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }

  async update(
    id: string,
    instructorId: string,
    role: UserRole,
    updateChoiceDto: UpdateChoiceDto,
  ) {
    const choice = await this.findOrThrow(id);
    await this.validateInstructorOwnership(
      instructorId,
      role,
      choice.questionId,
    );
    await this.findCorrectChoice(
      choice.questionId,
      updateChoiceDto.isCorrect ?? false,
      choice.id,
    );
    if (updateChoiceDto.isCorrect && updateChoiceDto.isCorrect) {
      throw new BadRequestException(
        'A question can only have one correct answer let another one be correct then set it to false',
      );
    }
    return this.choiceRepo.update(id, updateChoiceDto);
  }

  async remove(id: string, instructorId: string, role: UserRole) {
    const choice = await this.findOrThrow(id);
    await this.validateInstructorOwnership(
      instructorId,
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
  async validateInstructorOwnership(
    instructorId: string,
    role: UserRole,
    questionId: string,
  ) {
    if (role !== UserRole.instructor && role !== UserRole.admin)
      throw new ForbiddenException(
        'Only instructors and admins can perform this action',
      );
    if (role === UserRole.admin) return;
    const question = await this.questionService.findOne(questionId);
    await this.questionService.validateInstructorOwnership(
      instructorId,
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
}
