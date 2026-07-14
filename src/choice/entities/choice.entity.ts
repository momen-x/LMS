export class Choice {
  constructor(
    public id: string,
    public questionId: string,
    public text: string,
    public isCorrect: boolean,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
