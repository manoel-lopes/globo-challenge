import type { LogFile as PrismaLogFile } from '@prisma/client'
import { LogFile } from '@/domain/enterprise/entities/log-file/log-file.entity'

export class PrismaLogFileMapper {
  static toDomain (raw: PrismaLogFile): LogFile {
    return LogFile.restore({
      id: raw.id,
      filename: raw.filename,
      status: raw.status,
      checksum: raw.checksum,
      sizeBytes: raw.sizeBytes,
      totalLines: raw.totalLines,
      processedLines: raw.processedLines,
      failedLines: raw.failedLines,
      processedAt: raw.processedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  static toPersistence (logFile: LogFile) {
    const snapshot = logFile.toJSON()
    return {
      id: snapshot.id,
      filename: snapshot.filename,
      status: snapshot.status,
      checksum: snapshot.checksum,
      sizeBytes: snapshot.sizeBytes,
      totalLines: snapshot.totalLines,
      processedLines: snapshot.processedLines,
      failedLines: snapshot.failedLines,
      processedAt: snapshot.processedAt,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    }
  }
}
