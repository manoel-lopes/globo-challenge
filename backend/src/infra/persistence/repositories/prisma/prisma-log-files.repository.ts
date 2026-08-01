import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import type {
  LogFileCreateInput,
  LogFileProgressUpdate,
  LogFilesRepository,
} from '@/domain/application/repositories/log-files.repository'
import { ChecksumConflictError } from '@/domain/application/usecases/import-log-file/errors/checksum-conflict.error'
import { formatPagination } from '@/infra/persistence/helpers/format-pagination.helper'
import { PrismaLogFileMapper } from '@/infra/persistence/mappers/prisma-log-file.mapper'
import { PrismaService } from '@/infra/persistence/prisma.service'
import type { LogFile } from '@/domain/enterprise/entities/log-file/log-file.entity'

@Injectable()
export class PrismaLogFilesRepository implements LogFilesRepository {
  constructor (private readonly prisma: PrismaService) {}

  async create (data: LogFileCreateInput): Promise<LogFile> {
    const logFile = await this.prisma.logFile.create({
      data: {
        filename: data.filename,
        status: data.status ?? 'PENDING',
      },
    })
    return PrismaLogFileMapper.toDomain(logFile)
  }

  async findById (id: string): Promise<LogFile | null> {
    const logFile = await this.prisma.logFile.findUnique({ where: { id } })
    return logFile ? PrismaLogFileMapper.toDomain(logFile) : null
  }

  async findDuplicateByChecksum (checksum: string): Promise<LogFile | null> {
    const logFile = await this.prisma.logFile.findFirst({
      where: {
        checksum,
        status: { not: 'FAILED' },
      },
      orderBy: { createdAt: 'asc' },
    })
    return logFile ? PrismaLogFileMapper.toDomain(logFile) : null
  }

  async findMany (params: PaginationParams): Promise<PaginatedItems<LogFile>> {
    const { page, pageSize, skip, take } = formatPagination(
      params.page ?? 1,
      params.pageSize ?? 10
    )
    const order = params.order ?? 'desc'
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.logFile.findMany({
        skip,
        take,
        orderBy: { createdAt: order },
      }),
      this.prisma.logFile.count(),
    ])
    return {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      items: items.map((item) => PrismaLogFileMapper.toDomain(item)),
      order,
    }
  }

  async save (logFile: LogFile): Promise<LogFile> {
    const data = PrismaLogFileMapper.toPersistence(logFile)
    try {
      const updated = await this.prisma.logFile.update({
        where: { id: logFile.id },
        data: {
          filename: data.filename,
          status: data.status,
          checksum: data.checksum,
          sizeBytes: data.sizeBytes,
          totalLines: data.totalLines,
          processedLines: data.processedLines,
          failedLines: data.failedLines,
          processedAt: data.processedAt,
        },
      })
      return PrismaLogFileMapper.toDomain(updated)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ChecksumConflictError()
      }
      throw error
    }
  }

  async claimForProcessing (id: string): Promise<LogFile | null> {
    const result = await this.prisma.logFile.updateMany({
      where: {
        id,
        status: { in: ['PENDING', 'FAILED'] },
      },
      data: { status: 'PROCESSING' },
    })
    if (result.count === 0) return null
    return this.findById(id)
  }

  async update (id: string, data: LogFileProgressUpdate): Promise<LogFile> {
    const updated = await this.prisma.logFile.update({
      where: { id },
      data,
    })
    return PrismaLogFileMapper.toDomain(updated)
  }

  async delete (id: string): Promise<void> {
    await this.prisma.logFile.delete({ where: { id } })
  }

  async count (): Promise<number> {
    return this.prisma.logFile.count()
  }
}
