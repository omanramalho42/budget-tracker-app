-- CreateTable
CREATE TABLE "UserSettings" (
    "currency" TEXT NOT NULL,
    "userId" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Category" (
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'income',
    "icon" TEXT NOT NULL,
    "userId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'income',
    "category" TEXT NOT NULL,
    "categoryIcon" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MonthHistory" (
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "income" REAL NOT NULL,
    "expanse" REAL NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("day", "month", "year", "userId")
);

-- CreateTable
CREATE TABLE "YearHistory" (
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "income" REAL NOT NULL,
    "expanse" REAL NOT NULL,

    PRIMARY KEY ("month", "year", "userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_userId_type_key" ON "Category"("name", "userId", "type");
