/*
  Warnings:

  - A unique constraint covering the columns `[userId,wordText,languageId]` on the table `UserWord` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."UserWord_userId_wordText_key";

-- AlterTable
ALTER TABLE "public"."UserWord" ADD COLUMN     "languageId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "UserWord_userId_wordText_languageId_key" ON "public"."UserWord"("userId", "wordText", "languageId");

-- AddForeignKey
ALTER TABLE "public"."UserWord" ADD CONSTRAINT "UserWord_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;
