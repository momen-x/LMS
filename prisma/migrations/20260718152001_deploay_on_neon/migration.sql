/*
  Warnings:

  - You are about to drop the column `studentId` on the `StudentAnswer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[attemptId,questionId]` on the table `StudentAnswer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attemptId` to the `StudentAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('in_progress', 'submitted');

-- DropForeignKey
ALTER TABLE "StudentAnswer" DROP CONSTRAINT "StudentAnswer_studentId_fkey";

-- DropIndex
DROP INDEX "StudentAnswer_studentId_questionId_key";

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "passingScore" INTEGER NOT NULL DEFAULT 50;

-- AlterTable
ALTER TABLE "StudentAnswer" DROP COLUMN "studentId",
ADD COLUMN     "attemptId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'in_progress',
    "score" DOUBLE PRECISION,
    "correctAnswers" INTEGER,
    "totalQuestions" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizAttempt_studentId_idx" ON "QuizAttempt"("studentId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "QuizAttempt_studentId_quizId_status_idx" ON "QuizAttempt"("studentId", "quizId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_studentId_quizId_attemptNumber_key" ON "QuizAttempt"("studentId", "quizId", "attemptNumber");

-- CreateIndex
CREATE INDEX "StudentAnswer_attemptId_idx" ON "StudentAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "StudentAnswer_questionId_idx" ON "StudentAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAnswer_attemptId_questionId_key" ON "StudentAnswer"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
