/*
  Warnings:

  - A unique constraint covering the columns `[habits_user_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[habits_clerk_user_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "habits_clerk_user_id" TEXT,
ADD COLUMN     "habits_linked_at" TIMESTAMP(3),
ADD COLUMN     "habits_user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_habits_user_id_key" ON "User"("habits_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_habits_clerk_user_id_key" ON "User"("habits_clerk_user_id");
