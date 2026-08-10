export type CreateLessonInput = {
  title: string;
  description?: string;
  isPreview?: boolean;
};

export type UpdateLessonInput = Partial<CreateLessonInput>;
