export type CreateLessonInput = {
  title: string;
  description?: string;
  duration?: number;
  isPreview?: boolean;
  resources?: resource[];
};

export type UpdateLessonInput = Partial<CreateLessonInput>;
type resource = {
  title: string;
  url: string;
};
