export class Quiz {
  constructor(
    public id: string,
    public lessonId: string,
    public passingScore: number,
    public maxAttempts: number,
    public title: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
