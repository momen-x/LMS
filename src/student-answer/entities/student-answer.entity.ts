export class StudentAnswer {
  constructor(
    public id: string,
    public attemptId: string,
    public questionId: string,
    public choiceId: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
