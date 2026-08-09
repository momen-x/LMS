import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Quiz } from './entities/quiz.entity';

export abstract class QuizRepository {
  abstract find(): Promise<Quiz[]>;
  abstract findOne(id: string): Promise<Quiz | null>;
  abstract findByCourseId(courseId: string): Promise<Quiz[]>;
  abstract create(dto: CreateQuizDto, courseId: string): Promise<Quiz>;
  abstract update(id: string, dto: UpdateQuizDto): Promise<Quiz>;
  abstract remove(id: string): Promise<Quiz>;
}
