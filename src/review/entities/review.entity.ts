export class Review {
  constructor(
    public id: string,
    public studentId: string,
    public courseId: string,
    public rating: number,
    public comment: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
