import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ListLogEntriesUseCase } from '@/domain/application/usecases/list-log-entries/list-log-entries.usecase'
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import { ListLogsQueryDto, listLogsQuerySchema } from './ports/list-logs.protocol'

@ApiTags('Logs')
@Controller('logs')
export class ListLogsController {
  constructor (private readonly listLogEntriesUseCase: ListLogEntriesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List and filter log entries' })
  @ApiOkResponse('Log entries listed successfully')
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  async handle (
    @Query(new ZodValidationPipe(listLogsQuerySchema)) query: ListLogsQueryDto
  ) {
    return this.listLogEntriesUseCase.execute(query)
  }
}
