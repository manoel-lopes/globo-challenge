-- Partial unique index: at most one non-FAILED LogFile per checksum.
-- FAILED rows keep their checksum so re-upload after failure is allowed.
DROP INDEX IF EXISTS "log_files_checksum_idx";

CREATE UNIQUE INDEX "log_files_checksum_active_key"
ON "log_files" ("checksum")
WHERE "checksum" IS NOT NULL AND "status" <> 'FAILED';
