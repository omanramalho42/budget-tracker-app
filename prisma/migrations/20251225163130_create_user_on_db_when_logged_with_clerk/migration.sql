/*
  Warnings:

  - A unique constraint covering the columns `[id,email,clerkUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_clerkUserId_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_id_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_id_email_clerkUserId_key" ON "User"("id", "email", "clerkUserId");
