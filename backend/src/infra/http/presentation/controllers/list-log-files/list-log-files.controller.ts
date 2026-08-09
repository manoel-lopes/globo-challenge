import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { PaginationParams } from '@/core/domain/application/pagination-params'
import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import {
  listLogFilesQuerySchema,
} from './ports/list-log-files.protocol'

@ApiTags('Log Files')
@Controller('log-files')
export class ListLogFilesController {
  constructor (private readonly logFilesRepository: LogFilesRepository) {}

  @Get()
  @ApiOperation({ summary: 'List imported log files' })
  @ApiOkResponse('Log files listed successfully')
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  async handle (
    @Query(new ZodValidationPipe(listLogFilesQuerySchema)) req: PaginationParams
  ) {
    return this.logFilesRepository.findMany({
      page: req.page ?? 1,
      pageSize: req.pageSize ?? 10,
      order: req.order ?? 'desc',
    })
  }
}
