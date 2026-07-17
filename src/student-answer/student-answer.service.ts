import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { StudentAnswerRepository } from './student-answer.repo';
import { ChoiceService } from 'src/choice/choice.service';
import { QuestionService } from 'src/question/question.service';
import { CreateStudentAnswerDto } from './dto/create-student-answer.dto';

@Injectable()
export class StudentAnswerService {
  constructor(
    private readonly studentAnswerRepo: StudentAnswerRepository,
    private readonly choiceService: ChoiceService,
    private readonly questionService: QuestionService,
  ) {}

  async saveAnswer(
    studentId: string,
    role: UserRole,
    dto: CreateStudentAnswerDto,
  ) {
    if (role !== UserRole.student) {
      throw new ForbiddenException('Only students can submit quiz answers');
    }

    const question = await this.questionService.findOrThrow(dto.questionId);

    await this.questionService.validateQuestionReadAccess(
      studentId,
      role,
      question.quizId,
    );

    const choice = await this.choiceService.findOrThrow(dto.choiceId);

    if (choice.questionId !== question.id) {
      throw new BadRequestException(
        'This choice does not belong to this question',
      );
    }

    return this.studentAnswerRepo.upsert(studentId, dto);
  }
}
