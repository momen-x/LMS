-- Preserve every existing quiz by deriving its course through Lesson -> Section.
ALTER TABLE "Quiz" ADD COLUMN "courseId" TEXT;

UPDATE "Quiz" AS quiz
SET "courseId" = section."courseId"
FROM "Lesson" AS lesson
JOIN "Section" AS section ON section."id" = lesson."sectionId"
WHERE quiz."lessonId" = lesson."id";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Quiz" WHERE "courseId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate Quiz.courseId: one or more quizzes have no valid lesson/section/course';
  END IF;
END $$;

ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_lessonId_fkey";
ALTER TABLE "Quiz" ALTER COLUMN "courseId" SET NOT NULL;
ALTER TABLE "Quiz" DROP COLUMN "lessonId";

CREATE INDEX "Quiz_courseId_idx" ON "Quiz"("courseId");

ALTER TABLE "Quiz"
ADD CONSTRAINT "Quiz_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
