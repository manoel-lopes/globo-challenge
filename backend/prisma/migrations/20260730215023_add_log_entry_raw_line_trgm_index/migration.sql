-- CreateIndex
CREATE INDEX "log_entries_rawLine_idx" ON "log_entries" USING GIN ("rawLine" gin_trgm_ops);
