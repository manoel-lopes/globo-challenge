-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "LogFileStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'UNKNOWN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "LogFileStatus" NOT NULL DEFAULT 'PENDING',
    "totalLines" INTEGER NOT NULL DEFAULT 0,
    "processedLines" INTEGER NOT NULL DEFAULT 0,
    "failedLines" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "log_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_entries" (
    "id" TEXT NOT NULL,
    "logFileId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "message" TEXT NOT NULL,
    "rawLine" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "log_entries_logFileId_idx" ON "log_entries"("logFileId");

-- CreateIndex
CREATE INDEX "log_entries_level_timestamp_idx" ON "log_entries"("level", "timestamp");

-- CreateIndex
CREATE INDEX "log_entries_timestamp_idx" ON "log_entries"("timestamp");

-- CreateIndex
CREATE INDEX "log_entries_timestamp_id_idx" ON "log_entries"("timestamp", "id");

-- CreateIndex
CREATE INDEX "log_entries_message_idx" ON "log_entries" USING GIN ("message" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_logFileId_fkey" FOREIGN KEY ("logFileId") REFERENCES "log_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
