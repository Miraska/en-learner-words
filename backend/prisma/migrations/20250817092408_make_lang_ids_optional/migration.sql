/*
  Warnings:

  - Made the column `sourceLangId` on table `Dictionary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `targetLangId` on table `Dictionary` required. This step will fail if there are existing NULL values in that column.
  - Made the column `languageId` on table `Word` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Dictionary" DROP CONSTRAINT "Dictionary_sourceLangId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Dictionary" DROP CONSTRAINT "Dictionary_targetLangId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Word" DROP CONSTRAINT "Word_languageId_fkey";

-- AlterTable
ALTER TABLE "public"."Dictionary" ALTER COLUMN "sourceLangId" SET NOT NULL,
ALTER COLUMN "targetLangId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Word" ALTER COLUMN "languageId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Dictionary" ADD CONSTRAINT "Dictionary_sourceLangId_fkey" FOREIGN KEY ("sourceLangId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dictionary" ADD CONSTRAINT "Dictionary_targetLangId_fkey" FOREIGN KEY ("targetLangId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Word" ADD CONSTRAINT "Word_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
