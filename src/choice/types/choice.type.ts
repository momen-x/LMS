export type CreateChoiceInput = {
  text: string;
  isCorrect?: boolean;
};
export type UpdateChoiceInput = {
  text?: string;
  isCorrect?: boolean;
};
