// import { Course } from 'src/course/entities/course.entity';

export class Section {
  constructor(
    public id: string,
    public courseId: string,
    public title: string,
    public order: number,
    public createdAt: Date,
    public updatedAt: Date,
    // public course: Course,
    //   lessons Lesson[]
  ) {}
}
