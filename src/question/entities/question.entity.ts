export class Question {
  constructor(
    public id: string,
    public questionBankId: string,
    public text: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
