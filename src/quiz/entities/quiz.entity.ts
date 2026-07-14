export class Quiz {
  constructor(
    public id: string,
    public lessonId: string,
    public title: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
//  id        String   @id @default(cuid())
//   lessonId  String
//   title     String
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
