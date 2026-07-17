import { StudentAnswer } from './entities/student-answer.entity';
import { CreateStudentInputs } from './types/student-user.type';

export abstract class StudentAnswerRepository {
  abstract create(
    studentId: string,
    dto: CreateStudentInputs,
  ): Promise<StudentAnswer>;

  abstract findByStudentAndQuestion(
    studentId: string,
    questionId: string,
  ): Promise<StudentAnswer | null>;

  abstract updateChoice(id: string, choiceId: string): Promise<StudentAnswer>;

  abstract remove(id: string): Promise<StudentAnswer>;

  abstract findByStudentId(studentId: string): Promise<StudentAnswer[]>;

  abstract findByQuestionId(questionId: string): Promise<StudentAnswer[]>;
  abstract upsert(
    studentId: string,
    dto: CreateStudentInputs,
  ): Promise<StudentAnswer>;
}
