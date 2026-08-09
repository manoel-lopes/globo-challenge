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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch (exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>()
    if (exception instanceof HttpException) {
      const body = this.toErrorBody(exception)
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
      error: this.reasonPhrase(statusCode),
    })
  }

  private reasonPhrase (statusCode: number): string {
    return STATUS_CODES[statusCode] ?? 'Error'
  }

  private toErrorBody (exception: HttpException): ErrorResponseBody {
    const statusCode = exception.getStatus()
    const payload = exception.getResponse()
    if (typeof payload === 'string') {
      return { statusCode, message: payload, error: this.reasonPhrase(statusCode) }
    }
    if (!this.isErrorPayload(payload)) {
      return {
        statusCode,
        message: exception.message,
        error: this.reasonPhrase(statusCode),
      }
    }
    const message =
      typeof payload.message === 'string' || Array.isArray(payload.message)
        ? payload.message
        : exception.message
    return {
      statusCode,
      message,
      error: typeof payload.error === 'string' ? payload.error : this.reasonPhrase(statusCode),
    }
  }

  private isErrorPayload (value: unknown): value is { message?: unknown, error?: unknown } {
    return typeof value === 'object' && value !== null
  }
}
