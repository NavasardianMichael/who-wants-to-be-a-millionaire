-- DropIndex
DROP INDEX "Question_locale_level_category_idx";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "ranked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "usedPublicQuestions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "GenerationDemand" DROP CONSTRAINT "GenerationDemand_pkey",
ADD COLUMN     "ranked" BOOLEAN NOT NULL DEFAULT false,
ADD CONSTRAINT "GenerationDemand_pkey" PRIMARY KEY ("locale", "level", "ranked");

-- CreateIndex
CREATE INDEX "Question_locale_ranked_level_category_idx" ON "Question"("locale", "ranked", "level", "category");

