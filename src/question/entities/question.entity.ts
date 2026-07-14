export class Question {
  constructor(
    public id: string,
    public quizId: string,
    public text: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
//   id        String   @id @default(cuid())
//   quizId    String
//   text      String
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
