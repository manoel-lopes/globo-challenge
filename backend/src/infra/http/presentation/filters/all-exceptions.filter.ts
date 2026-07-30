import { STATUS_CODES } from 'node:http'
import type { FastifyReply } from 'fastify'
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

export type ErrorResponseBody = {
  statusCode: number
  message: string | string[]
  error: string
}

function reasonPhrase (statusCode: number): string {
  return STATUS_CODES[statusCode] ?? 'Error'
}

function toErrorBody (exception: HttpException): ErrorResponseBody {
  const statusCode = exception.getStatus()
  const payload = exception.getResponse()
  if (typeof payload === 'string') {
    return { statusCode, message: payload, error: reasonPhrase(statusCode) }
  }
  const record = payload as Record<string, unknown>
  const message = record.message ?? exception.message
  return {
    statusCode,
    message: message as string | string[],
    error: typeof record.error === 'string' ? record.error : reasonPhrase(statusCode),
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch (exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>()
    if (exception instanceof HttpException) {
      const body = toErrorBody(exception)
      reply.status(body.statusCode).send(body)
      return
    }
    this.logger.error(
      exception instanceof Error ? exception.message : 'Unhandled exception',
      exception instanceof Error ? exception.stack : undefined
    )
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    reply.status(statusCode).send({
      statusCode,
      message: 'Internal server error',
      error: reasonPhrase(statusCode),
    })
  }
}
