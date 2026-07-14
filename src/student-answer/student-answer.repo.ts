import { CreateStudentAnswerDto } from './dto/create-student-answer.dto';
import { StudentAnswer } from './entities/student-answer.entity';

export abstract class StudentAnswerRepository {
  abstract create(
    studentId: string,
    dto: CreateStudentAnswerDto,
  ): Promise<StudentAnswer>;

  abstract findByStudentAndQuestion(
    studentId: string,
    questionId: string,
  ): Promise<StudentAnswer | null>;

  abstract updateChoice(id: string, choiceId: string): Promise<StudentAnswer>;

  abstract remove(id: string): Promise<StudentAnswer>;

  abstract findByStudentId(studentId: string): Promise<StudentAnswer[]>;

  abstract findByQuestionId(questionId: string): Promise<StudentAnswer[]>;
}
