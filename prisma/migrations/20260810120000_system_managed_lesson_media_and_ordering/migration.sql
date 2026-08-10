ALTER TYPE "MediaType" ADD VALUE 'url';

ALTER TABLE "Lesson" DROP COLUMN "resources";

ALTER TABLE "Media" ALTER COLUMN "cloudinaryResourceType" DROP DEFAULT;
ALTER TABLE "Media" ALTER COLUMN "cloudinaryResourceType" DROP NOT NULL;
