import { Injectable } from '@nestjs/common'
import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import type {
  LogFileCreateInput,
  LogFileProgressUpdate,
  LogFilesRepository,
} from '@/domain/application/repositories/log-files.repository'
import { formatPagination } from '@/infra/persistence/helpers/format-pagination.helper'
import { PrismaService } from '@/infra/persistence/prisma.service'
import type { LogFile } from '@/domain/enterprise/entities/log-file.entity'

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
    return logFile
  }

  async findById (id: string): Promise<LogFile | null> {
    return this.prisma.logFile.findUnique({ where: { id } })
  }

  async findDuplicateByChecksum (checksum: string): Promise<LogFile | null> {
    return this.prisma.logFile.findFirst({
      where: {
        checksum,
        status: { not: 'FAILED' },
      },
      orderBy: { createdAt: 'asc' },
    })
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
      items,
      order,
    }
  }

  async update (id: string, data: LogFileProgressUpdate): Promise<LogFile> {
    return this.prisma.logFile.update({
      where: { id },
      data,
    })
  }

  async delete (id: string): Promise<void> {
    await this.prisma.logFile.delete({ where: { id } })
  }

  async count (): Promise<number> {
    return this.prisma.logFile.count()
  }
}
