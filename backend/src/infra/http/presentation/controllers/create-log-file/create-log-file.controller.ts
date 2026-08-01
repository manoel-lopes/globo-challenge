import type { FastifyRequest } from 'fastify'
import {
  BadRequestException,
  ConflictException,
  Controller,
  HttpCode,
  PayloadTooLargeException,
  Post,
  Req,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { DuplicateLogFileError } from '@/domain/application/usecases/import-log-file/errors/duplicate-log-file.error'
import { FileTooLargeError } from '@/domain/application/usecases/import-log-file/errors/file-too-large.error'
import { LogProcessingUnavailableError } from '@/domain/application/usecases/import-log-file/errors/log-processing-unavailable.error'
import { MissingLogFileError } from '@/domain/application/usecases/import-log-file/errors/missing-log-file.error'
import { UnsupportedFileTypeError } from '@/domain/application/usecases/import-log-file/errors/unsupported-file-type.error'
import { ImportLogFileUseCase } from '@/domain/application/usecases/import-log-file/import-log-file.usecase'
import { EnvService } from '@/infra/env/env.service'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiPayloadTooLargeResponse,
  ApiServiceUnavailableResponse,
  ApiUnprocessableEntityResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@/infra/http/presentation/decorators/api-responses.decorator'

@ApiTags('Log Files')
@Controller('log-files')
export class CreateLogFileController {
  constructor (
    private readonly importLogFileUseCase: ImportLogFileUseCase,
    private readonly envService: EnvService
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Upload and import a log file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse('Log file imported successfully')
  @ApiBadRequestResponse()
  @ApiConflictResponse('Conflict - a log file with identical content was already imported')
  @ApiPayloadTooLargeResponse()
  @ApiUnsupportedMediaTypeResponse('Unsupported media type - file extension is not a supported log format')
  @ApiUnprocessableEntityResponse()
  @ApiServiceUnavailableResponse()
  async handle (@Req() request: FastifyRequest) {
    const maxSize = this.envService.get('MAX_UPLOAD_SIZE')
    const syncMaxBytes = this.envService.get('LOG_SYNC_MAX_BYTES')
    const tempDir = this.envService.get('UPLOAD_TEMP_DIR')
    try {
      const isMultipart = typeof request.isMultipart === 'function' && request.isMultipart()
      if (!isMultipart) {
        throw new MissingLogFileError()
      }
      const file = await request.file({
        limits: { fileSize: maxSize },
      })
      if (!file) {
        throw new MissingLogFileError()
      }
      return await this.importLogFileUseCase.execute({
        filename: file.filename,
        mimetype: file.mimetype,
        maxSize,
        syncMaxBytes,
        tempDir,
        stream: file.file,
        isTruncated: () => file.file.truncated,
      })
    } catch (error) {
      if (error instanceof MissingLogFileError) {
        throw new BadRequestException(error.message)
      }
      if (error instanceof UnsupportedFileTypeError) {
        throw new UnsupportedMediaTypeException(error.message)
      }
      if (error instanceof FileTooLargeError) {
        throw new PayloadTooLargeException(error.message)
      }
      if (error instanceof DuplicateLogFileError) {
        throw new ConflictException(error.message)
      }
      if (error instanceof LogProcessingUnavailableError) {
        throw new ServiceUnavailableException(error.message)
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'FST_REQ_FILE_TOO_LARGE'
      ) {
        throw new PayloadTooLargeException(`File exceeds maximum allowed size of ${maxSize} bytes`)
      }
      throw error
    }
  }
}
