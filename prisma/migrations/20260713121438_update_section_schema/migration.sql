/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Lesson` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;
