import { Prisma } from '@prisma/client';
type JsonValue = Prisma.JsonValue;
export class Lesson {
  constructor(
    public id: string,
    public sectionId: string,
    public title: string,
    public description: string | null,
    public duration: number,
    public order: number,
    public isPreview: boolean,
    public resources: JsonValue,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
//   section     Section  @relation(fields: [sectionId], references: [id], onDelete: Cascade)
//   media       Media[]
//   quizzes     Quiz[]
