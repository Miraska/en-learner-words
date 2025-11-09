-- CreateTable
CREATE TABLE "public"."DictionaryLike" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dictionaryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DictionaryLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryLike_userId_dictionaryId_key" ON "public"."DictionaryLike"("userId", "dictionaryId");

-- AddForeignKey
ALTER TABLE "public"."DictionaryLike" ADD CONSTRAINT "DictionaryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DictionaryLike" ADD CONSTRAINT "DictionaryLike_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "public"."Dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
