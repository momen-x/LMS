import { MediaType } from '@prisma/client';

export class Media {
  constructor(
    public id: string,
    public lessonId: string,
    public url: string,
    public urlPublicId: string | null,
    public cloudinaryResourceType: string | null,
    public type: MediaType,
    public duration: number | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}

//   id        String    @id @default(cuid())
//   lessonId  String
//   url       String
//   type      MediaType
//   duration  Int?
//   createdAt DateTime  @default(now())
//   updatedAt DateTime  @updatedAt

//   lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
