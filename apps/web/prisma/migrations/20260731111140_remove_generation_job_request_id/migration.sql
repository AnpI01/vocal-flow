/*
  Warnings:

  - You are about to drop the column `ttsRequestId` on the `GenerationJob` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GenerationJob_ttsRequestId_key";

-- AlterTable
ALTER TABLE "GenerationJob" DROP COLUMN "ttsRequestId";
