-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Language" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dictionary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "sourceLangId" INTEGER NOT NULL,
    "targetLangId" INTEGER NOT NULL,

    CONSTRAINT "Dictionary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Word" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "setId" INTEGER,
    "dictionaryId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WordSet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "dictionaryId" INTEGER NOT NULL,

    CONSTRAINT "WordSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserWord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,
    "learned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserHardWord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "wordId" INTEGER NOT NULL,

    CONSTRAINT "UserHardWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserStats" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "learnedCount" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "public"."Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "public"."UserStats"("userId");

-- AddForeignKey
ALTER TABLE "public"."Dictionary" ADD CONSTRAINT "Dictionary_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dictionary" ADD CONSTRAINT "Dictionary_sourceLangId_fkey" FOREIGN KEY ("sourceLangId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dictionary" ADD CONSTRAINT "Dictionary_targetLangId_fkey" FOREIGN KEY ("targetLangId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Word" ADD CONSTRAINT "Word_setId_fkey" FOREIGN KEY ("setId") REFERENCES "public"."WordSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Word" ADD CONSTRAINT "Word_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "public"."Dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Word" ADD CONSTRAINT "Word_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WordSet" ADD CONSTRAINT "WordSet_dictionaryId_fkey" FOREIGN KEY ("dictionaryId") REFERENCES "public"."Dictionary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWord" ADD CONSTRAINT "UserWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWord" ADD CONSTRAINT "UserWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserHardWord" ADD CONSTRAINT "UserHardWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserHardWord" ADD CONSTRAINT "UserHardWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
