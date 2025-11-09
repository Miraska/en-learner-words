-- CreateTable
CREATE TABLE "public"."UserWordTranslation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWordTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWordTranslation_userId_wordId_text_key" ON "public"."UserWordTranslation"("userId", "wordId", "text");

-- AddForeignKey
ALTER TABLE "public"."UserWordTranslation" ADD CONSTRAINT "UserWordTranslation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWordTranslation" ADD CONSTRAINT "UserWordTranslation_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
