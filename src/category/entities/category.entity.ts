export class Category {
  constructor(
    public id: string,
    public name: string,
    public slug: string,
    public createdAt: Date,
    public updatedAt: Date,

    //   courses Course[]
  ) {}
}
