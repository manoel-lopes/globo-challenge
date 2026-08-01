import { isAxiosError } from 'axios'

interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error: string
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was invalid.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  413: 'The file exceeds the maximum allowed size.',
  415: 'This file type is not supported.',
  422: 'The submitted data is invalid.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
}

function getApiMessage(body: ApiErrorBody): string {
  if (Array.isArray(body.message)) return body.message[0] ?? 'Something went wrong.'
  return body.message
}

export function getErrorMessage(error: unknown): string {
  if (!isAxiosError<ApiErrorBody>(error)) return 'An unexpected error occurred.'
  if (!error.response) return 'Network error. Check your connection and try again.'

  const { status, data } = error.response
  if (data?.message) return getApiMessage(data)
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]
  if (status >= 500) return 'Server error. Please try again later.'
  return `Request failed (${status}).`
}
