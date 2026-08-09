export type CreateQUizInputs = {
  title: string;
  questionBankId: string;
  questionCount: number;
  passingScore?: number;
  maxAttempts?: number;
  duration: number;
};
export type UpdateQuizInputs = Partial<CreateQUizInputs>;
