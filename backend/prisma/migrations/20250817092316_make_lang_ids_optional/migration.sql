-- DropForeignKey
ALTER TABLE "public"."Dictionary" DROP CONSTRAINT "Dictionary_sourceLangId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Dictionary" DROP CONSTRAINT "Dictionary_targetLangId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Word" DROP CONSTRAINT "Word_languageId_fkey";

-- AlterTable
ALTER TABLE "public"."Dictionary" ALTER COLUMN "sourceLangId" DROP NOT NULL,
ALTER COLUMN "targetLangId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Word" ALTER COLUMN "languageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Dictionary" ADD CONSTRAINT "Dictionary_sourceLangId_fkey" FOREIGN KEY ("sourceLangId") REFERENCES "public"."Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dictionary" ADD CONSTRAINT "Dictionary_targetLangId_fkey" FOREIGN KEY ("targetLangId") REFERENCES "public"."Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Word" ADD CONSTRAINT "Word_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;
