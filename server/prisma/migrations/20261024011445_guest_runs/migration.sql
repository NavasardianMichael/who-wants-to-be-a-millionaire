-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Run_guestId_mode_idx" ON "Run"("guestId", "mode");
