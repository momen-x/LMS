ALTER TABLE "Course" ALTER COLUMN "status" SET DEFAULT 'draft';

CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonProgress_enrollmentId_lessonId_key"
ON "LessonProgress"("enrollmentId", "lessonId");

CREATE INDEX "LessonProgress_enrollmentId_idx"
ON "LessonProgress"("enrollmentId");

CREATE INDEX "LessonProgress_lessonId_idx"
ON "LessonProgress"("lessonId");

ALTER TABLE "LessonProgress"
ADD CONSTRAINT "LessonProgress_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonProgress"
ADD CONSTRAINT "LessonProgress_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
