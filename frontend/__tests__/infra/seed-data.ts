import type { LogEntry, LogLevel } from '@/core/domain/entities/log-entry'
import type { LogFile } from '@/core/domain/entities/log-file'
import { createLogEntry } from './factories/log-entry-factory'
import { createLogFile } from './factories/log-file-factory'

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function agoIso(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

export interface SeedData {
  logFiles: LogFile[]
  logEntries: LogEntry[]
}

const CHECKOUT_SOURCES = ['checkout-api', 'checkout-worker', 'checkout-db']
const CHECKOUT_COUNT = 130

function checkoutLevel(index: number): LogLevel {
  if (index === CHECKOUT_COUNT - 1) return 'FATAL'
  if (index % 25 === 0) return 'ERROR'
  if (index % 10 === 0) return 'WARN'
  if (index % 3 === 0) return 'DEBUG'
  return 'INFO'
}

function buildCheckoutEntries(logFileId: string): LogEntry[] {
  return Array.from({ length: CHECKOUT_COUNT }, (_, index) => {
    const level = checkoutLevel(index)
    const source = CHECKOUT_SOURCES[index % CHECKOUT_SOURCES.length]
    const offsetMs = 5 * MINUTE_MS + (index * (18 * HOUR_MS)) / (CHECKOUT_COUNT - 1)
    const timestamp = agoIso(offsetMs)
    const message = `${source} handled checkout request #${1000 + index}`
    const isError = level === 'ERROR' || level === 'FATAL'
    return createLogEntry({
      logFileId,
      level,
      timestamp,
      source,
      message,
      metadata: isError ? { orderId: `ORD-${1000 + index}` } : null,
    })
  })
}

const PAYMENTS_SOURCES = ['payments-api', 'payments-gateway']
const PAYMENTS_LEVELS: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'ERROR', 'INFO']
const PAYMENTS_COUNT = 15

function buildPaymentsEntries(logFileId: string): LogEntry[] {
  return Array.from({ length: PAYMENTS_COUNT }, (_, index) => {
    const level = PAYMENTS_LEVELS[index % PAYMENTS_LEVELS.length]
    const source = PAYMENTS_SOURCES[index % PAYMENTS_SOURCES.length]
    const offsetMs = HOUR_MS + (index * (69 * HOUR_MS)) / (PAYMENTS_COUNT - 1)
    const timestamp = agoIso(offsetMs)
    const message =
      level === 'ERROR'
        ? `${source} failed to capture payment #${2000 + index}`
        : `${source} processed payment #${2000 + index}`
    return createLogEntry({
      logFileId,
      level,
      timestamp,
      source,
      message,
      metadata: level === 'ERROR' ? { paymentId: `PAY-${2000 + index}` } : null,
    })
  })
}

const AUTH_SOURCES = ['auth-service', 'auth-db']
const AUTH_COUNT = 20

function authLevel(index: number): LogLevel {
  if (index % 7 === 0) return 'ERROR'
  if (index % 2 === 0) return 'WARN'
  return 'INFO'
}

function buildAuthEntries(logFileId: string): LogEntry[] {
  return Array.from({ length: AUTH_COUNT }, (_, index) => {
    const level = authLevel(index)
    const source = AUTH_SOURCES[index % AUTH_SOURCES.length]
    const daysAgo = 5 + index * 3
    const timestamp = agoIso(daysAgo * DAY_MS)
    const message =
      level === 'ERROR'
        ? `${source} rejected login attempt for user #${3000 + index}`
        : `${source} authenticated user #${3000 + index}`
    return createLogEntry({ logFileId, level, timestamp, source, message })
  })
}

const FILLER_FILENAMES = [
  'notification-service.log',
  'billing-service.log',
  'search-service.log',
  'inventory-service.log',
  'email-service.log',
  'scheduler-service.log',
  'analytics-service.log',
  'gateway-service.log',
]

export function buildSeedData(): SeedData {
  const checkout = createLogFile({
    filename: 'checkout-service.log',
    status: 'COMPLETED',
    totalLines: 130,
    processedLines: 130,
    sizeBytes: 245_760,
    createdAt: agoIso(1 * HOUR_MS),
    processedAt: agoIso(0.9 * HOUR_MS),
    updatedAt: agoIso(0.9 * HOUR_MS),
  })
  const payments = createLogFile({
    filename: 'payments-service.log',
    status: 'COMPLETED',
    totalLines: 15,
    processedLines: 15,
    sizeBytes: 18_432,
    createdAt: agoIso(2 * HOUR_MS),
    processedAt: agoIso(1.9 * HOUR_MS),
    updatedAt: agoIso(1.9 * HOUR_MS),
  })
  const auth = createLogFile({
    filename: 'auth-service.log',
    status: 'COMPLETED',
    totalLines: 20,
    processedLines: 20,
    sizeBytes: 24_576,
    createdAt: agoIso(3 * HOUR_MS),
    processedAt: agoIso(2.9 * HOUR_MS),
    updatedAt: agoIso(2.9 * HOUR_MS),
  })
  const failedWorker = createLogFile({
    filename: 'worker-service.log',
    status: 'FAILED',
    totalLines: 500,
    processedLines: 0,
    failedLines: 500,
    sizeBytes: 512_000,
    createdAt: agoIso(4 * HOUR_MS),
    processedAt: agoIso(3.9 * HOUR_MS),
    updatedAt: agoIso(3.9 * HOUR_MS),
  })

  const fillerFiles = FILLER_FILENAMES.map((filename, index) => {
    const hoursAgo = 5 + index
    const totalLines = 25 + index * 5
    return createLogFile({
      filename,
      status: 'COMPLETED',
      totalLines,
      processedLines: totalLines,
      sizeBytes: (totalLines + 100) * 1024,
      createdAt: agoIso(hoursAgo * HOUR_MS),
      processedAt: agoIso((hoursAgo - 0.1) * HOUR_MS),
      updatedAt: agoIso((hoursAgo - 0.1) * HOUR_MS),
    })
  })

  const logFiles = [checkout, payments, auth, failedWorker, ...fillerFiles]
  const logEntries = [
    ...buildCheckoutEntries(checkout.id),
    ...buildPaymentsEntries(payments.id),
    ...buildAuthEntries(auth.id),
  ]

  return { logFiles, logEntries }
}
