import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from './entities/question.entity';

export abstract class QuestionRepository {
  abstract find(): Promise<Question[]>;
  abstract findOne(id: string): Promise<Question | null>;
  abstract findByQuizId(quizId: string): Promise<Question[]>;
  abstract create(
    question: CreateQuestionDto,
    quizId: string,
  ): Promise<Question>;
  abstract update(id: string, question: UpdateQuestionDto): Promise<Question>;
  abstract delete(id: string): Promise<Question>;
}
