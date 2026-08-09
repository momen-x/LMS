import { QuestionBank } from '@prisma/client';

export abstract class QuestionBankRepository {
  abstract create(courseId: string, title: string): Promise<QuestionBank>;
  abstract findOne(id: string): Promise<QuestionBank | null>;
  abstract findByCourseId(courseId: string): Promise<QuestionBank[]>;
  abstract update(id: string, title: string): Promise<QuestionBank>;
  abstract updateCourseId(id: string, courseId: string): Promise<QuestionBank>;
  abstract findByCourseIdAndTitle(
    courseId: string,
    title: string,
  ): Promise<QuestionBank | null>;
  abstract remove(id: string): Promise<QuestionBank>;
  abstract countQuestions(id: string): Promise<number>;
}
