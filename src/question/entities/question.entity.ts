export class Question {
  constructor(
    public id: string,
    public quizId: string,
    public text: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
