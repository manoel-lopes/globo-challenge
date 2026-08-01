import { format, formatDistanceToNow, isValid } from 'date-fns'

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (!isValid(date)) return value
  return format(date, 'MMM d, yyyy HH:mm:ss')
}

export function formatShortDate(value: string): string {
  const date = new Date(value)
  if (!isValid(date)) return value
  return format(date, 'MMM d, HH:mm')
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (!isValid(date)) return value
  return formatDistanceToNow(date, { addSuffix: true })
}
