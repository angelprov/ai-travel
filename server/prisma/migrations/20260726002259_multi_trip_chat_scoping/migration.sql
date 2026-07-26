-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tripId" TEXT,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChatMessage" ("attachments", "createdAt", "id", "role", "status", "text", "userId") SELECT "attachments", "createdAt", "id", "role", "status", "text", "userId" FROM "ChatMessage";
DROP TABLE "ChatMessage";
ALTER TABLE "new_ChatMessage" RENAME TO "ChatMessage";

-- Data migration: backfill tripId on pre-existing messages from the old
-- one-trip-per-user invariant, which still holds at this point in the
-- migration (the old "Trip" table, with its old userId-unique data, hasn't
-- been rebuilt yet below) — every existing message unambiguously belonged
-- to that user's single trip, if they had one. Messages for users with no
-- trip yet are left with tripId = NULL (harmless, pre-trip chatter that the
-- new per-trip chat repo never needs to surface).
UPDATE "ChatMessage" SET "tripId" = (SELECT "id" FROM "Trip" WHERE "Trip"."userId" = "ChatMessage"."userId" LIMIT 1) WHERE "tripId" IS NULL;

CREATE INDEX "ChatMessage_tripId_createdAt_idx" ON "ChatMessage"("tripId", "createdAt");
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "travelerCount" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("createdAt", "destination", "destinationId", "endDate", "id", "startDate", "travelerCount", "updatedAt", "userId") SELECT "createdAt", "destination", "destinationId", "endDate", "id", "startDate", "travelerCount", "updatedAt", "userId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE INDEX "Trip_userId_createdAt_idx" ON "Trip"("userId", "createdAt");

-- Data migration: existing trips all pre-date the draft/active distinction
-- and already have real itinerary content, so they're "active", not "draft".
UPDATE "Trip" SET "status" = 'active' WHERE EXISTS (SELECT 1 FROM "Day" WHERE "Day"."tripId" = "Trip"."id");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
