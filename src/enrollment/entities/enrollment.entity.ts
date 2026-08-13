import { LearningItemType } from '@prisma/client';

export class Enrollment {
  constructor(
    public id: string,
    public studentId: string,
    public courseId: string,
    public progress: number,
    public completed: boolean,
    public enrolledAt: Date,
    public completedAt: Date | null,
    public lastLearningType: LearningItemType | null,
    public lastLearningItemId: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
