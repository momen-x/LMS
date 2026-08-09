-- Preserve existing quiz/question data by creating one question bank per quiz.
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

INSERT INTO "QuestionBank" ("id", "courseId", "title", "createdAt", "updatedAt")
SELECT 'migrated-bank-' || q."id", s."courseId", q."title" || ' Question Bank', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Quiz" q
JOIN "Lesson" l ON l."id" = q."lessonId"
JOIN "Section" s ON s."id" = l."sectionId";

ALTER TABLE "Quiz" ADD COLUMN "questionBankId" TEXT;
ALTER TABLE "Quiz" ADD COLUMN "questionCount" INTEGER;
UPDATE "Quiz" q SET
  "questionBankId" = 'migrated-bank-' || q."id",
  "questionCount" = GREATEST(1, (SELECT COUNT(*)::INTEGER FROM "Question" question WHERE question."quizId" = q."id"));
ALTER TABLE "Quiz" ALTER COLUMN "questionBankId" SET NOT NULL;
ALTER TABLE "Quiz" ALTER COLUMN "questionCount" SET NOT NULL;

ALTER TABLE "Question" ADD COLUMN "questionBankId" TEXT;
UPDATE "Question" SET "questionBankId" = 'migrated-bank-' || "quizId";
ALTER TABLE "Question" ALTER COLUMN "questionBankId" SET NOT NULL;

CREATE TABLE "QuizAttemptQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "QuizAttemptQuestion_pkey" PRIMARY KEY ("id")
);

INSERT INTO "QuizAttemptQuestion" ("id", "attemptId", "questionId", "order")
SELECT 'migrated-aq-' || md5(a."id" || ':' || q."id"), a."id", q."id",
       ROW_NUMBER() OVER (PARTITION BY a."id" ORDER BY q."createdAt", q."id")::INTEGER
FROM "QuizAttempt" a
JOIN "Question" q ON q."quizId" = a."quizId";

ALTER TABLE "StudentAnswer" RENAME TO "QuizAttemptAnswer";
ALTER TABLE "QuizAttemptAnswer" RENAME CONSTRAINT "StudentAnswer_pkey" TO "QuizAttemptAnswer_pkey";
ALTER INDEX "StudentAnswer_attemptId_idx" RENAME TO "QuizAttemptAnswer_attemptId_idx";
ALTER INDEX "StudentAnswer_questionId_idx" RENAME TO "QuizAttemptAnswer_questionId_idx";
ALTER INDEX "StudentAnswer_attemptId_questionId_key" RENAME TO "QuizAttemptAnswer_attemptId_questionId_key";
ALTER TABLE "QuizAttemptAnswer" RENAME CONSTRAINT "StudentAnswer_attemptId_fkey" TO "QuizAttemptAnswer_attemptId_fkey";
ALTER TABLE "QuizAttemptAnswer" RENAME CONSTRAINT "StudentAnswer_choiceId_fkey" TO "QuizAttemptAnswer_choiceId_fkey";
ALTER TABLE "QuizAttemptAnswer" DROP CONSTRAINT "StudentAnswer_questionId_fkey";
ALTER TABLE "QuizAttemptAnswer" ADD CONSTRAINT "QuizAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Question" DROP CONSTRAINT "Question_quizId_fkey";
ALTER TABLE "Question" DROP COLUMN "quizId";

CREATE INDEX "QuestionBank_courseId_idx" ON "QuestionBank"("courseId");
CREATE INDEX "Quiz_questionBankId_idx" ON "Quiz"("questionBankId");
CREATE INDEX "Question_questionBankId_idx" ON "Question"("questionBankId");
CREATE INDEX "QuizAttemptQuestion_attemptId_idx" ON "QuizAttemptQuestion"("attemptId");
CREATE UNIQUE INDEX "QuizAttemptQuestion_attemptId_questionId_key" ON "QuizAttemptQuestion"("attemptId", "questionId");
CREATE UNIQUE INDEX "QuizAttemptQuestion_attemptId_order_key" ON "QuizAttemptQuestion"("attemptId", "order");

ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "QuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttemptQuestion" ADD CONSTRAINT "QuizAttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttemptQuestion" ADD CONSTRAINT "QuizAttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
