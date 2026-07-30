import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetLogEntryByIdUseCase } from '@/domain/application/usecases/get-log-entry-by-id/get-log-entry-by-id.usecase'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'
import {
  GetLogEntryByIdParamsDto,
  getLogEntryByIdParamsSchema,
} from './ports/get-log-entry-by-id.protocol'

@ApiTags('Logs')
@Controller('logs/:id')
export class GetLogEntryByIdController {
  constructor (private readonly getLogEntryByIdUseCase: GetLogEntryByIdUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Get a log entry by id' })
  @ApiOkResponse('Log entry retrieved successfully')
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Log entry not found')
  @ApiUnprocessableEntityResponse()
  async handle (
    @Param(new ZodValidationPipe(getLogEntryByIdParamsSchema)) params: GetLogEntryByIdParamsDto
  ) {
    try {
      return await this.getLogEntryByIdUseCase.execute({ id: params.id })
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }
      throw error
    }
  }
}
