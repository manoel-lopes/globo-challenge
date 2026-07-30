import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ListLogFilesUseCase } from '@/domain/application/usecases/list-log-files/list-log-files.usecase'
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import {
  ListLogFilesQueryDto,
  listLogFilesQuerySchema,
} from './ports/list-log-files.protocol'

@ApiTags('Log Files')
@Controller('log-files')
export class ListLogFilesController {
  constructor (private readonly listLogFilesUseCase: ListLogFilesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List imported log files' })
  @ApiOkResponse('Log files listed successfully')
  @ApiBadRequestResponse()
  @ApiUnprocessableEntityResponse()
  async handle (
    @Query(new ZodValidationPipe(listLogFilesQuerySchema)) query: ListLogFilesQueryDto
  ) {
    return this.listLogFilesUseCase.execute(query)
  }
}
