import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { CursorPaginatedItems, LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import type { LogLevel } from '@/domain/enterprise/entities/log-entry/log-entry.entity'
import { ListLogsQueryDto, listLogsQuerySchema } from './ports/list-logs.protocol'

const LOG_LEVELS: Record<LogLevel, true> = {
  TRACE: true,
  DEBUG: true,
  INFO: true,
  WARN: true,
  ERROR: true,
  FATAL: true,
  UNKNOWN: true,
} as const

@ApiTags('Logs')
@Controller('logs')
export class ListLogsController {
  constructor (private readonly logEntriesRepository: LogEntriesRepository) {}

  @Get()
  @ApiOperation({ summary: 'List and filter log entries' })
  @ApiOkResponse('Log entries listed successfully')
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  async handle (
    @Query(new ZodValidationPipe(listLogsQuerySchema)) query: ListLogsQueryDto
  ): Promise<PaginatedItems<unknown> | CursorPaginatedItems<unknown>> {
    const filter = this.buildFilter(query)
    const useOffset = query.page !== undefined || query.pageSize !== undefined
    if (useOffset) {
      return this.logEntriesRepository.findMany(filter, {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        order: query.order ?? 'desc',
      })
    }
    return this.logEntriesRepository.findManyByCursor(filter, {
      cursor: query.cursor,
      limit: query.limit ?? 50,
      order: query.order ?? 'desc',
    })
  }

  private buildFilter (query: ListLogsQueryDto) {
    return {
      level: this.parseLevels(query.level),
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      q: query.q,
      logFileId: query.logFileId,
    }
  }

  private parseLevels (level?: string): LogLevel[] | undefined {
    if (!level) return undefined
    return level
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(this.isLogLevel)
  }

  private isLogLevel (value: string): value is LogLevel {
    return Object.hasOwn(LOG_LEVELS, value)
  }
}
