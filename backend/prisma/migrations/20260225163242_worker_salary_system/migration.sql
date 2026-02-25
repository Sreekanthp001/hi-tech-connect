/*
  Warnings:

  - You are about to drop the column `workerId` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_workerId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "workerId",
ADD COLUMN     "telegramId" TEXT;

-- AlterTable
ALTER TABLE "TicketPhoto" ADD COLUMN     "workerId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "designation" TEXT;

-- CreateTable
CREATE TABLE "WorkerFinance" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "baseSalary" DOUBLE PRECISION,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAdvance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerFinance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAdvance" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkerFinance_workerId_key" ON "WorkerFinance"("workerId");

-- AddForeignKey
ALTER TABLE "TicketPhoto" ADD CONSTRAINT "TicketPhoto_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerFinance" ADD CONSTRAINT "WorkerFinance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAdvance" ADD CONSTRAINT "WorkerAdvance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
