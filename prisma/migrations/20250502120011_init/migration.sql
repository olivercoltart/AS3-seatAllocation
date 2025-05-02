-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "row" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT
);
