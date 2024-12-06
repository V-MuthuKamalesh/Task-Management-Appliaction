/*
  Warnings:

  - You are about to drop the column `username` on the `Task` table. All the data in the column will be lost.
  - Added the required column `assignedTo` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_username_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "username",
ADD COLUMN     "assignedTo" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
