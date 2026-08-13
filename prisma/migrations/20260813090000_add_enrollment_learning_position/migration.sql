CREATE TYPE "LearningItemType" AS ENUM ('lesson', 'quiz');

ALTER TABLE "Enrollment"
ADD COLUMN "lastLearningType" "LearningItemType",
ADD COLUMN "lastLearningItemId" TEXT;
