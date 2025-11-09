-- Add nullable unique nickname column to users
ALTER TABLE "User" ADD COLUMN "nickname" TEXT;

-- Create unique index on nickname
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");


