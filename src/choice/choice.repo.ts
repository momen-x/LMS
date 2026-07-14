import { CreateChoiceDto } from './dto/create-choice.dto';
import { UpdateChoiceDto } from './dto/update-choice.dto';
import { Choice } from './entities/choice.entity';

export abstract class ChoiceRepository {
  abstract create(
    createChoiceDto: CreateChoiceDto,
    questionId: string,
  ): Promise<Choice>;
  abstract findAll(): Promise<Choice[]>;
  abstract findByQuestionId(questionId: string): Promise<Choice[]>;
  abstract findOne(id: string): Promise<Choice | null>;
  abstract update(
    id: string,
    updateChoiceDto: UpdateChoiceDto,
  ): Promise<Choice>;
  abstract delete(id: string): Promise<Choice>;
  abstract countByQuestionId(questionId: string): Promise<number>;
  abstract findCorrectChoice(questionId: string, excludedChoiceId?: string);
}
