-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('classic', 'marathon', 'timeAttack');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('active', 'finished');

-- CreateEnum
CREATE TYPE "QuestionOrigin" AS ENUM ('ai', 'seed');

-- CreateEnum
CREATE TYPE "QuestionScope" AS ENUM ('global', 'local');

-- CreateEnum
CREATE TYPE "ClassicOutcome" AS ENUM ('won', 'walked', 'lost', 'timeout');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarPath" TEXT,
    "googleAvatarUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "scope" "QuestionScope" NOT NULL DEFAULT 'global',
    "text" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "origin" "QuestionOrigin" NOT NULL DEFAULT 'ai',
    "model" TEXT,
    "hash" TEXT NOT NULL,
    "servedCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionReport" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reporterKey" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL,
    "locale" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'active',
    "score" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalAnswerMs" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "currentQuestionId" TEXT,
    "currentOrder" INTEGER[],
    "removedIndexes" INTEGER[],
    "questionShownAt" TIMESTAMP(3),
    "currentDeadline" TIMESTAMP(3),
    "lifelinesUsed" TEXT[],
    "servedQuestionIds" TEXT[],

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassicGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "reachedStage" INTEGER NOT NULL,
    "winnings" INTEGER NOT NULL,
    "outcome" "ClassicOutcome" NOT NULL,
    "lifelinesUsed" TEXT[],
    "settings" JSONB NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassicGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("userId","badgeId")
);

-- CreateTable
CREATE TABLE "GenerationDemand" (
    "locale" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "lastRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationDemand_pkey" PRIMARY KEY ("locale","level")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_displayName_idx" ON "User" USING GIN ("displayName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Question_locale_level_category_idx" ON "Question"("locale", "level", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Question_locale_hash_key" ON "Question"("locale", "hash");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionReport_questionId_reporterKey_key" ON "QuestionReport"("questionId", "reporterKey");

-- CreateIndex
CREATE INDEX "Run_mode_status_score_idx" ON "Run"("mode", "status", "score" DESC);

-- CreateIndex
CREATE INDEX "Run_userId_mode_idx" ON "Run"("userId", "mode");

-- CreateIndex
CREATE INDEX "ClassicGame_userId_winnings_idx" ON "ClassicGame"("userId", "winnings" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ClassicGame_userId_clientId_key" ON "ClassicGame"("userId", "clientId");

-- AddForeignKey
ALTER TABLE "QuestionReport" ADD CONSTRAINT "QuestionReport_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassicGame" ADD CONSTRAINT "ClassicGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
