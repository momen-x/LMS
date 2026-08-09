export class Quiz {
  constructor(
    public id: string,
    public courseId: string,
    public questionBankId: string,
    public questionCount: number,
    public passingScore: number,
    public maxAttempts: number,
    public duration: number,
    public title: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
