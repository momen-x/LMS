/*
  Warnings:

  - You are about to drop the column `url` on the `Media` table. All the data in the column will be lost.
  - Added the required column `urlPublicId` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "thumbnailPublicId" TEXT;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "url",
ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "urlPublicId" TEXT NOT NULL;
