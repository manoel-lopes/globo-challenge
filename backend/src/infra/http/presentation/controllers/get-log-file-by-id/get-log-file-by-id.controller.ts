import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetLogFileByIdUseCase } from '@/domain/application/usecases/get-log-file-by-id/get-log-file-by-id.usecase'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnprocessableEntityResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'
import { ZodValidationPipe } from '@/infra/http/presentation/pipes/zod-validation.pipe'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'
import {
  GetLogFileByIdParamsDto,
  getLogFileByIdParamsSchema,
} from './ports/get-log-file-by-id.protocol'

@ApiTags('Log Files')
@Controller('log-files/:id')
export class GetLogFileByIdController {
  constructor (private readonly getLogFileByIdUseCase: GetLogFileByIdUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Get a log file by id' })
  @ApiOkResponse('Log file retrieved successfully')
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Log file not found')
  @ApiUnprocessableEntityResponse()
  async handle (
    @Param(new ZodValidationPipe(getLogFileByIdParamsSchema)) params: GetLogFileByIdParamsDto
  ) {
    try {
      return await this.getLogFileByIdUseCase.execute({ id: params.id })
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message)
      }
      throw error
    }
  }
}
