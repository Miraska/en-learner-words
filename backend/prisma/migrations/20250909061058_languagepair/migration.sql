-- AlterTable
ALTER TABLE "public"."UserWord" ADD COLUMN     "languagePairId" INTEGER;

-- CreateTable
CREATE TABLE "public"."LanguagePair" (
    "id" SERIAL NOT NULL,
    "sourceLangId" INTEGER NOT NULL,
    "targetLangId" INTEGER NOT NULL,

    CONSTRAINT "LanguagePair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LanguagePair_sourceLangId_targetLangId_key" ON "public"."LanguagePair"("sourceLangId", "targetLangId");

-- AddForeignKey
ALTER TABLE "public"."LanguagePair" ADD CONSTRAINT "LanguagePair_sourceLangId_fkey" FOREIGN KEY ("sourceLangId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LanguagePair" ADD CONSTRAINT "LanguagePair_targetLangId_fkey" FOREIGN KEY ("targetLangId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWord" ADD CONSTRAINT "UserWord_languagePairId_fkey" FOREIGN KEY ("languagePairId") REFERENCES "public"."LanguagePair"("id") ON DELETE SET NULL ON UPDATE CASCADE;
