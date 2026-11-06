-- Marathon and Time Attack now need an account. Guest runs never reached the leaderboard
-- and can no longer be resumed, so they are removed before userId becomes required.
DELETE FROM "Run" WHERE "userId" IS NULL;

-- DropIndex
DROP INDEX "Run_guestId_mode_idx";

-- AlterTable
ALTER TABLE "Run" DROP COLUMN "guestId",
ALTER COLUMN "userId" SET NOT NULL;
