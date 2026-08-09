import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SectionService } from 'src/section/section.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { QuestionBankRepository } from './question-bank.repo';

@Injectable()
export class QuestionBankService {
  constructor(
    private readonly repo: QuestionBankRepository,
    private readonly sectionService: SectionService,
  ) {}
  async create(
    userId: string,
    role: UserRole,
    courseId: string,
    dto: CreateQuestionBankDto,
  ) {
    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      courseId,
    );
    return this.repo.create(courseId, dto.title);
  }
  async findByCourse(userId: string, role: UserRole, courseId: string) {
    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      courseId,
    );
    const banks = await this.repo.findByCourseId(courseId);

    return Promise.all(
      banks.map(async (bank) => ({
        questionBank: bank,
        questionCount: await this.countQuestions(bank.id),
      })),
    );
  }
  async findOne(id: string, userId: string, role: UserRole) {
    const bank = await this.findOrThrow(id);
    await this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      bank.courseId,
    );
    return { questionBank: bank, questionCount: await this.countQuestions(id) };
  }
  async update(
    id: string,
    userId: string,
    role: UserRole,
    dto: UpdateQuestionBankDto,
  ) {
    await this.findOne(id, userId, role);
    return this.repo.update(id, dto.title!);
  }
  async updateCourseId(
    id: string,
    userId: string,
    role: UserRole,
    dto: { courseId: string },
  ) {
    await this.findOne(id, userId, role);
    return this.repo.updateCourseId(id, dto.courseId);
  }
  async remove(id: string, userId: string, role: UserRole) {
    await this.findOne(id, userId, role);
    return this.repo.remove(id);
  }
  async findOrThrow(id: string) {
    const bank = await this.repo.findOne(id);
    if (!bank) throw new NotFoundException('Question bank not found');
    return bank;
  }
  countQuestions(id: string) {
    return this.repo.countQuestions(id);
  }
  validateManagementAccess(userId: string, role: UserRole, courseId: string) {
    return this.sectionService.validateCourseManagementAccess(
      userId,
      role,
      courseId,
    );
  }
}
