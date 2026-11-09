-- Classic questions a signed-in player was actually shown, on any device, so their later batches skip them.
CREATE TABLE "SeenQuestion" (
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeenQuestion_pkey" PRIMARY KEY ("userId","questionId")
);

CREATE INDEX "SeenQuestion_userId_seenAt_idx" ON "SeenQuestion"("userId", "seenAt" DESC);

ALTER TABLE "SeenQuestion" ADD CONSTRAINT "SeenQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
