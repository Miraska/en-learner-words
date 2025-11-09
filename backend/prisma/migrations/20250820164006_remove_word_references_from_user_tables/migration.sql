/*
 Warnings:
 
 - You are about to drop the column `wordId` on the `HintUsage` table. All the data in the column will be lost.
 - You are about to drop the column `wordId` on the `UserHardWord` table. All the data in the column will be lost.
 - You are about to drop the column `wordId` on the `UserWord` table. All the data in the column will be lost.
 - You are about to drop the `UserWordTranslation` table. If the table is not empty, all the data it contains will be lost.
 - A unique constraint covering the columns `[userId,wordText]` on the table `UserHardWord` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[userId,wordText]` on the table `UserWord` will be added. If there are existing duplicate values, this will fail.
 - Added the required column `wordText` to the `HintUsage` table without a default value. This is not possible if the table is not empty.
 - Added the required column `wordText` to the `UserHardWord` table without a default value. This is not possible if the table is not empty.
 - Added the required column `wordText` to the `UserWord` table without a default value. This is not possible if the table is not empty.
 
 */
-- First, add the new columns
ALTER TABLE "public"."HintUsage"
ADD COLUMN "wordText" TEXT;
ALTER TABLE "public"."UserHardWord"
ADD COLUMN "wordText" TEXT;
ALTER TABLE "public"."UserWord"
ADD COLUMN "wordText" TEXT;
-- Update existing data
UPDATE "public"."HintUsage"
SET "wordText" = (
    SELECT "word"
    FROM "public"."Word"
    WHERE "Word"."id" = "HintUsage"."wordId"
  );
UPDATE "public"."UserHardWord"
SET "wordText" = (
    SELECT "word"
    FROM "public"."Word"
    WHERE "Word"."id" = "UserHardWord"."wordId"
  );
UPDATE "public"."UserWord"
SET "wordText" = (
    SELECT "word"
    FROM "public"."Word"
    WHERE "Word"."id" = "UserWord"."wordId"
  );
-- Make columns NOT NULL
ALTER TABLE "public"."HintUsage"
ALTER COLUMN "wordText"
SET NOT NULL;
ALTER TABLE "public"."UserHardWord"
ALTER COLUMN "wordText"
SET NOT NULL;
ALTER TABLE "public"."UserWord"
ALTER COLUMN "wordText"
SET NOT NULL;
-- Remove duplicates from UserWord (keep the most recent one)
DELETE FROM "public"."UserWord"
WHERE id NOT IN (
    SELECT MAX(id)
    FROM "public"."UserWord"
    GROUP BY "userId",
      "wordText"
  );
-- DropForeignKey
ALTER TABLE "public"."HintUsage" DROP CONSTRAINT "HintUsage_wordId_fkey";
-- DropForeignKey
ALTER TABLE "public"."UserHardWord" DROP CONSTRAINT "UserHardWord_wordId_fkey";
-- DropForeignKey
ALTER TABLE "public"."UserWord" DROP CONSTRAINT "UserWord_wordId_fkey";
-- DropForeignKey
ALTER TABLE "public"."UserWordTranslation" DROP CONSTRAINT "UserWordTranslation_userId_fkey";
-- DropForeignKey
ALTER TABLE "public"."UserWordTranslation" DROP CONSTRAINT "UserWordTranslation_wordId_fkey";
-- DropIndex
DROP INDEX "public"."UserWord_userId_wordId_key";
-- Drop old columns
ALTER TABLE "public"."HintUsage" DROP COLUMN "wordId";
ALTER TABLE "public"."UserHardWord" DROP COLUMN "wordId";
ALTER TABLE "public"."UserWord" DROP COLUMN "wordId";
-- DropTable
DROP TABLE "public"."UserWordTranslation";
-- CreateIndex
CREATE UNIQUE INDEX "UserHardWord_userId_wordText_key" ON "public"."UserHardWord"("userId", "wordText");
-- CreateIndex
CREATE UNIQUE INDEX "UserWord_userId_wordText_key" ON "public"."UserWord"("userId", "wordText");