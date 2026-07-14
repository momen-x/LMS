import { BadRequestException, Injectable } from '@nestjs/common';
import { StudentAnswerRepository } from './student-answer.repo';
import { ChoiceService } from 'src/choice/choice.service';
import { CreateStudentAnswerDto } from './dto/create-student-answer.dto';

@Injectable()
export class StudentAnswerService {
  constructor(
    private readonly studentAnswerRepo: StudentAnswerRepository,
    private readonly choiceService: ChoiceService,
  ) {}

  async saveAnswer(studentId: string, dto: CreateStudentAnswerDto) {
    const choice = await this.choiceService.findOne(dto.choiceId);

    if (choice.questionId !== dto.questionId) {
      throw new BadRequestException(
        'This choice does not belong to this question',
      );
    }

    const existingAnswer =
      await this.studentAnswerRepo.findByStudentAndQuestion(
        studentId,
        dto.questionId,
      );

    if (existingAnswer) {
      return this.studentAnswerRepo.updateChoice(
        existingAnswer.id,
        dto.choiceId,
      );
    }

    return this.studentAnswerRepo.create(studentId, dto);
  }
}
