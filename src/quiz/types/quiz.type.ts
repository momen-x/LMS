export type CreateQUizInputs = {
  title: string;
  passingScore?: number;
  maxAttempts?: number;
};
export type UpdateQuizInputs = Partial<CreateQUizInputs>;
