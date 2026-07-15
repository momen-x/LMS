import { Choice } from './entities/choice.entity';
import { CreateChoiceInput, UpdateChoiceInput } from './types/choice.type';

export abstract class ChoiceRepository {
  abstract create(
    createChoiceDto: CreateChoiceInput,
    questionId: string,
  ): Promise<Choice>;
  abstract findAll(): Promise<Choice[]>;
  abstract findByQuestionId(questionId: string): Promise<Choice[]>;
  abstract findOne(id: string): Promise<Choice | null>;
  abstract update(
    id: string,
    updateChoiceDto: UpdateChoiceInput,
  ): Promise<Choice>;
  abstract delete(id: string): Promise<Choice>;
  abstract countByQuestionId(questionId: string): Promise<number>;
  abstract findCorrectChoice(
    questionId: string,
    excludedChoiceId?: string,
  ): Promise<Choice | null>;
}
