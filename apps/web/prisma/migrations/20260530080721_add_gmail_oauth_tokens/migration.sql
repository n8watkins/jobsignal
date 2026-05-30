-- AlterTable
ALTER TABLE "EmailEvent" ADD COLUMN "correctedClassification" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleTokenExpiry" DATETIME;
