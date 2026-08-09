-- Preserve the historical percentage-based full mark for existing quizzes.
ALTER TABLE "Quiz" ADD COLUMN "totalMark" DOUBLE PRECISION NOT NULL DEFAULT 100;
ALTER TABLE "Quiz" ALTER COLUMN "totalMark" DROP DEFAULT;

ALTER TABLE "QuizAttempt" ADD COLUMN "earnedMark" DOUBLE PRECISION;
