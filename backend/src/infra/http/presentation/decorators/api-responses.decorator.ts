import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

export function ApiCreatedResponse (description = 'Resource created successfully') {
  return applyDecorators(
    ApiResponse({ status: 201, description })
  )
}

export function ApiOkResponse (description = 'Request successful') {
  return applyDecorators(
    ApiResponse({ status: 200, description })
  )
}

export function ApiNoContentResponse (description = 'Request successful, no content returned') {
  return applyDecorators(
    ApiResponse({ status: 204, description })
  )
}

export function ApiBadRequestResponse () {
  return applyDecorators(
    ApiResponse({ status: 400, description: 'Bad request - validation error' })
  )
}

export function ApiUnauthorizedResponse (description = 'Unauthorized - invalid or missing authentication token') {
  return applyDecorators(
    ApiResponse({ status: 401, description })
  )
}

export function ApiForbiddenResponse (description = 'Forbidden - user is not the author') {
  return applyDecorators(
    ApiResponse({ status: 403, description })
  )
}

export function ApiNotFoundResponse (description = 'Resource not found') {
  return applyDecorators(
    ApiResponse({ status: 404, description })
  )
}

export function ApiConflictResponse (description = 'Conflict - resource already exists') {
  return applyDecorators(
    ApiResponse({ status: 409, description })
  )
}

export function ApiUnprocessableEntityResponse () {
  return applyDecorators(
    ApiResponse({ status: 422, description: 'Unprocessable entity - validation error' })
  )
}

export function ApiInternalServerErrorResponse () {
  return applyDecorators(
    ApiResponse({ status: 500, description: 'Internal server error' })
  )
}
