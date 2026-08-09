import { Question } from './entities/question.entity';
import {
  CreateQuestionInputs,
  UpdateQuestionInputs,
} from './types/question.type';

export abstract class QuestionRepository {
  abstract find(): Promise<Question[]>;
  abstract findOne(id: string): Promise<Question | null>;
  abstract findByQuestionBankId(questionBankId: string): Promise<Question[]>;
  abstract create(
    question: CreateQuestionInputs,
    questionBankId: string,
  ): Promise<Question>;
  abstract update(
    id: string,
    question: UpdateQuestionInputs,
  ): Promise<Question>;
  abstract delete(id: string): Promise<Question>;
}
