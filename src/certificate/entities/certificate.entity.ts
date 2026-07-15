export class Certificate {
  constructor(
    public id: string,
    public studentId: string,
    public courseId: string,
    public certificateNumber: string,
    public issueDate: Date,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
